/**
 * Supabase client foundation: factory, singleton, typed export, error wrapper.
 * No auth, no queries, no schema — foundation only.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { AppError } from "@/shared/lib/error-handler";
import { logger } from "@/shared/lib/logger";
import { platformEnv } from "@/shared/platform/env";
import { validateEnv } from "@/shared/platform/env";

/** Replace with generated database types once the schema exists. */
export type PlatformDatabase = Record<string, unknown>;
export type PlatformSupabaseClient = SupabaseClient<PlatformDatabase>;

let client: PlatformSupabaseClient | null = null;

/** Creates a new (non-cached) Supabase client. */
export function createSupabaseClient(): PlatformSupabaseClient {
  const { supabaseUrl, supabasePublishableKey, isServer } = platformEnv;
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new AppError("Supabase environment is not configured.", {
      kind: "validation",
      context: { missing: validateEnv().missing },
    });
  }

  return createClient<PlatformDatabase>(supabaseUrl, supabasePublishableKey, {
    auth: {
      persistSession: !isServer,
      autoRefreshToken: !isServer,
      detectSessionInUrl: !isServer,
    },
  });
}

/** Singleton accessor. The client is created lazily on first use. */
export function getSupabaseClient(): PlatformSupabaseClient {
  if (client) return client;
  client = createSupabaseClient();
  logger.debug("Supabase client initialised");
  return client;
}

/** True when the required Supabase environment variables are present. */
export function isSupabaseConfigured(): boolean {
  return platformEnv.supabaseUrl.length > 0 && platformEnv.supabasePublishableKey.length > 0;
}

export interface SupabaseErrorShape {
  readonly message?: unknown;
  readonly code?: unknown;
  readonly details?: unknown;
  readonly hint?: unknown;
}

/** Normalises any Supabase/PostgREST error object into an AppError. */
export function toSupabaseError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  const shape = (error ?? {}) as SupabaseErrorShape;
  const message =
    typeof shape.message === "string" && shape.message.length > 0
      ? shape.message
      : "Supabase request failed.";
  return new AppError(message, {
    kind: "network",
    cause: error,
    context: { code: shape.code, details: shape.details, hint: shape.hint },
  });
}

/** Wraps a Supabase call, converting `{ data, error }` into a value or AppError throw. */
export async function supabaseRequest<T>(
  run: (supabase: PlatformSupabaseClient) => PromiseLike<{ data: T | null; error: unknown }>,
): Promise<T> {
  const { data, error } = await run(getSupabaseClient());
  if (error) throw toSupabaseError(error);
  if (data === null) throw new AppError("Supabase returned no data.", { kind: "notFound" });
  return data;
}
