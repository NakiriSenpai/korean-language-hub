/**
 * Knowledge Domain — shared service plumbing.
 * Normalises Supabase errors and guards tenant / user scope.
 */

import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { AppError } from "@/shared/platform";

const FRIENDLY: Record<string, string> = {
  "23505": "Slug sudah dipakai pada lembaga ini, gunakan slug lain.",
  "23503": "Data induk tidak ditemukan atau sudah dihapus.",
  "23514": "Nilai tidak valid, periksa kembali batas yang diizinkan.",
  "42501": "Anda tidak memiliki izin untuk tindakan ini.",
};

/**
 * Knowledge tables are addressed dynamically through the entity registry, so the
 * generated per-table types cannot be resolved statically. A single untyped view
 * of the shared client keeps that cast in one place instead of every service.
 */
export const knowledgeDb = supabase as unknown as SupabaseClient;

export function toKnowledgeError(error: PostgrestError, scope: string): AppError {
  const message = FRIENDLY[error.code] ?? error.message;
  const kind = error.code === "42501" ? "permission" : "unknown";
  return new AppError(message, { kind, context: { scope, code: error.code } });
}

export function unwrap<T>(
  result: { data: T | null; error: PostgrestError | null },
  scope: string,
): T {
  if (result.error) throw toKnowledgeError(result.error, scope);
  if (result.data === null) {
    throw new AppError("Materi tidak ditemukan.", { kind: "notFound", context: { scope } });
  }
  return result.data;
}

export function assertTenant(tenantId: string, scope: string): string {
  if (!tenantId) {
    throw new AppError("Lembaga aktif belum dipilih.", { kind: "validation", context: { scope } });
  }
  return tenantId;
}

export function assertUser(userId: string | undefined | null, scope: string): string {
  if (!userId) {
    throw new AppError("Sesi berakhir, silakan masuk kembali.", {
      kind: "permission",
      context: { scope },
    });
  }
  return userId;
}

export interface KnowledgeScope {
  readonly tenantId: string;
  readonly userId: string;
}
