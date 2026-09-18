"use client";

import { useContext } from "react";
import { ThemeContext } from "@/context/ThemeContext";

/**
 * Access the current light/dark theme and toggle it. Syncs Tailwind's
 * `dark` class on <html> via ThemeProvider. Must be used within a
 * <ThemeProvider>.
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
