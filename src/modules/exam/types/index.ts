/**
 * Exam Domain — types.
 *
 * The Exam Engine only ever reads an immutable Assessment Snapshot. It never
 * touches the Question Studio or the Question Bank.
 */

import type { AssessmentSnapshotPayload, SnapshotQuestion } from "@/modules/assessment";
import type { Database } from "@/integrations/supabase/types";

export type AttemptStatus = Database["public"]["Enums"]["attempt_status"];

/** Runtime package produced by the Assessment Loader. Read-only by contract. */
export interface ExamPackage {
  readonly snapshotId: string;
  readonly assessmentId: string;
  readonly snapshotVersion: number;
  readonly title: string;
  readonly type: AssessmentSnapshotPayload["assessment"]["type"];
  readonly difficulty: AssessmentSnapshotPayload["assessment"]["difficulty"];
  readonly durationMinutes: number;
  readonly passingScore: number;
  readonly randomizeQuestions: boolean;
  readonly randomizeChoices: boolean;
  readonly questions: readonly SnapshotQuestion[];
  readonly totalPoints: number;
}

export interface ExamAttempt {
  readonly id: string;
  readonly tenantId: string;
  readonly assessmentId: string;
  readonly snapshotId: string;
  readonly snapshotVersion: number;
  readonly userId: string;
  readonly status: AttemptStatus;
  readonly questionOrder: readonly string[];
  readonly durationMinutes: number;
  readonly startedAt: string | null;
  readonly expiresAt: string | null;
  readonly submittedAt: string | null;
  readonly lastSavedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AttemptAnswer {
  readonly id: string;
  readonly tenantId: string;
  readonly attemptId: string;
  readonly questionId: string;
  readonly questionVersionId: string;
  readonly selectedChoiceIds: readonly string[];
  readonly textAnswer: string | null;
  readonly flagged: boolean;
  readonly audioPlays: number;
  readonly answeredAt: string | null;
}

export interface AttemptAnswerInput {
  readonly questionId: string;
  readonly questionVersionId: string;
  readonly selectedChoiceIds?: readonly string[];
  readonly textAnswer?: string | null;
  readonly flagged?: boolean;
  readonly audioPlays?: number;
}

export type QuestionOutcome = "correct" | "wrong" | "empty";

export interface ScoredQuestion {
  readonly questionId: string;
  readonly questionVersionId: string;
  readonly position: number;
  readonly outcome: QuestionOutcome;
  readonly points: number;
  readonly earnedPoints: number;
}

export interface ExamScore {
  readonly totalQuestions: number;
  readonly correctCount: number;
  readonly wrongCount: number;
  readonly emptyCount: number;
  readonly earnedPoints: number;
  readonly totalPoints: number;
  readonly percentage: number;
  readonly grade: ExamGrade;
  readonly passed: boolean;
  readonly breakdown: readonly ScoredQuestion[];
}

export type ExamGrade = "A" | "B" | "C" | "D" | "E";

export interface ExamResult {
  readonly id: string;
  readonly tenantId: string;
  readonly attemptId: string;
  readonly assessmentId: string;
  readonly userId: string;
  readonly totalQuestions: number;
  readonly correctCount: number;
  readonly wrongCount: number;
  readonly emptyCount: number;
  readonly earnedPoints: number;
  readonly totalPoints: number;
  readonly percentage: number;
  readonly grade: ExamGrade;
  readonly passed: boolean;
  readonly timeUsedSeconds: number;
  readonly breakdown: readonly ScoredQuestion[];
  readonly createdAt: string;
}

/** Exam list entry: a published assessment that owns at least one snapshot. */
export interface ExamListItem {
  readonly assessmentId: string;
  readonly title: string;
  readonly slug: string;
  readonly description: string | null;
  readonly type: AssessmentSnapshotPayload["assessment"]["type"];
  readonly difficulty: AssessmentSnapshotPayload["assessment"]["difficulty"];
  readonly durationMinutes: number;
  readonly passingScore: number;
  readonly questionCount: number;
  readonly snapshotVersion: number;
}
