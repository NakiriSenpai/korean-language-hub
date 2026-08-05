import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const TONE = {
  neutral: "bg-muted text-text-secondary",
  info: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-destructive/10 text-destructive",
} as const;

export type BadgeTone = keyof typeof TONE;

export function StatusBadge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-sm py-xs text-caption font-medium",
        TONE[tone],
      )}
    >
      {children}
    </span>
  );
}

const PERIOD_TONE: Record<string, BadgeTone> = {
  draft: "neutral",
  active: "success",
  archived: "warning",
};

const ENROLLMENT_TONE: Record<string, BadgeTone> = {
  active: "success",
  completed: "info",
  suspended: "warning",
  dropped: "danger",
};

const LABEL: Record<string, string> = {
  draft: "Draf",
  active: "Aktif",
  archived: "Arsip",
  completed: "Selesai",
  suspended: "Ditangguhkan",
  dropped: "Keluar",
  lead: "Pengajar Utama",
  assistant: "Asisten",
};

export const statusLabel = (status: string): string => LABEL[status] ?? status;

export function LifecycleBadge({ status }: { status: string }) {
  return <StatusBadge tone={PERIOD_TONE[status] ?? "neutral"}>{statusLabel(status)}</StatusBadge>;
}

export function EnrollmentBadge({ status }: { status: string }) {
  return <StatusBadge tone={ENROLLMENT_TONE[status] ?? "neutral"}>{statusLabel(status)}</StatusBadge>;
}
