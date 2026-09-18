"use client";

import {
  createContext,
  useCallback,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const STORAGE_KEY = "scathon:theme";

export const ThemeContext = createContext<ThemeContextValue | undefined>(
  undefined,
);

let cachedTheme: Theme | null = null;
const listeners = new Set<() => void>();

function readInitialTheme(): Theme {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // localStorage unavailable - fall through to system preference
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyThemeToDocument(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

function getSnapshot(): Theme {
  if (cachedTheme === null) {
    cachedTheme = readInitialTheme();
  }
  return cachedTheme;
}

// The server (and the very first client render, before hydration) never
// knows the real preference. A blocking inline script in <head> (see
// app/layout.tsx) already applied the right `dark` class to <html> before
// paint, so this mismatch never causes a visible flash - only this
// context's own snapshot briefly lags, which useSyncExternalStore
// reconciles automatically right after mount.
function getServerSnapshot(): Theme {
  return "light";
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function writeTheme(theme: Theme) {
  cachedTheme = theme;
  applyThemeToDocument(theme);
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // ignore write failures
  }
  listeners.forEach((listener) => listener());
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setTheme = useCallback((next: Theme) => writeTheme(next), []);
  const toggleTheme = useCallback(
    () => writeTheme(theme === "dark" ? "light" : "dark"),
    [theme],
  );

  const value = useMemo(
    () => ({ theme, toggleTheme, setTheme }),
    [theme, toggleTheme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
