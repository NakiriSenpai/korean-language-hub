/**
 * Assessment Domain — domain types.
 *
 * Architecture: Question Studio → Question Bank → Assessment Studio → Exam/Quiz/Practice/Try Out.
 * Assessments never store question content; they only reference a question version.
 */

import type { ContentStatus, KnowledgeDifficulty } from "@/modules/knowledge";

export type { ContentStatus, KnowledgeDifficulty };

export type QuestionType = "multiple_choice" | "multiple_response" | "true_false" | "short_answer";

export type QuestionSkill = "reading" | "listening";

export type AssessmentType = "exam" | "quiz" | "practice" | "tryout";

/** One answer option belonging to a question version. */
export interface QuestionChoice {
  readonly id: string;
  readonly tenantId: string;
  readonly questionVersionId: string;
  readonly label: string | null;
  readonly content: string;
  readonly isCorrect: boolean;
  readonly position: number;
}

/** An immutable revision of a question. Editing a question creates a new one. */
export interface QuestionVersion {
  readonly id: string;
  readonly tenantId: string;
  readonly questionId: string;
  readonly version: number;
  readonly type: QuestionType;
  readonly skill: QuestionSkill;
  readonly difficulty: KnowledgeDifficulty;
  readonly prompt: string;
  readonly passage: string | null;
  readonly audioUrl: string | null;
  readonly explanation: string | null;
  /** Expected answer for short answer questions. */
  readonly answerKey: string | null;
  readonly category: string | null;
  readonly tags: readonly string[];
  readonly source: string | null;
  readonly language: string;
  readonly createdBy: string | null;
  readonly createdAt: string;
  readonly choices: readonly QuestionChoice[];
}

/** Question Bank record — metadata mirrored from its current version. */
export interface Question {
  readonly id: string;
  readonly tenantId: string;
  readonly publicId: string;
  readonly type: QuestionType;
  readonly skill: QuestionSkill;
  readonly difficulty: KnowledgeDifficulty;
  readonly category: string | null;
  readonly tags: readonly string[];
  readonly source: string | null;
  readonly language: string;
  readonly status: ContentStatus;
  readonly authorId: string | null;
  readonly currentVersion: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  /** Present on detail reads. */
  readonly latestVersion?: QuestionVersion;
}

export interface QuestionFilters {
  readonly keyword?: string;
  readonly difficulty?: KnowledgeDifficulty | "";
  readonly category?: string;
  readonly tag?: string;
  readonly type?: QuestionType | "";
  readonly skill?: QuestionSkill | "";
  readonly language?: string;
  readonly status?: ContentStatus | "";
}

export interface Assessment {
  readonly id: string;
  readonly tenantId: string;
  readonly title: string;
  readonly slug: string;
  readonly description: string | null;
  readonly type: AssessmentType;
  readonly status: ContentStatus;
  readonly difficulty: KnowledgeDifficulty;
  readonly durationMinutes: number;
  readonly passingScore: number;
  readonly randomizeQuestions: boolean;
  readonly randomizeChoices: boolean;
  readonly publishedAt: string | null;
  readonly publishedVersion: number;
  readonly createdBy: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** A question reference inside an assessment, pinned to one version. */
export interface AssessmentQuestion {
  readonly id: string;
  readonly tenantId: string;
  readonly assessmentId: string;
  readonly questionId: string;
  readonly questionVersionId: string;
  readonly position: number;
  readonly points: number;
  readonly publicId: string;
  readonly version: number;
  readonly type: QuestionType;
  readonly skill: QuestionSkill;
  readonly difficulty: KnowledgeDifficulty;
  readonly prompt: string;
}

/** Frozen copy of an assessment produced at publish time. */
export interface AssessmentSnapshot {
  readonly id: string;
  readonly tenantId: string;
  readonly assessmentId: string;
  readonly version: number;
  readonly questionCount: number;
  readonly totalPoints: number;
  readonly payload: AssessmentSnapshotPayload;
  readonly createdBy: string | null;
  readonly createdAt: string;
}

export interface AssessmentSnapshotPayload {
  readonly assessment: {
    readonly id: string;
    readonly title: string;
    readonly slug: string;
    readonly type: AssessmentType;
    readonly difficulty: KnowledgeDifficulty;
    readonly durationMinutes: number;
    readonly passingScore: number;
    readonly randomizeQuestions: boolean;
    readonly randomizeChoices: boolean;
  };
  readonly questions: readonly SnapshotQuestion[];
  readonly takenAt: string;
}

export interface SnapshotQuestion {
  readonly questionId: string;
  readonly questionVersionId: string;
  readonly publicId: string;
  readonly version: number;
  readonly position: number;
  readonly points: number;
  readonly type: QuestionType;
  readonly skill: QuestionSkill;
  readonly difficulty: KnowledgeDifficulty;
  readonly prompt: string;
  readonly passage: string | null;
  readonly audioUrl: string | null;
  readonly explanation: string | null;
  readonly answerKey: string | null;
  readonly choices: readonly SnapshotChoice[];
}

export interface SnapshotChoice {
  readonly id: string;
  readonly label: string | null;
  readonly content: string;
  readonly isCorrect: boolean;
  readonly position: number;
}
