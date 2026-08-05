import { useEffect, useMemo, useState } from "react";
import { Bookmark, BookmarkCheck, CheckCircle2, Circle } from "lucide-react";
import { toast } from "sonner";

import { BlockList } from "@/modules/learning/components/BlockRenderer";
import { ProgressBar } from "@/modules/learning/components/LearningBadges";
import {
  LessonNavigation,
  UnitNavigation,
} from "@/modules/learning/components/ReaderNavigation";
import {
  useLessonBookmarks,
  useLessonProgress,
  useRecordContinueLearning,
  useSaveLastPosition,
  useSetUnitCompletion,
  useToggleBookmark,
} from "@/modules/learning/hooks/useLearning";
import type { LessonContext } from "@/modules/learning/types";
import { AppCard, AppSection, Stack } from "@/shared/components/layout";
import { EmptyState } from "@/shared/components/shell";
import { buttonClass, ghostButtonClass } from "@/shared/components/form";
import { toUserMessage } from "@/shared/platform";
import { cn } from "@/lib/utils";

export interface LessonReaderProps {
  readonly context: LessonContext;
}

/** Learning Reader — renders every block type and drives the learning engine. */
export function LessonReader({ context }: LessonReaderProps) {
  const { lesson, units, course, module: parentModule } = context;
  const [unitIndex, setUnitIndex] = useState(0);

  const progress = useLessonProgress(lesson.id);
  const bookmarks = useLessonBookmarks(lesson.id);
  const toggleBookmark = useToggleBookmark();
  const setUnitCompletion = useSetUnitCompletion();
  const savePosition = useSaveLastPosition();
  const recordContinue = useRecordContinueLearning();

  const activeUnit = units[unitIndex] ?? null;

  const completedUnitIds = useMemo(
    () =>
      new Set(
        (progress.data ?? [])
          .filter((row) => row.targetType === "unit" && row.status === "completed")
          .map((row) => row.unitId),
      ),
    [progress.data],
  );

  const lessonProgress = (progress.data ?? []).find((row) => row.targetType === "lesson");
  const percent = lessonProgress?.percent ?? 0;

  const lessonBookmarked = (bookmarks.data ?? []).some((item) => item.targetType === "lesson");
  const unitBookmarked = (bookmarks.data ?? []).some(
    (item) => item.targetType === "unit" && item.unitId === activeUnit?.id,
  );

  /* Resume from the last saved position once progress is loaded. */
  useEffect(() => {
    if (!lessonProgress || units.length === 0) return;
    setUnitIndex((current) =>
      current === 0 && lessonProgress.lastPosition < units.length
        ? lessonProgress.lastPosition
        : current,
    );
  }, [lessonProgress, units.length]);

  /* Record "recently opened" / continue learning for this lesson. */
  useEffect(() => {
    recordContinue.mutate({
      courseId: course.id,
      moduleId: parentModule.id,
      lessonId: lesson.id,
      unitId: activeUnit?.id ?? null,
      lastPosition: unitIndex,
    });
    // Only re-record when the lesson or the active unit changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id, activeUnit?.id]);

  const goTo = (index: number) => {
    const next = Math.min(Math.max(index, 0), Math.max(units.length - 1, 0));
    setUnitIndex(next);
    savePosition.mutate({ lessonId: lesson.id, position: next, percent });
  };

  const onToggleUnitCompletion = async () => {
    if (!activeUnit) return;
    try {
      await setUnitCompletion.mutateAsync({
        lessonId: lesson.id,
        unitId: activeUnit.id,
        totalUnits: units.length,
        completed: !completedUnitIds.has(activeUnit.id),
      });
      toast.success("Progress unit diperbarui.");
    } catch (cause) {
      toast.error(toUserMessage(cause));
    }
  };

  const onToggleBookmark = async (target: "lesson" | "unit") => {
    try {
      const result = await toggleBookmark.mutateAsync({
        targetType: target,
        lessonId: lesson.id,
        unitId: target === "unit" ? (activeUnit?.id ?? null) : null,
      });
      toast.success(result === "added" ? "Bookmark ditambahkan." : "Bookmark dihapus.");
    } catch (cause) {
      toast.error(toUserMessage(cause));
    }
  };

  return (
    <Stack gap="xl">
      <AppSection
        title={lesson.title}
        description={`${course.title} · ${parentModule.title} · ± ${lesson.estimatedMinutes} menit`}
        actions={
          <button
            type="button"
            className={ghostButtonClass}
            onClick={() => void onToggleBookmark("lesson")}
            aria-pressed={lessonBookmarked}
          >
            {lessonBookmarked ? (
              <BookmarkCheck className="size-4" aria-hidden="true" />
            ) : (
              <Bookmark className="size-4" aria-hidden="true" />
            )}
            {lessonBookmarked ? "Tersimpan" : "Bookmark"}
          </button>
        }
      >
        <AppCard>
          <Stack gap="md">
            {lesson.summary && <p className="text-body-sm text-text-secondary">{lesson.summary}</p>}
            <ProgressBar percent={percent} label="Progress lesson" />
          </Stack>
        </AppCard>
      </AppSection>

      {units.length === 0 ? (
        <EmptyState
          icon={Circle}
          title="Unit belum tersedia"
          description="Lesson ini belum memiliki unit konten. Tambahkan unit terlebih dahulu."
        />
      ) : (
        <AppSection>
          <AppCard>
            <Stack gap="lg">
              <div className="flex flex-wrap items-center justify-between gap-sm">
                <h3 className="min-w-0 truncate text-h3 text-text-primary">
                  {activeUnit?.title ?? ""}
                </h3>
                <div className="flex flex-wrap gap-xs">
                  <button
                    type="button"
                    className={ghostButtonClass}
                    onClick={() => void onToggleBookmark("unit")}
                    aria-pressed={unitBookmarked}
                  >
                    {unitBookmarked ? (
                      <BookmarkCheck className="size-4" aria-hidden="true" />
                    ) : (
                      <Bookmark className="size-4" aria-hidden="true" />
                    )}
                    Unit
                  </button>
                  <button
                    type="button"
                    className={cn(buttonClass)}
                    onClick={() => void onToggleUnitCompletion()}
                    disabled={setUnitCompletion.isPending}
                  >
                    <CheckCircle2 className="size-4" aria-hidden="true" />
                    {activeUnit && completedUnitIds.has(activeUnit.id)
                      ? "Tandai belum selesai"
                      : "Tandai selesai"}
                  </button>
                </div>
              </div>

              {activeUnit && <BlockList blocks={activeUnit.blocks} />}

              <UnitNavigation
                unitIndex={unitIndex}
                unitCount={units.length}
                onPrevious={() => goTo(unitIndex - 1)}
                onNext={() => goTo(unitIndex + 1)}
              />
            </Stack>
          </AppCard>
        </AppSection>
      )}

      <LessonNavigation previous={context.previousLesson} next={context.nextLesson} />
    </Stack>
  );
}
