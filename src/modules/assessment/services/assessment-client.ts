/**
 * Assessment Domain — shared service plumbing.
 * Normalises Supabase errors into AppError and guards tenant / user scope.
 */

import type { PostgrestError } from "@supabase/supabase-js";

import { AppError } from "@/shared/platform";

const FRIENDLY: Record<string, string> = {
  "23505": "Data serupa sudah ada, periksa kode atau slug yang dipakai.",
  "23503": "Data terkait tidak ditemukan atau masih dipakai asesmen lain.",
  "23514": "Nilai tidak valid, periksa kembali batas yang diizinkan.",
  "42501": "Anda tidak memiliki izin untuk tindakan ini.",
};

export function toAssessmentError(error: PostgrestError, scope: string): AppError {
  const message = FRIENDLY[error.code] ?? error.message;
  const kind = error.code === "42501" ? "permission" : "unknown";
  return new AppError(message, { kind, context: { scope, code: error.code } });
}

export function unwrap<T>(
  result: { data: T | null; error: PostgrestError | null },
  scope: string,
): T {
  if (result.error) throw toAssessmentError(result.error, scope);
  if (result.data === null) {
    throw new AppError("Data tidak ditemukan.", { kind: "notFound", context: { scope } });
  }
  return result.data;
}

export function unwrapList<T>(
  result: { data: T[] | null; error: PostgrestError | null },
  scope: string,
): readonly T[] {
  if (result.error) throw toAssessmentError(result.error, scope);
  return result.data ?? [];
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

export interface AssessmentScope {
  readonly tenantId: string;
  readonly userId: string;
}

/** Human readable question code used across the Question Bank. */
export function generatePublicId(prefix = "Q"): string {
  const stamp = Date.now().toString(36).toUpperCase().slice(-5);
  const random = Math.random().toString(36).toUpperCase().slice(2, 5);
  return `${prefix}-${stamp}${random}`;
}
