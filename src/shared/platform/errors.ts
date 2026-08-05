/**
 * Global error normalisation and user-friendly mapping.
 * Monitoring integration lands in a later sprint.
 */

import { AppError, toAppError, type AppErrorKind } from "@/shared/lib/error-handler";

export interface NormalizedError {
  readonly kind: AppErrorKind;
  readonly message: string;
  readonly userMessage: string;
  readonly context: Record<string, unknown> | undefined;
  readonly original: unknown;
}

const USER_MESSAGES: Readonly<Record<AppErrorKind, string>> = {
  unknown: "Terjadi kesalahan yang tidak terduga. Silakan coba lagi.",
  network: "Koneksi bermasalah. Periksa jaringan Anda lalu coba lagi.",
  validation: "Data yang dikirim tidak valid. Periksa kembali isian Anda.",
  permission: "Anda tidak memiliki akses untuk melakukan tindakan ini.",
  notFound: "Data yang diminta tidak ditemukan.",
};

/** Converts any thrown value into a predictable, typed shape. */
export function normalizeError(error: unknown): NormalizedError {
  const appError: AppError = toAppError(error);
  return {
    kind: appError.kind,
    message: appError.message,
    userMessage: USER_MESSAGES[appError.kind],
    context: appError.context,
    original: error,
  };
}

/** Maps any error to a message safe to display to the end user. */
export function toUserMessage(error: unknown): string {
  return normalizeError(error).userMessage;
}
