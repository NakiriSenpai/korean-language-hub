/**
 * Randomization helpers (Work Package 7).
 *
 * Pure functions so a future Exam Player can reuse them without touching the
 * database. Order is derived at delivery time; stored data keeps its own order.
 */

import type { SnapshotChoice, SnapshotQuestion } from "@/modules/assessment/types";

/** Fisher-Yates shuffle on a copy of the input. */
export function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = copy[i] as T;
    const b = copy[j] as T;
    copy[i] = b;
    copy[j] = a;
  }
  return copy;
}

export interface RandomizationOptions {
  readonly randomizeQuestions: boolean;
  readonly randomizeChoices: boolean;
}

/** Applies the assessment's randomization settings to a snapshot question list. */
export function randomizeQuestionSet(
  questions: readonly SnapshotQuestion[],
  options: RandomizationOptions,
): readonly SnapshotQuestion[] {
  const ordered = options.randomizeQuestions ? shuffle(questions) : [...questions];

  return ordered.map((question, index) => ({
    ...question,
    position: index,
    choices: options.randomizeChoices
      ? shuffle(question.choices).map((choice, choiceIndex): SnapshotChoice => ({
          ...choice,
          position: choiceIndex,
        }))
      : question.choices,
  }));
}
