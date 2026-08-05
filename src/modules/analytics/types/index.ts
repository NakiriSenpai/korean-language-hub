/**
 * Analytics Domain — types.
 *
 * The Analytics Domain is strictly read-only: it never writes, and it derives
 * every number from data already produced by Academic, Learning, Assessment,
 * and Exam. "Gelombang" is modelled by the Academic Period (intake wave).
 */

import type { Database } from "@/integrations/supabase/types";

export type AssessmentType = Database["public"]["Enums"]["assessment_type"];
export type ExamGradeLetter = "A" | "B" | "C" | "D" | "E";

/* ------------------------------------------------------------------ */
/* Filter Engine                                                       */
/* ------------------------------------------------------------------ */

export interface AnalyticsFilter {
  /** Academic periods = gelombang / intake waves. */
  readonly periodIds: readonly string[];
  readonly studyGroupIds: readonly string[];
  readonly assessmentIds: readonly string[];
  readonly studentUserIds: readonly string[];
  /** ISO date (yyyy-mm-dd), inclusive. */
  readonly dateFrom: string | null;
  /** ISO date (yyyy-mm-dd), inclusive. */
  readonly dateTo: string | null;
}

export const EMPTY_ANALYTICS_FILTER: AnalyticsFilter = {
  periodIds: [],
  studyGroupIds: [],
  assessmentIds: [],
  studentUserIds: [],
  dateFrom: null,
  dateTo: null,
};

export interface FilterOption {
  readonly id: string;
  readonly label: string;
  readonly hint?: string;
}

export interface AnalyticsFilterOptions {
  readonly periods: readonly FilterOption[];
  readonly studyGroups: readonly (FilterOption & { readonly periodId: string })[];
  readonly assessments: readonly FilterOption[];
  readonly students: readonly FilterOption[];
}

/* ------------------------------------------------------------------ */
/* Dataset                                                             */
/* ------------------------------------------------------------------ */

export interface StudentDirectoryEntry {
  readonly userId: string;
  readonly studentProfileId: string | null;
  readonly fullName: string;
  readonly studentNumber: string | null;
  readonly studyGroupId: string | null;
  readonly studyGroupName: string | null;
  readonly periodId: string | null;
  readonly periodName: string | null;
}

export interface QuestionOutcomeRecord {
  readonly questionId: string;
  readonly outcome: "correct" | "wrong" | "empty";
}

/** One exam result, denormalised with its academic and assessment context. */
export interface ResultRecord {
  readonly resultId: string;
  readonly userId: string;
  readonly studentName: string;
  readonly studentNumber: string | null;
  readonly studyGroupId: string | null;
  readonly studyGroupName: string | null;
  readonly periodId: string | null;
  readonly periodName: string | null;
  readonly assessmentId: string;
  readonly assessmentTitle: string;
  readonly assessmentType: AssessmentType;
  readonly totalQuestions: number;
  readonly correctCount: number;
  readonly wrongCount: number;
  readonly emptyCount: number;
  readonly percentage: number;
  readonly grade: ExamGradeLetter;
  readonly passed: boolean;
  readonly timeUsedSeconds: number;
  readonly createdAt: string;
  readonly outcomes: readonly QuestionOutcomeRecord[];
}

export interface AnalyticsDataset {
  readonly tenantId: string;
  readonly generatedAt: string;
  readonly records: readonly ResultRecord[];
  readonly students: readonly StudentDirectoryEntry[];
  readonly attemptCount: number;
  readonly submittedAttemptCount: number;
  readonly lessonsCompleted: number;
  readonly lessonsTracked: number;
}

/* ------------------------------------------------------------------ */
/* Engine 1 — Student analytics                                        */
/* ------------------------------------------------------------------ */

export interface StudentAnalytics {
  readonly userId: string;
  readonly studentName: string;
  readonly studentNumber: string | null;
  readonly studyGroupName: string | null;
  readonly periodName: string | null;
  readonly examCount: number;
  readonly averageScore: number;
  readonly bestScore: number;
  readonly lowestScore: number;
  readonly passRate: number;
  readonly correctRate: number;
  readonly totalTimeSeconds: number;
  readonly lastExamAt: string | null;
  readonly trend: readonly TrendPoint[];
}

export interface TrendPoint {
  readonly label: string;
  readonly value: number;
}

/* ------------------------------------------------------------------ */
/* Engine 2 — Assessment analytics                                     */
/* ------------------------------------------------------------------ */

export interface QuestionStat {
  readonly questionId: string;
  readonly attempts: number;
  readonly correctRate: number;
  readonly emptyRate: number;
  readonly difficultyBand: "mudah" | "sedang" | "sulit";
}

export interface AssessmentAnalytics {
  readonly assessmentId: string;
  readonly title: string;
  readonly type: AssessmentType;
  readonly participantCount: number;
  readonly attemptCount: number;
  readonly averageScore: number;
  readonly highestScore: number;
  readonly lowestScore: number;
  readonly passRate: number;
  readonly averageTimeSeconds: number;
  readonly scoreDistribution: readonly ScoreBucket[];
  readonly gradeDistribution: readonly GradeBucket[];
  readonly questionStats: readonly QuestionStat[];
}

export interface ScoreBucket {
  readonly label: string;
  readonly count: number;
}

export interface GradeBucket {
  readonly grade: ExamGradeLetter;
  readonly count: number;
}

/* ------------------------------------------------------------------ */
/* Engine 3 — Teacher insights                                         */
/* ------------------------------------------------------------------ */

export interface GroupPerformance {
  readonly studyGroupId: string;
  readonly studyGroupName: string;
  readonly periodName: string | null;
  readonly studentCount: number;
  readonly activeStudentCount: number;
  readonly examCount: number;
  readonly averageScore: number;
  readonly passRate: number;
  readonly participationRate: number;
}

export interface StudentRiskEntry {
  readonly userId: string;
  readonly studentName: string;
  readonly studyGroupName: string | null;
  readonly averageScore: number;
  readonly examCount: number;
  readonly reason: string;
}

export interface TeacherInsights {
  readonly groups: readonly GroupPerformance[];
  readonly topStudents: readonly StudentAnalytics[];
  readonly atRiskStudents: readonly StudentRiskEntry[];
}

/* ------------------------------------------------------------------ */
/* Engine 4 — Institution + platform insights                          */
/* ------------------------------------------------------------------ */

export interface TenantSummary {
  readonly tenantId: string;
  readonly tenantName: string;
  readonly studentCount: number;
  readonly studyGroupCount: number;
  readonly examCount: number;
  readonly averageScore: number;
  readonly passRate: number;
  readonly lessonCompletionRate: number;
}

export interface PlatformSummary {
  readonly tenants: readonly TenantSummary[];
  readonly totalStudents: number;
  readonly totalExams: number;
  readonly averageScore: number;
  readonly passRate: number;
}

/* ------------------------------------------------------------------ */
/* Overview cards                                                      */
/* ------------------------------------------------------------------ */

export interface AnalyticsOverview {
  readonly studentCount: number;
  readonly examCount: number;
  readonly averageScore: number;
  readonly passRate: number;
  readonly completionRate: number;
  readonly averageTimeSeconds: number;
  readonly scoreDistribution: readonly ScoreBucket[];
  readonly gradeDistribution: readonly GradeBucket[];
  readonly trend: readonly TrendPoint[];
}

/* ------------------------------------------------------------------ */
/* Export Engine                                                       */
/* ------------------------------------------------------------------ */

export type ExportFormat = "csv" | "xlsx" | "pdf";

export interface ExportColumn {
  readonly key: string;
  readonly label: string;
  readonly width?: number;
}

export type ExportCell = string | number | boolean | null;

export interface ExportTable {
  readonly title: string;
  readonly columns: readonly ExportColumn[];
  readonly rows: readonly Record<string, ExportCell>[];
}

export interface ExportRequest {
  readonly fileName: string;
  readonly heading: string;
  readonly subtitle?: string;
  readonly tables: readonly ExportTable[];
}
