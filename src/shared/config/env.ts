/**
 * Low-level environment reader.
 *
 * Values come exclusively from Vite env variables (`VITE_*`).
 * Application code must NOT import this module directly — consume the platform
 * entry point (`@/shared/platform`) which re-exports `platformEnv`/`validateEnv`.
 */

export interface AppEnv {
  readonly supabaseUrl: string;
  readonly supabaseAnonKey: string;
  readonly cloudinaryCloudName: string;
  readonly cloudinaryUploadPreset: string;
  readonly mode: string;
  readonly isProduction: boolean;
}

const read = (key: string): string => {
  const value = (import.meta.env as Record<string, string | undefined>)[key];
  return typeof value === "string" ? value.trim() : "";
};

export const env: AppEnv = {
  supabaseUrl: read("VITE_SUPABASE_URL"),
  supabaseAnonKey: read("VITE_SUPABASE_ANON_KEY"),
  cloudinaryCloudName: read("VITE_CLOUDINARY_CLOUD_NAME"),
  cloudinaryUploadPreset: read("VITE_CLOUDINARY_UPLOAD_PRESET"),
  mode: import.meta.env.MODE,
  isProduction: import.meta.env.PROD,
};

export type EnvKey = keyof Omit<AppEnv, "mode" | "isProduction">;

/** Keys the application cannot boot without. */
const REQUIRED_ENV_KEYS: readonly EnvKey[] = ["supabaseUrl", "supabaseAnonKey"];

/**
 * Keys that only gate an optional integration (media upload/delivery). Missing
 * values degrade the media features, they must never block the whole app.
 */
const OPTIONAL_ENV_KEYS: readonly EnvKey[] = ["cloudinaryCloudName", "cloudinaryUploadPreset"];

/** Returns the required keys that are still empty. Never throws. */
export const missingEnvKeys = (): readonly EnvKey[] =>
  REQUIRED_ENV_KEYS.filter((key) => env[key].length === 0);

/** Returns the optional keys that are still empty. Never throws. */
export const missingOptionalEnvKeys = (): readonly EnvKey[] =>
  OPTIONAL_ENV_KEYS.filter((key) => env[key].length === 0);
