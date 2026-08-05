import { Flag } from "lucide-react";

import { cn } from "@/lib/utils";

export type PaletteState = "answered" | "flagged" | "empty" | "current";

export interface PaletteEntry {
  readonly index: number;
  readonly answered: boolean;
  readonly flagged: boolean;
}

/** Engine 3 — Question Palette with jump-to-question. */
export function QuestionPalette({
  entries,
  current,
  disabled = false,
  onJump,
}: {
  readonly entries: readonly PaletteEntry[];
  readonly current: number;
  readonly disabled?: boolean;
  readonly onJump: (index: number) => void;
}) {
  return (
    <nav aria-label="Peta soal" className="flex flex-col gap-sm">
      <div className="flex flex-wrap gap-xs">
        {entries.map((entry) => {
          const isCurrent = entry.index === current;
          return (
            <button
              key={entry.index}
              type="button"
              disabled={disabled}
              onClick={() => onJump(entry.index)}
              aria-current={isCurrent ? "true" : undefined}
              aria-label={`Soal ${entry.index + 1}${entry.answered ? ", sudah dijawab" : ", belum dijawab"}${entry.flagged ? ", ditandai" : ""}`}
              className={cn(
                "relative grid size-11 place-items-center rounded-md border text-body-sm font-medium",
                "transition-colors motion-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "disabled:opacity-50",
                isCurrent
                  ? "border-primary bg-primary text-primary-foreground"
                  : entry.answered
                    ? "border-primary/40 bg-primary/10 text-text-primary"
                    : "border-border bg-surface text-text-secondary hover:bg-muted",
              )}
            >
              {entry.index + 1}
              {entry.flagged && (
                <Flag aria-hidden="true" className="absolute -right-1 -top-1 size-3 text-warning" />
              )}
            </button>
          );
        })}
      </div>

      <ul className="flex flex-wrap gap-md text-caption text-text-secondary">
        <li className="flex items-center gap-xs">
          <span aria-hidden="true" className="size-3 rounded-sm bg-primary" /> Soal aktif
        </li>
        <li className="flex items-center gap-xs">
          <span aria-hidden="true" className="size-3 rounded-sm bg-primary/20" /> Terjawab
        </li>
        <li className="flex items-center gap-xs">
          <span aria-hidden="true" className="size-3 rounded-sm border border-border" /> Kosong
        </li>
        <li className="flex items-center gap-xs">
          <Flag aria-hidden="true" className="size-3 text-warning" /> Ditandai
        </li>
      </ul>
    </nav>
  );
}
