/**
 * Academic Domain — shared service plumbing.
 * Normalises Supabase errors into AppError so the UI never sees raw PostgREST noise.
 */

import type { PostgrestError } from "@supabase/supabase-js";

import { AppError } from "@/shared/platform";

const FRIENDLY: Record<string, string> = {
  "23505": "Data dengan kode yang sama sudah ada.",
  "23503": "Data terkait tidak ditemukan atau sudah dihapus.",
  "42501": "Anda tidak memiliki izin untuk tindakan ini.",
};

/** Turns a PostgREST error into a domain AppError. */
export function toAcademicError(error: PostgrestError, scope: string): AppError {
  const message = FRIENDLY[error.code] ?? error.message;
  const kind = error.code === "42501" ? "permission" : "unknown";
  return new AppError(message, { kind, context: { scope, code: error.code } });
}

/** Unwraps a Supabase result, throwing a normalised AppError on failure. */
export function unwrap<T>(
  result: { data: T | null; error: PostgrestError | null },
  scope: string,
): T {
  if (result.error) throw toAcademicError(result.error, scope);
  if (result.data === null) {
    throw new AppError("Data tidak ditemukan.", { kind: "notFound", context: { scope } });
  }
  return result.data;
}
