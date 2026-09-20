import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FloatingDock } from "@/components/layout/FloatingDock";

// Using the system font stack (defined in globals.css) instead of
// next/font/google (Geist) so the build never depends on reaching
// fonts.googleapis.com - handy behind restrictive proxies/offline dev,
// and one less external request in production. Swap in next/font/local
// with a self-hosted variable font, or next/font/google once network
// access is confirmed, whenever a custom brand typeface is ready.

export const metadata: Metadata = {
  title: "Scathon — Streetwear E-commerce",
  description: "Minimalist streetwear, built for movement.",
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
