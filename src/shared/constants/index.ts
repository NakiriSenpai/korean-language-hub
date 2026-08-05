/** Global application constants. */

export const APP_META = {
  name: "Hangeul LPK Platform",
  shortName: "Hangeul LPK",
  version: "0.1.0",
  description: "Multi-tenant SaaS platform for Korean language training centers (LPK).",
} as const;

export const SUPPORTED_LANGUAGES = ["id", "ko", "en"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const THEMES = ["light", "dark", "system"] as const;
export type ThemeName = (typeof THEMES)[number];

export const APP_DEFAULTS = {
  language: "id" satisfies SupportedLanguage,
  theme: "light" satisfies ThemeName,
  pageSize: 20,
  requestTimeoutMs: 15_000,
} as const;

export const STORAGE_KEYS = {
  theme: "hangeul-lpk.theme",
  language: "hangeul-lpk.language",
  tenant: "hangeul-lpk.tenant",
} as const;
