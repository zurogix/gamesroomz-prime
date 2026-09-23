"use client";

import { useCallback, useEffect, useState } from "react";

export type ThemeChoice = "light" | "system" | "dark";

const THEME_KEY = "gamesroomz-prime-theme";

function applyTheme(theme: ThemeChoice) {
  const root = document.documentElement;
  if (theme === "system") delete root.dataset.theme;
  else root.dataset.theme = theme;
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeChoice>("system");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY) as ThemeChoice | null;
      if (saved === "light" || saved === "dark") {
        setThemeState(saved);
        applyTheme(saved);
      }
    } catch {
      // Fall back to the system theme.
    }
  }, []);

  const setTheme = useCallback((next: ThemeChoice) => {
    setThemeState(next);
    applyTheme(next);
    try {
      if (next === "system") localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, next);
    } catch {
      // The choice still applies for this visit.
    }
  }, []);

  return { theme, setTheme };
}
