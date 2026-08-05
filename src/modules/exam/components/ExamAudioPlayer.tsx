import { Headphones, Pause, Play } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAudioEngine, type AudioEngineOptions } from "@/modules/exam/hooks/useAudioEngine";

export interface ExamAudioPlayerProps extends AudioEngineOptions {
  readonly src: string;
  readonly onLockChange?: (locked: boolean) => void;
}

/** Engine 4 UI — controlled listening playback with a remaining play counter. */
export function ExamAudioPlayer({ src, onLockChange, ...options }: ExamAudioPlayerProps) {
  const engine = useAudioEngine(src, options);
  onLockChange?.(engine.locked);

  return (
    <div className="flex flex-col gap-sm rounded-lg border border-border bg-muted/40 p-md">
      <div className="flex items-center gap-sm">
        <span aria-hidden="true" className="text-primary">
          <Headphones className="size-5" />
        </span>
        <span className="text-body-sm text-text-primary">Soal menyimak</span>
        {engine.remainingPlays !== null && (
          <span className="ml-auto text-caption text-text-secondary">
            Sisa putar: {engine.remainingPlays}
          </span>
        )}
      </div>

      <div className="flex items-center gap-sm">
        <button
          type="button"
          onClick={engine.status === "playing" ? engine.pause : engine.play}
          disabled={engine.status !== "playing" && !engine.canPlay}
          aria-label={engine.status === "playing" ? "Jeda audio" : "Putar audio"}
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground",
            "transition-colors motion-fast hover:bg-primary/90 disabled:opacity-50",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          {engine.status === "playing" ? <Pause className="size-5" /> : <Play className="size-5" />}
        </button>

        <div
          role="progressbar"
          aria-label="Progres audio"
          aria-valuenow={engine.progress}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-2 w-full overflow-hidden rounded-full bg-border"
        >
          <div
            className="h-full rounded-full bg-primary transition-all motion-fast"
            style={{ width: `${engine.progress}%` }}
          />
        </div>
      </div>

      <p className="text-caption text-text-secondary">
        {engine.status === "error"
          ? "Audio gagal dimuat, periksa koneksi Anda."
          : engine.status === "finished"
            ? "Audio selesai diputar."
            : engine.locked
              ? "Navigasi terkunci selama audio diputar."
              : "Tekan tombol putar untuk mendengarkan."}
      </p>

      <audio ref={engine.audioRef} src={src} preload="metadata" className="sr-only">
        <track kind="captions" />
      </audio>
    </div>
  );
}
