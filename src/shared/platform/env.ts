/**
 * Platform environment loader + validation.
 *
 * Single source of truth for runtime environment values. Values come only from
 * Vite env variables (`VITE_*`) — nothing is hardcoded.
 */

import {
  env as baseEnv,
  missingEnvKeys,
  missingOptionalEnvKeys,
  type EnvKey,
} from "@/shared/config/env";

export interface PlatformEnv {
  readonly supabaseUrl: string;
  readonly supabaseAnonKey: string;
  readonly cloudinaryCloudName: string;
  readonly cloudinaryUploadPreset: string;
  readonly mode: string;
  readonly isProduction: boolean;
  readonly isDevelopment: boolean;
  readonly isServer: boolean;
}

export const platformEnv: PlatformEnv = {
  supabaseUrl: baseEnv.supabaseUrl,
  supabaseAnonKey: baseEnv.supabaseAnonKey,
  cloudinaryCloudName: baseEnv.cloudinaryCloudName,
  cloudinaryUploadPreset: baseEnv.cloudinaryUploadPreset,
  mode: baseEnv.mode,
  isProduction: baseEnv.isProduction,
  isDevelopment: !baseEnv.isProduction,
  isServer: typeof window === "undefined",
};

const ENV_VARIABLE_NAMES: Readonly<Record<EnvKey, string>> = {
  supabaseUrl: "VITE_SUPABASE_URL",
  supabaseAnonKey: "VITE_SUPABASE_ANON_KEY",
  cloudinaryCloudName: "VITE_CLOUDINARY_CLOUD_NAME",
  cloudinaryUploadPreset: "VITE_CLOUDINARY_UPLOAD_PRESET",
};

export interface EnvValidationResult {
  readonly valid: boolean;
  /** Human readable names of the missing variables, e.g. `VITE_SUPABASE_URL`. */
  readonly missing: readonly string[];
  readonly message: string | null;
}

/** Validates the environment without throwing. */
export function validateEnv(): EnvValidationResult {
  const missing = missingEnvKeys().map((key) => ENV_VARIABLE_NAMES[key]);
  return {
    valid: missing.length === 0,
    missing,
    message:
      missing.length === 0
        ? null
        : `Missing required environment variables: ${missing.join(", ")}. ` +
          `Copy .env.example to .env and provide the values.`,
  };
}

/** Validates the environment and throws when a required variable is missing. */
export function assertEnv(): void {
  const result = validateEnv();
  if (!result.valid) throw new Error(result.message ?? "Invalid environment configuration.");
}

export { ENV_VARIABLE_NAMES };
