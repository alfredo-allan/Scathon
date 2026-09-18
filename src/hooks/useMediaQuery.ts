"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Tracks whether a CSS media query currently matches. Used to switch
 * between desktop/mobile assets (e.g. HeroCarousel banner images) instead
 * of relying on CSS alone when the JS behaviour also needs to differ.
 *
 * Returns `false` on the server and during the first client render (to
 * avoid a hydration mismatch), then the real value once mounted -
 * handled entirely by `useSyncExternalStore`, with no manual
 * effect/setState pair involved.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mediaQueryList = window.matchMedia(query);
      mediaQueryList.addEventListener("change", onChange);
      return () => mediaQueryList.removeEventListener("change", onChange);
    },
    [query],
  );

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);
  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Convenience preset matching Tailwind's `md` breakpoint (768px). */
export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 768px)");
}
