import { cn } from "@/lib/utils";
import type { ContentStatus, ProgressStatus } from "@/modules/learning/types";

const TONE = {
  neutral: "bg-muted text-text-secondary",
  info: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
} as const;

type Tone = keyof typeof TONE;

const CONTENT_TONE: Record<ContentStatus, Tone> = {
  draft: "neutral",
  published: "success",
  archived: "warning",
};

const PROGRESS_TONE: Record<ProgressStatus, Tone> = {
  not_started: "neutral",
  in_progress: "info",
  completed: "success",
};

const LABEL: Record<string, string> = {
  draft: "Draf",
  published: "Terbit",
  archived: "Arsip",
  not_started: "Belum mulai",
  in_progress: "Sedang berjalan",
  completed: "Selesai",
};

function Badge({ tone, children }: { tone: Tone; children: string }) {
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

export function ContentStatusBadge({ status }: { status: ContentStatus }) {
  return <Badge tone={CONTENT_TONE[status]}>{LABEL[status] ?? status}</Badge>;
}

export function ProgressStatusBadge({ status }: { status: ProgressStatus }) {
  return <Badge tone={PROGRESS_TONE[status]}>{LABEL[status] ?? status}</Badge>;
}

/** Slim, accessible progress bar built on design tokens. */
export function ProgressBar({ percent, label }: { percent: number; label: string }) {
  const value = Math.min(100, Math.max(0, Math.round(percent)));
  return (
    <div className="flex min-w-0 flex-col gap-xs">
      <div className="flex items-center justify-between gap-sm">
        <span className="truncate text-caption text-text-secondary">{label}</span>
        <span className="text-caption text-text-secondary">{value}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        aria-label={label}
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-primary transition-all motion-normal"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
