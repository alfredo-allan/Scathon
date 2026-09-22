"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Re-fires the Meta Pixel `PageView` event on every client-side route
 * change.
 *
 * Why this exists: the base pixel script in the root layout (see
 * `layout.tsx`) already fires one `PageView` when the document first loads.
 * That is enough for a traditional multi-page site, but this app is a
 * single-page app under the hood - navigating between routes with
 * `next/link` (home -> category -> PDP, etc.) never reloads the document,
 * so that first `PageView` would be the only one Meta ever sees without
 * this component. It watches the current pathname via `usePathname()` and
 * calls `fbq('track', 'PageView')` again each time it changes, so every
 * route the visitor lands on - not just the very first one - counts as a
 * page view for ads/reporting purposes.
 *
 * The first render is skipped on purpose: it fires for the pathname the
 * page already loaded with, which the base pixel script in the layout has
 * already reported, so counting it here too would double it.
 *
 * Renders nothing - it only reads the route and pings `fbq`. Mounted once
 * in the root layout, so it observes every route in the app; it doesn't
 * need to be added to individual pages.
 */
export function MetaPixelRouteTracker() {
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (typeof window.fbq === "function") {
      window.fbq("track", "PageView");
    }
  }, [pathname]);

  return null;
}
