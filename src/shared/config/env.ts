/**
 * Environment configuration.
 *
 * Values come exclusively from Vite env variables (`VITE_*`).
 * Nothing is hardcoded and no connection is established in this sprint.
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

/** Keys that must be present before the corresponding integration is used. */
export const REQUIRED_ENV_KEYS: readonly EnvKey[] = [
  "supabaseUrl",
  "supabaseAnonKey",
  "cloudinaryCloudName",
  "cloudinaryUploadPreset",
];

/** Returns the configured keys that are still empty. Never throws. */
export const missingEnvKeys = (): readonly EnvKey[] =>
  REQUIRED_ENV_KEYS.filter((key) => env[key].length === 0);

export const isEnvReady = (): boolean => missingEnvKeys().length === 0;
