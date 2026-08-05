import { STORAGE_KEYS, THEMES, type ThemeName } from "@/shared/constants";

export type ResolvedTheme = "light" | "dark";

export const isThemeName = (value: unknown): value is ThemeName =>
  typeof value === "string" && (THEMES as readonly string[]).includes(value);

export const readStoredTheme = (): ThemeName | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.theme);
    return isThemeName(raw) ? raw : null;
  } catch {
    return null;
  }
};

export const writeStoredTheme = (theme: ThemeName): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEYS.theme, theme);
  } catch {
    /* storage unavailable — theme stays in-memory only */
  }
};

export const systemTheme = (): ResolvedTheme => {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export const resolveTheme = (theme: ThemeName): ResolvedTheme =>
  theme === "system" ? systemTheme() : theme;

export const applyTheme = (resolved: ResolvedTheme): void => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
};

/**
 * Blocking script injected in <head> so the theme class is present before the
 * first paint. Prevents light/dark flicker on startup.
 */
export const themeInitScript = `(function(){try{var k=${JSON.stringify(
  STORAGE_KEYS.theme,
)};var t=localStorage.getItem(k);if(t!=="light"&&t!=="dark"&&t!=="system"){t="${"system"}";}var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var e=document.documentElement;e.classList.toggle("dark",d);e.style.colorScheme=d?"dark":"light";}catch(_){}})();`;
