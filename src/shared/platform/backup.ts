/**
 * Engine 7 — Backup & recovery foundation.
 *
 * Deliberately metadata-only: no automated database dumps, no scheduled jobs.
 * The Platform Owner can capture a human-readable snapshot of the tenant
 * configuration and follow the recovery checklist during an incident.
 */

import { platformConfig } from "@/shared/platform/config";
import { getCorrelationId } from "@/shared/platform/observability";

export interface BackupMetadata {
  readonly generatedAt: string;
  readonly correlationId: string;
  readonly appVersion: string;
  readonly mode: string;
  /** Managed backups are handled by the hosted database provider. */
  readonly databaseBackup: "managed-by-provider";
  readonly mediaBackup: "managed-by-cdn-provider";
}

export function buildBackupMetadata(): BackupMetadata {
  return {
    generatedAt: new Date().toISOString(),
    correlationId: getCorrelationId(),
    appVersion: platformConfig.build.version,
    mode: platformConfig.env.mode,
    databaseBackup: "managed-by-provider",
    mediaBackup: "managed-by-cdn-provider",
  };
}

export interface TenantConfigExportInput {
  readonly tenant: Record<string, unknown> | null;
  readonly branding: Record<string, unknown> | null;
  readonly settings: readonly Record<string, unknown>[];
}

export interface TenantConfigExport extends TenantConfigExportInput {
  readonly metadata: BackupMetadata;
}

/**
 * Serialises the non-sensitive configuration of a tenant. Only configuration is
 * included — no learner data, no answers, no personal information.
 */
export function exportTenantConfig(input: TenantConfigExportInput): TenantConfigExport {
  return { ...input, metadata: buildBackupMetadata() };
}

/** Downloadable JSON payload for the export above. */
export function toBackupFile(payload: unknown): Blob {
  return new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
}

export interface RecoveryStep {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
}

/** Ordered checklist used during an incident. Documentation, not automation. */
export const RECOVERY_CHECKLIST: readonly RecoveryStep[] = [
  {
    id: "assess",
    title: "Periksa status layanan",
    detail: "Buka Health Check pada Platform Console dan catat komponen yang bermasalah.",
  },
  {
    id: "scope",
    title: "Tentukan dampak",
    detail: "Identifikasi lembaga, peran, dan fitur yang terdampak sebelum melakukan perubahan.",
  },
  {
    id: "config",
    title: "Verifikasi konfigurasi",
    detail: "Pastikan seluruh variabel environment terisi dan mode produksi aktif.",
  },
  {
    id: "restore",
    title: "Pulihkan basis data",
    detail: "Gunakan snapshot terkelola dari penyedia basis data; jangan menulis manual ke tabel.",
  },
  {
    id: "reapply",
    title: "Terapkan ulang konfigurasi tenant",
    detail: "Impor kembali berkas ekspor konfigurasi tenant bila pengaturan hilang.",
  },
  {
    id: "verify",
    title: "Verifikasi pasca-pemulihan",
    detail: "Jalankan Health Check ulang, uji masuk, dan buka satu asesmen serta satu materi.",
  },
  {
    id: "record",
    title: "Catat kejadian",
    detail: "Simpan ringkasan insiden pada Audit Log agar dapat ditinjau kemudian.",
  },
];
