"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Tracks whether the page has been scrolled more than `thresholdPx` down
 * from the top. Mirrors useMediaQuery's pattern (an external browser
 * signal read through useSyncExternalStore instead of a manual
 * useState+useEffect pair), which keeps it SSR-safe for free: the server
 * and first client render both report `false`, so there's no hydration
 * mismatch and no flash of the floating dock before we know real scroll
 * position.
 */
export function useScrolledPast(thresholdPx: number): boolean {
  const subscribe = useCallback((onStoreChange: () => void) => {
    window.addEventListener("scroll", onStoreChange, { passive: true });
    window.addEventListener("resize", onStoreChange);
    return () => {
      window.removeEventListener("scroll", onStoreChange);
      window.removeEventListener("resize", onStoreChange);
    };
  }, []);

  const getSnapshot = useCallback(
    () => window.scrollY > thresholdPx,
    [thresholdPx],
  );
  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
