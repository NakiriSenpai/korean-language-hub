import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

import { ghostButtonClass } from "@/modules/academic/components/Form";
import type { OutlineLesson } from "@/modules/learning/types";
import { cn } from "@/lib/utils";

export interface UnitNavigationProps {
  readonly unitIndex: number;
  readonly unitCount: number;
  readonly onPrevious: () => void;
  readonly onNext: () => void;
}

/** Previous / next unit inside the current lesson. */
export function UnitNavigation({
  unitIndex,
  unitCount,
  onPrevious,
  onNext,
}: UnitNavigationProps) {
  return (
    <div className="flex items-center justify-between gap-sm">
      <button
        type="button"
        className={ghostButtonClass}
        onClick={onPrevious}
        disabled={unitIndex <= 0}
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        Unit sebelumnya
      </button>
      <span className="text-caption text-text-secondary">
        Unit {unitCount === 0 ? 0 : unitIndex + 1} dari {unitCount}
      </span>
      <button
        type="button"
        className={ghostButtonClass}
        onClick={onNext}
        disabled={unitIndex >= unitCount - 1}
      >
        Unit berikutnya
        <ChevronRight className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export interface LessonNavigationProps {
  readonly previous: OutlineLesson | null;
  readonly next: OutlineLesson | null;
}

/** Previous / next lesson, derived from the course outline. */
export function LessonNavigation({ previous, next }: LessonNavigationProps) {
  return (
    <nav aria-label="Navigasi lesson" className="flex flex-col gap-sm sm:flex-row sm:justify-between">
      {previous ? (
        <Link
          to="/learning/lessons/$lessonId"
          params={{ lessonId: previous.lessonId }}
          className={cn(ghostButtonClass, "justify-start")}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span className="truncate">{previous.title}</span>
        </Link>
      ) : (
        <span className="text-caption text-text-secondary">Lesson pertama</span>
      )}
      {next ? (
        <Link
          to="/learning/lessons/$lessonId"
          params={{ lessonId: next.lessonId }}
          className={cn(ghostButtonClass, "justify-end")}
        >
          <span className="truncate">{next.title}</span>
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      ) : (
        <span className="text-caption text-text-secondary">Lesson terakhir</span>
      )}
    </nav>
  );
}
