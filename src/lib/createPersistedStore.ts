/**
 * Tiny external store that mirrors a value to localStorage and notifies
 * subscribers on change. Meant to be read via React's
 * `useSyncExternalStore`, which is the React-recommended way to read
 * data from something outside React (here: the browser's localStorage)
 * without falling into the `react-hooks/set-state-in-effect` trap of
 * "read on mount, setState in a useEffect".
 *
 * `getServerSnapshot` always returns `defaultValue` so server-rendered
 * markup matches the very first client render; React then re-renders
 * with the real persisted value once mounted, entirely on its own.
 */
export function createPersistedStore<T>(key: string, defaultValue: T) {
  let currentValue = defaultValue;
  let hasHydrated = false;
  const listeners = new Set<() => void>();

  function readFromStorage(): T {
    if (typeof window === "undefined") return defaultValue;
    try {
      const raw = window.localStorage.getItem(key);
      return raw !== null ? (JSON.parse(raw) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  function getSnapshot(): T {
    if (!hasHydrated) {
      currentValue = readFromStorage();
      hasHydrated = true;
    }
    return currentValue;
  }

  function getServerSnapshot(): T {
    return defaultValue;
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function setValue(next: T | ((prev: T) => T)) {
    const resolved =
      typeof next === "function"
        ? (next as (prev: T) => T)(currentValue)
        : next;
    currentValue = resolved;
    hasHydrated = true;
    try {
      window.localStorage.setItem(key, JSON.stringify(resolved));
    } catch {
      // storage full/unavailable - keep the in-memory value only
    }
    listeners.forEach((listener) => listener());
  }

  return { getSnapshot, getServerSnapshot, subscribe, setValue };
}
