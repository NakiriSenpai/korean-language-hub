import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { HealthLevel } from "@/modules/platform/types";

/** Platform Administration — status pills reused across every console tab. */

const TONE = {
  neutral: "bg-muted text-text-secondary",
  info: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-destructive/10 text-destructive",
} as const;

export type PlatformTone = keyof typeof TONE;

export function PlatformBadge({
  tone = "neutral",
  children,
}: {
  tone?: PlatformTone;
  children: ReactNode;
}) {
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

const LABEL: Record<string, string> = {
  active: "Aktif",
  suspended: "Ditangguhkan",
  archived: "Arsip",
  draft: "Draf",
  published: "Terbit",
  invited: "Diundang",
  revoked: "Dicabut",
  owner: "Pemilik",
  admin: "Admin",
  instructor: "Pengajar",
  staff: "Staf",
  student: "Peserta",
  platform: "Seluruh platform",
  tenant: "Lembaga",
  study_group: "Kelompok belajar",
  banner: "Banner",
  carousel: "Carousel",
  static_page: "Halaman statis",
  faq: "FAQ",
  image: "Gambar",
  audio: "Audio",
  video: "Video",
  document: "Dokumen",
};

export const platformLabel = (value: string): string => LABEL[value] ?? value;

const STATUS_TONE: Record<string, PlatformTone> = {
  active: "success",
  published: "success",
  draft: "neutral",
  invited: "info",
  suspended: "warning",
  archived: "warning",
  revoked: "danger",
};

export function StatusPill({ status }: { status: string }) {
  return <PlatformBadge tone={STATUS_TONE[status] ?? "neutral"}>{platformLabel(status)}</PlatformBadge>;
}

const HEALTH_TONE: Record<HealthLevel, PlatformTone> = {
  ok: "success",
  warn: "warning",
  down: "danger",
};

const HEALTH_LABEL: Record<HealthLevel, string> = {
  ok: "Normal",
  warn: "Perlu perhatian",
  down: "Bermasalah",
};

export function HealthPill({ level }: { level: HealthLevel }) {
  return <PlatformBadge tone={HEALTH_TONE[level]}>{HEALTH_LABEL[level]}</PlatformBadge>;
}
