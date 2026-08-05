import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { APP_DEFAULTS, type ThemeName } from "@/shared/constants";
import {
  applyTheme,
  readStoredTheme,
  resolveTheme,
  systemTheme,
  writeStoredTheme,
  type ResolvedTheme,
} from "@/shared/theme/theme";

export interface ThemeContextValue {
  readonly theme: ThemeName;
  readonly resolvedTheme: ResolvedTheme;
  readonly setTheme: (theme: ThemeName) => void;
  readonly toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  readonly children: ReactNode;
  readonly defaultTheme?: ThemeName;
}

export function ThemeProvider({
  children,
  defaultTheme = APP_DEFAULTS.theme,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeName>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");

  // Hydrate from storage after mount (SSR-safe, no flicker thanks to the head script).
  useEffect(() => {
    const stored = readStoredTheme() ?? defaultTheme;
    setThemeState(stored);
    const resolved = resolveTheme(stored);
    setResolvedTheme(resolved);
    applyTheme(resolved);
  }, [defaultTheme]);

  // Follow OS changes while in "system" mode.
  useEffect(() => {
    if (theme !== "system" || typeof window === "undefined") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const resolved = systemTheme();
      setResolvedTheme(resolved);
      applyTheme(resolved);
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback((next: ThemeName) => {
    setThemeState(next);
    writeStoredTheme(next);
    const resolved = resolveTheme(next);
    setResolvedTheme(resolved);
    applyTheme(resolved);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(resolveTheme(theme) === "dark" ? "light" : "dark");
  }, [setTheme, theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme, toggleTheme }),
    [theme, resolvedTheme, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
