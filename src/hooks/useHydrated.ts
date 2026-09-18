"use client";

import { useSyncExternalStore } from "react";

function subscribe() {
  return () => {};
}

/**
 * Returns `false` during SSR and the first client render, then `true`
 * once mounted in the browser. Use this instead of the classic
 * `useState(false) + useEffect(() => setMounted(true), [])` pair (which
 * trips the `react-hooks/set-state-in-effect` lint rule) whenever a
 * component needs to know "am I in the browser yet?" - e.g. to avoid a
 * hydration mismatch on an icon that depends on client-only state.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
