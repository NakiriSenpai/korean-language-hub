import { Flag } from "lucide-react";

import { cn } from "@/lib/utils";
import type { SnapshotQuestion } from "@/modules/assessment";
import { QuestionSkillBadge, QuestionTypeBadge } from "@/modules/assessment";
import { ExamAudioPlayer } from "@/modules/exam/components/ExamAudioPlayer";
import type { AttemptAnswer } from "@/modules/exam/types";
import { TextArea, ghostButtonClass } from "@/shared/components/form";
import { AppCard, Stack } from "@/shared/components/layout";

export interface ExamQuestionViewProps {
  readonly question: SnapshotQuestion;
  readonly index: number;
  readonly total: number;
  readonly answer: AttemptAnswer | undefined;
  readonly disabled?: boolean;
  readonly onSelect: (choiceIds: readonly string[]) => void;
  readonly onText: (value: string) => void;
  readonly onToggleFlag: () => void;
  readonly onAudioLockChange?: (locked: boolean) => void;
}

/** Engine 3 — one question rendered from the snapshot only. */
export function ExamQuestionView({
  question,
  index,
  total,
  answer,
  disabled = false,
  onSelect,
  onText,
  onToggleFlag,
  onAudioLockChange,
}: ExamQuestionViewProps) {
  const selected = answer?.selectedChoiceIds ?? [];
  const multiple = question.type === "multiple_response";

  const toggleChoice = (choiceId: string) => {
    if (disabled) return;
    if (multiple) {
      onSelect(
        selected.includes(choiceId)
          ? selected.filter((id) => id !== choiceId)
          : [...selected, choiceId],
      );
      return;
    }
    onSelect([choiceId]);
  };

  return (
    <AppCard>
      <Stack gap="md">
        <div className="flex flex-wrap items-center gap-xs">
          <span className="rounded-md bg-primary/10 px-sm py-xs text-caption font-medium text-primary">
            Soal {index + 1} / {total}
          </span>
          <QuestionTypeBadge type={question.type} />
          <QuestionSkillBadge skill={question.skill} />
          <span className="text-caption text-text-secondary">{question.points} poin</span>
          <button
            type="button"
            onClick={onToggleFlag}
            aria-pressed={answer?.flagged ?? false}
            className={cn(
              ghostButtonClass,
              "ml-auto",
              answer?.flagged && "border-warning/50 text-warning",
            )}
          >
            <Flag className="size-4" aria-hidden="true" />
            {answer?.flagged ? "Ditandai" : "Tandai"}
          </button>
        </div>

        {question.audioUrl ? (
          <ExamAudioPlayer
            src={question.audioUrl}
            lockWhilePlaying
            initialPlays={answer?.audioPlays ?? 0}
            {...(onAudioLockChange ? { onLockChange: onAudioLockChange } : {})}
          />
        ) : null}

        {question.passage ? (
          <p className="whitespace-pre-line rounded-md bg-muted p-md text-body-sm text-text-secondary">
            {question.passage}
          </p>
        ) : null}

        <p className="whitespace-pre-line text-body text-text-primary">{question.prompt}</p>

        {question.type === "short_answer" ? (
          <TextArea
            aria-label={`Jawaban soal ${index + 1}`}
            value={answer?.textAnswer ?? ""}
            disabled={disabled}
            placeholder="Tulis jawaban Anda"
            onChange={(event) => onText(event.target.value)}
          />
        ) : (
          <ul className="flex flex-col gap-xs">
            {question.choices.map((choice, choiceIndex) => {
              const active = selected.includes(choice.id);
              return (
                <li key={choice.id}>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => toggleChoice(choice.id)}
                    aria-pressed={active}
                    className={cn(
                      "flex min-h-11 w-full items-start gap-sm rounded-md border px-md py-sm text-left",
                      "text-body-sm transition-colors motion-fast disabled:opacity-60",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      active
                        ? "border-primary bg-primary/10 text-text-primary"
                        : "border-border bg-surface text-text-secondary hover:bg-muted",
                    )}
                  >
                    <span className="font-medium">
                      {choice.label ?? String.fromCharCode(65 + choiceIndex)}.
                    </span>
                    <span className="min-w-0 whitespace-pre-line">{choice.content}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Stack>
    </AppCard>
  );
}
