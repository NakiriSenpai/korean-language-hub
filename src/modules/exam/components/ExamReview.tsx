import { useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleSlash,
  FileQuestion,
  Info,
  XCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { SnapshotQuestion } from "@/modules/assessment";
import { QuestionSkillBadge, QuestionTypeBadge } from "@/modules/assessment";
import { evaluateQuestion } from "@/modules/exam/services/scoring.service";
import type { AttemptAnswer } from "@/modules/exam/types";
import { ghostButtonClass } from "@/shared/components/form";
import { AppCard, Stack } from "@/shared/components/layout";
import { EmptyState } from "@/shared/components/shell";

const OUTCOME_META = {
  correct: { label: "Benar", icon: CheckCircle2, tone: "text-success" },
  wrong: { label: "Salah", icon: XCircle, tone: "text-destructive" },
  empty: { label: "Tidak dijawab", icon: CircleSlash, tone: "text-text-secondary" },
} as const;

/** Engine 7 — answer review with explanations. */
export function ExamReview({
  questions,
  answers,
}: {
  readonly questions: readonly SnapshotQuestion[];
  readonly answers: readonly AttemptAnswer[];
}) {
  const [index, setIndex] = useState(0);

  if (questions.length === 0) {
    return (
      <EmptyState
        icon={FileQuestion}
        title="Belum ada soal untuk ditinjau"
        description="Snapshot ujian ini tidak memuat soal."
      />
    );
  }

  const question = questions[Math.min(index, questions.length - 1)];
  if (!question) return null;

  const answer = answers.find((item) => item.questionVersionId === question.questionVersionId);
  const outcome = evaluateQuestion(question, answer);
  const meta = OUTCOME_META[outcome];
  const selected = answer?.selectedChoiceIds ?? [];

  return (
    <Stack gap="lg">
      <AppCard>
        <Stack gap="md">
          <div className="flex flex-wrap items-center gap-xs">
            <span className="rounded-md bg-primary/10 px-sm py-xs text-caption font-medium text-primary">
              Soal {index + 1} / {questions.length}
            </span>
            <QuestionTypeBadge type={question.type} />
            <QuestionSkillBadge skill={question.skill} />
            <span className={cn("ml-auto inline-flex items-center gap-xs text-body-sm", meta.tone)}>
              <meta.icon className="size-4" aria-hidden="true" />
              {meta.label}
            </span>
          </div>

          {question.passage ? (
            <p className="whitespace-pre-line rounded-md bg-muted p-md text-body-sm text-text-secondary">
              {question.passage}
            </p>
          ) : null}

          {question.audioUrl ? (
            <audio controls src={question.audioUrl} className="w-full">
              <track kind="captions" />
            </audio>
          ) : null}

          <p className="whitespace-pre-line text-body text-text-primary">{question.prompt}</p>

          {question.type === "short_answer" ? (
            <Stack gap="xs">
              <p className="text-body-sm text-text-secondary">
                Jawaban Anda:{" "}
                <span className="text-text-primary">{answer?.textAnswer || "— kosong —"}</span>
              </p>
              <p className="text-body-sm text-text-secondary">
                Kunci jawaban:{" "}
                <span className="text-text-primary">{question.answerKey ?? "Tidak tersedia"}</span>
              </p>
            </Stack>
          ) : (
            <ul className="flex flex-col gap-xs">
              {question.choices.map((choice, choiceIndex) => {
                const chosen = selected.includes(choice.id);
                return (
                  <li
                    key={choice.id}
                    className={cn(
                      "rounded-md border px-md py-sm text-body-sm",
                      choice.isCorrect
                        ? "border-success/50 bg-success/10 text-text-primary"
                        : chosen
                          ? "border-destructive/50 bg-destructive/10 text-text-primary"
                          : "border-border text-text-secondary",
                    )}
                  >
                    <span className="mr-xs font-medium">
                      {choice.label ?? String.fromCharCode(65 + choiceIndex)}.
                    </span>
                    {choice.content}
                    {chosen && <span className="ml-xs text-caption">(jawaban Anda)</span>}
                    {choice.isCorrect && <span className="ml-xs text-caption">(kunci)</span>}
                  </li>
                );
              })}
            </ul>
          )}

          {question.explanation ? (
            <div className="flex gap-sm rounded-md bg-muted p-md">
              <Info className="size-5 shrink-0 text-primary" aria-hidden="true" />
              <p className="whitespace-pre-line text-body-sm text-text-secondary">
                {question.explanation}
              </p>
            </div>
          ) : null}
        </Stack>
      </AppCard>

      <div className="flex flex-wrap items-center gap-sm">
        <button
          type="button"
          className={ghostButtonClass}
          disabled={index === 0}
          onClick={() => setIndex((current) => Math.max(0, current - 1))}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          Sebelumnya
        </button>
        <button
          type="button"
          className={ghostButtonClass}
          disabled={index >= questions.length - 1}
          onClick={() => setIndex((current) => Math.min(questions.length - 1, current + 1))}
        >
          Berikutnya
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>
    </Stack>
  );
}
