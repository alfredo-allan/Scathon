import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FloatingDock } from "@/components/layout/FloatingDock";
import { MetaPixelRouteTracker } from "@/components/analytics/MetaPixelRouteTracker";

// Meta (Facebook/Instagram) Pixel ID - used to load the tracking script below
// and in its <noscript> fallback. Kept as one constant so there is a single
// place to update it if the ad account's pixel ever changes.
const META_PIXEL_ID = "572350051694027";

// Using the system font stack (defined in globals.css) instead of
// next/font/google (Geist) so the build never depends on reaching
// fonts.googleapis.com - handy behind restrictive proxies/offline dev,
// and one less external request in production. Swap in next/font/local
// with a self-hosted variable font, or next/font/google once network
// access is confirmed, whenever a custom brand typeface is ready.

export const metadata: Metadata = {
  title: "Scathon — Loja de Streetwear",
  description: "Streetwear minimalista, feito para o movimento.",
};

// Applies the persisted theme to <html> before React hydrates, so there is
// no flash of the wrong theme on load. Kept as a plain string (not JSX) so
// it can run as a blocking inline script in <head>.
const themeInitScript = `
  (function () {
    try {
      var stored = window.localStorage.getItem("scathon:theme");
      var theme = stored === "light" || stored === "dark"
        ? stored
        : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      if (theme === "dark") document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = theme;
    } catch (e) {}
  })();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      data-scroll-behavior="smooth"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        {/*
          Meta Pixel - lives in the ROOT layout (not a specific page) because
          every route in the App Router renders inside this component, so
          this is the one place that guarantees it loads on every page
          (home, listing, PDP, cart, etc.) without copy-pasting it around.
          `strategy="afterInteractive"` is next/script's recommended setting
          for analytics/tag-manager scripts: it loads right after the page
          becomes interactive instead of blocking the initial render, and
          Next.js only injects it once per full page load even though the
          root layout "wraps" every navigation.
        */}
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${META_PIXEL_ID}');
            fbq('track', 'PageView');
          `}
        </Script>
        <noscript>
          <img
            height={1}
            width={1}
            alt=""
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          />
        </noscript>
        {/*
          This is an SPA: <Link> navigations never reload the document, so
          the PageView the script above fires only covers the very first
          page a visitor lands on. MetaPixelRouteTracker watches route
          changes and re-fires PageView for every navigation after that -
          see its own doc comment for details. Renders nothing.
        */}
        <MetaPixelRouteTracker />

        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          {/*
            Fixed-position, so it doesn't matter that it lives outside the
            document's normal header/main/footer flow - see FloatingDock's
            own doc comment for how it hands off with <Header/> on scroll.
          */}
          <FloatingDock />
        </Providers>
      </body>
    </html>
  );
}
