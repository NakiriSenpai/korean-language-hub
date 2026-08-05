/**
 * Engine 5 — Scoring Engine (pure functions, no I/O).
 *
 * Auto scoring only: multiple choice, multiple response, true/false, and exact
 * match short answer. AI scoring is intentionally out of scope.
 */

import type { SnapshotQuestion } from "@/modules/assessment";
import type {
  AttemptAnswer,
  ExamGrade,
  ExamScore,
  QuestionOutcome,
  ScoredQuestion,
} from "@/modules/exam/types";

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function sameSet(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const other = new Set(b);
  return a.every((item) => other.has(item));
}

/** Grade band used across result and review screens. */
export function toGrade(percentage: number): ExamGrade {
  if (percentage >= 90) return "A";
  if (percentage >= 80) return "B";
  if (percentage >= 70) return "C";
  if (percentage >= 60) return "D";
  return "E";
}

export function isAnswered(
  question: SnapshotQuestion,
  answer: Pick<AttemptAnswer, "selectedChoiceIds" | "textAnswer"> | undefined,
): boolean {
  if (!answer) return false;
  if (question.type === "short_answer") return Boolean(answer.textAnswer?.trim());
  return answer.selectedChoiceIds.length > 0;
}

/** Outcome for one question against one saved answer. */
export function evaluateQuestion(
  question: SnapshotQuestion,
  answer: Pick<AttemptAnswer, "selectedChoiceIds" | "textAnswer"> | undefined,
): QuestionOutcome {
  if (!isAnswered(question, answer) || !answer) return "empty";

  if (question.type === "short_answer") {
    const expected = question.answerKey ?? "";
    if (!expected.trim()) return "wrong";
    const accepted = expected.split("|").map(normalizeText);
    return accepted.includes(normalizeText(answer.textAnswer ?? "")) ? "correct" : "wrong";
  }

  const correctIds = question.choices.filter((choice) => choice.isCorrect).map((c) => c.id);
  if (correctIds.length === 0) return "wrong";
  return sameSet(correctIds, answer.selectedChoiceIds) ? "correct" : "wrong";
}

export interface ScoreOptions {
  readonly passingScore: number;
}

/** Full auto score for a finished (or previewed) attempt. */
export function scoreAttempt(
  questions: readonly SnapshotQuestion[],
  answers: readonly AttemptAnswer[],
  options: ScoreOptions,
): ExamScore {
  const byVersion = new Map(answers.map((answer) => [answer.questionVersionId, answer]));

  const breakdown: ScoredQuestion[] = questions.map((question, index) => {
    const outcome = evaluateQuestion(question, byVersion.get(question.questionVersionId));
    return {
      questionId: question.questionId,
      questionVersionId: question.questionVersionId,
      position: index,
      outcome,
      points: question.points,
      earnedPoints: outcome === "correct" ? question.points : 0,
    };
  });

  const totalPoints = breakdown.reduce((sum, item) => sum + item.points, 0);
  const earnedPoints = breakdown.reduce((sum, item) => sum + item.earnedPoints, 0);
  const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 10000) / 100 : 0;

  return {
    totalQuestions: questions.length,
    correctCount: breakdown.filter((item) => item.outcome === "correct").length,
    wrongCount: breakdown.filter((item) => item.outcome === "wrong").length,
    emptyCount: breakdown.filter((item) => item.outcome === "empty").length,
    earnedPoints,
    totalPoints,
    percentage,
    grade: toGrade(percentage),
    passed: percentage >= options.passingScore,
    breakdown,
  };
}
