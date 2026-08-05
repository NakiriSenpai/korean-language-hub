import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Send,
  Timer,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { ExamQuestionView } from "@/modules/exam/components/ExamQuestionView";
import { QuestionPalette } from "@/modules/exam/components/QuestionPalette";
import {
  useAttemptAnswers,
  useAttemptPackage,
  useExpireAttempt,
  useFinishAttempt,
  useSaveAnswer,
  useTouchAttempt,
} from "@/modules/exam/hooks/useExam";
import {
  useAutoSave,
  useExamTimer,
  useExitGuard,
  useFullscreen,
} from "@/modules/exam/hooks/useExamRuntime";
import { isAnswered } from "@/modules/exam/services/scoring.service";
import type { AttemptAnswer, ExamAttempt } from "@/modules/exam/types";
import { buttonClass, ghostButtonClass } from "@/shared/components/form";
import { AppCard, Stack } from "@/shared/components/layout";
import { RouteLoading } from "@/shared/components/shell";
import { toUserMessage, useOnlineStatus } from "@/shared/platform";

const AUTO_SAVE_INTERVAL_MS = 20_000;

/** Engine 3 — the exam runtime shell (timer, palette, navigation, review). */
export function ExamRuntime({ attempt }: { readonly attempt: ExamAttempt }) {
  const navigate = useNavigate();
  const online = useOnlineStatus();
  const fullscreen = useFullscreen();

  const examPackage = useAttemptPackage(attempt.snapshotId, attempt.questionOrder);
  const answers = useAttemptAnswers(attempt.id);
  const saveAnswer = useSaveAnswer();
  const touch = useTouchAttempt();
  const finish = useFinishAttempt();
  const expire = useExpireAttempt();

  const [index, setIndex] = useState(0);
  const [reviewing, setReviewing] = useState(false);
  const [navLocked, setNavLocked] = useState(false);
  const [pendingSync, setPendingSync] = useState(false);
  const submittingRef = useRef(false);

  const open = attempt.status === "in_progress" || attempt.status === "draft";
  useExitGuard(open);

  const questions = useMemo(() => examPackage.data?.questions ?? [], [examPackage.data]);
  const answerMap = useMemo(() => {
    const map = new Map<string, AttemptAnswer>();
    (answers.data ?? []).forEach((answer) => map.set(answer.questionVersionId, answer));
    return map;
  }, [answers.data]);

  const submit = useCallback(
    async (reason: "manual" | "expired") => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      try {
        if (reason === "expired") {
          await expire.mutateAsync(attempt.id);
          toast.info("Waktu ujian habis, jawaban terakhir Anda tersimpan.");
        } else {
          await finish.mutateAsync(attempt.id);
          toast.success("Ujian berhasil dikumpulkan.");
        }
        await navigate({
          to: "/exam/attempts/$attemptId/result",
          params: { attemptId: attempt.id },
        });
      } catch (error) {
        submittingRef.current = false;
        toast.error(toUserMessage(error));
      }
    },
    [attempt.id, expire, finish, navigate],
  );

  const timer = useExamTimer(
    attempt.startedAt,
    attempt.expiresAt,
    open ? () => void submit("expired") : undefined,
  );

  useAutoSave(open && online, AUTO_SAVE_INTERVAL_MS, () => {
    touch.mutate(attempt.id, {
      onSuccess: () => setPendingSync(false),
      onError: () => setPendingSync(true),
    });
  });

  // Recovery after the connection comes back (Engine 8).
  useEffect(() => {
    if (online && pendingSync) {
      void answers.refetch();
      setPendingSync(false);
      toast.success("Koneksi kembali, data ujian disinkronkan.");
    }
  }, [answers, online, pendingSync]);

  const persist = useCallback(
    (patch: {
      selectedChoiceIds?: readonly string[];
      textAnswer?: string | null;
      flagged?: boolean;
    }) => {
      const question = questions[index];
      if (!question || !open) return;
      const current = answerMap.get(question.questionVersionId);
      saveAnswer.mutate(
        {
          attemptId: attempt.id,
          answer: {
            questionId: question.questionId,
            questionVersionId: question.questionVersionId,
            selectedChoiceIds: patch.selectedChoiceIds ?? current?.selectedChoiceIds ?? [],
            textAnswer: patch.textAnswer ?? current?.textAnswer ?? null,
            flagged: patch.flagged ?? current?.flagged ?? false,
            audioPlays: current?.audioPlays ?? 0,
          },
        },
        { onError: () => setPendingSync(true) },
      );
    },
    [answerMap, attempt.id, index, open, questions, saveAnswer],
  );

  if (examPackage.isPending || answers.isPending) return <RouteLoading />;
  if (examPackage.isError) {
    return (
      <AppCard>
        <p role="alert" className="text-body-sm text-destructive">
          {toUserMessage(examPackage.error)}
        </p>
      </AppCard>
    );
  }

  const question = questions[index];
  const paletteEntries = questions.map((item, position) => {
    const answer = answerMap.get(item.questionVersionId);
    return {
      index: position,
      answered: isAnswered(item, answer),
      flagged: answer?.flagged ?? false,
    };
  });
  const answeredCount = paletteEntries.filter((entry) => entry.answered).length;

  return (
    <Stack gap="lg">
      <AppCard>
        <div className="flex flex-wrap items-center gap-md">
          <span
            className={cn(
              "inline-flex min-h-11 items-center gap-xs rounded-md px-md text-body font-medium tabular-nums",
              timer.hasDeadline && timer.remainingSeconds <= 60
                ? "bg-destructive/10 text-destructive"
                : "bg-primary/10 text-primary",
            )}
            aria-live="polite"
          >
            <Timer className="size-5" aria-hidden="true" />
            {timer.label}
          </span>

          <span className="text-body-sm text-text-secondary">
            Terjawab {answeredCount} dari {questions.length}
          </span>

          {!online && (
            <span className="inline-flex items-center gap-xs text-caption text-warning">
              <WifiOff className="size-4" aria-hidden="true" /> Mode luring, jawaban akan
              disinkronkan
            </span>
          )}

          {fullscreen.supported && (
            <button
              type="button"
              onClick={fullscreen.toggle}
              className={cn(ghostButtonClass, "ml-auto")}
            >
              {fullscreen.active ? (
                <Minimize2 className="size-4" aria-hidden="true" />
              ) : (
                <Maximize2 className="size-4" aria-hidden="true" />
              )}
              {fullscreen.active ? "Keluar layar penuh" : "Layar penuh"}
            </button>
          )}
        </div>
      </AppCard>

      {reviewing ? (
        <AppCard>
          <Stack gap="md">
            <h3 className="text-h3 text-text-primary">Tinjau jawaban</h3>
            <p className="text-body-sm text-text-secondary">
              {questions.length - answeredCount} soal belum dijawab. Periksa kembali sebelum
              mengumpulkan.
            </p>
            <QuestionPalette
              entries={paletteEntries}
              current={index}
              onJump={(next) => {
                setIndex(next);
                setReviewing(false);
              }}
            />
            <div className="flex flex-wrap gap-sm">
              <button
                type="button"
                className={ghostButtonClass}
                onClick={() => setReviewing(false)}
              >
                Kembali ke soal
              </button>
              <button
                type="button"
                className={buttonClass}
                disabled={finish.isPending}
                onClick={() => void submit("manual")}
              >
                <Send className="size-4" aria-hidden="true" />
                Kumpulkan ujian
              </button>
            </div>
          </Stack>
        </AppCard>
      ) : question ? (
        <>
          <ExamQuestionView
            question={question}
            index={index}
            total={questions.length}
            answer={answerMap.get(question.questionVersionId)}
            disabled={!open}
            onSelect={(choiceIds) => persist({ selectedChoiceIds: choiceIds })}
            onText={(value) => persist({ textAnswer: value })}
            onToggleFlag={() =>
              persist({ flagged: !(answerMap.get(question.questionVersionId)?.flagged ?? false) })
            }
            onAudioLockChange={setNavLocked}
          />

          <div className="flex flex-wrap items-center gap-sm">
            <button
              type="button"
              className={ghostButtonClass}
              disabled={index === 0 || navLocked}
              onClick={() => setIndex((current) => Math.max(0, current - 1))}
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
              Sebelumnya
            </button>
            <button
              type="button"
              className={ghostButtonClass}
              disabled={index >= questions.length - 1 || navLocked}
              onClick={() => setIndex((current) => Math.min(questions.length - 1, current + 1))}
            >
              Berikutnya
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              className={cn(buttonClass, "ml-auto")}
              disabled={navLocked || !open}
              onClick={() => setReviewing(true)}
            >
              Tinjau &amp; kumpulkan
            </button>
          </div>

          <AppCard>
            <QuestionPalette
              entries={paletteEntries}
              current={index}
              disabled={navLocked}
              onJump={setIndex}
            />
          </AppCard>
        </>
      ) : null}
    </Stack>
  );
}
