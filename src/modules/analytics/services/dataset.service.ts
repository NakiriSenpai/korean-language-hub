/**
 * Analytics Dataset — the single read pass every engine aggregates from.
 *
 * Reads only existing domain data (Academic + Assessment + Exam + Learning),
 * denormalises it into flat records, and never writes anything back.
 */

import { supabase } from "@/integrations/supabase/client";
import {
  assertTenant,
  endOfDay,
  startOfDay,
  unwrapList,
} from "@/modules/analytics/services/analytics-client";
import type {
  AnalyticsDataset,
  AnalyticsFilter,
  AssessmentType,
  ExamGradeLetter,
  QuestionOutcomeRecord,
  ResultRecord,
  StudentDirectoryEntry,
} from "@/modules/analytics/types";

interface EnrollmentJoinRow {
  student_profile_id: string;
  study_group_id: string;
  period_id: string;
  status: string;
  student_profiles: {
    id: string;
    user_id: string | null;
    full_name: string;
    student_number: string;
  } | null;
  study_groups: { id: string; name: string; period_id: string } | null;
  academic_periods: { id: string; name: string } | null;
}

interface ResultJoinRow {
  id: string;
  user_id: string;
  assessment_id: string;
  total_questions: number;
  correct_count: number;
  wrong_count: number;
  empty_count: number;
  percentage: number | string;
  grade: string;
  passed: boolean;
  time_used_seconds: number;
  breakdown: unknown;
  created_at: string;
  assessments: { id: string; title: string; type: AssessmentType } | null;
}

const RESULT_COLUMNS =
  "id, user_id, assessment_id, total_questions, correct_count, wrong_count, empty_count, percentage, grade, passed, time_used_seconds, breakdown, created_at, assessments!inner(id, title, type)";

const ENROLLMENT_COLUMNS =
  "student_profile_id, study_group_id, period_id, status, student_profiles!inner(id, user_id, full_name, student_number), study_groups!inner(id, name, period_id), academic_periods!inner(id, name)";

function toOutcomes(breakdown: unknown): readonly QuestionOutcomeRecord[] {
  if (!Array.isArray(breakdown)) return [];
  return breakdown.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const record = item as { questionId?: unknown; outcome?: unknown };
    if (typeof record.questionId !== "string") return [];
    const outcome = record.outcome;
    if (outcome !== "correct" && outcome !== "wrong" && outcome !== "empty") return [];
    return [{ questionId: record.questionId, outcome }];
  });
}

export interface DatasetOptions {
  readonly filter: AnalyticsFilter;
  /** When set, the dataset is hard-limited to this user (student self view). */
  readonly restrictToUserId?: string | null;
}

/** Loads and denormalises everything the analytics engines need. */
export async function loadAnalyticsDataset(
  tenantId: string,
  options: DatasetOptions,
): Promise<AnalyticsDataset> {
  assertTenant(tenantId, "analytics.dataset");
  const { filter, restrictToUserId } = options;

  const enrollmentRows = unwrapList(
    await supabase.from("enrollments").select(ENROLLMENT_COLUMNS).eq("tenant_id", tenantId),
    "analytics.dataset.enrollments",
  ) as unknown as readonly EnrollmentJoinRow[];

  const directory = new Map<string, StudentDirectoryEntry>();
  for (const row of enrollmentRows) {
    const profile = row.student_profiles;
    if (!profile?.user_id) continue;
    if (restrictToUserId && profile.user_id !== restrictToUserId) continue;
    directory.set(profile.user_id, {
      userId: profile.user_id,
      studentProfileId: profile.id,
      fullName: profile.full_name,
      studentNumber: profile.student_number,
      studyGroupId: row.study_groups?.id ?? row.study_group_id,
      studyGroupName: row.study_groups?.name ?? null,
      periodId: row.academic_periods?.id ?? row.period_id,
      periodName: row.academic_periods?.name ?? null,
    });
  }

  const periodSet = new Set(filter.periodIds);
  const groupSet = new Set(filter.studyGroupIds);
  const studentSet = new Set(filter.studentUserIds);

  const inAcademicScope = (userId: string): boolean => {
    const entry = directory.get(userId);
    if (periodSet.size > 0 && (!entry?.periodId || !periodSet.has(entry.periodId))) return false;
    if (groupSet.size > 0 && (!entry?.studyGroupId || !groupSet.has(entry.studyGroupId)))
      return false;
    if (studentSet.size > 0 && !studentSet.has(userId)) return false;
    return true;
  };

  let resultQuery = supabase.from("exam_results").select(RESULT_COLUMNS).eq("tenant_id", tenantId);
  if (restrictToUserId) resultQuery = resultQuery.eq("user_id", restrictToUserId);
  if (filter.assessmentIds.length > 0)
    resultQuery = resultQuery.in("assessment_id", [...filter.assessmentIds]);
  if (filter.dateFrom) resultQuery = resultQuery.gte("created_at", startOfDay(filter.dateFrom));
  if (filter.dateTo) resultQuery = resultQuery.lte("created_at", endOfDay(filter.dateTo));

  const resultRows = unwrapList(
    await resultQuery.order("created_at", { ascending: true }),
    "analytics.dataset.results",
  ) as unknown as readonly ResultJoinRow[];

  const records: ResultRecord[] = [];
  for (const row of resultRows) {
    if (!inAcademicScope(row.user_id)) continue;
    const entry = directory.get(row.user_id);
    records.push({
      resultId: row.id,
      userId: row.user_id,
      studentName: entry?.fullName ?? "Peserta tanpa profil",
      studentNumber: entry?.studentNumber ?? null,
      studyGroupId: entry?.studyGroupId ?? null,
      studyGroupName: entry?.studyGroupName ?? null,
      periodId: entry?.periodId ?? null,
      periodName: entry?.periodName ?? null,
      assessmentId: row.assessment_id,
      assessmentTitle: row.assessments?.title ?? "Asesmen",
      assessmentType: row.assessments?.type ?? "exam",
      totalQuestions: row.total_questions,
      correctCount: row.correct_count,
      wrongCount: row.wrong_count,
      emptyCount: row.empty_count,
      percentage: Number(row.percentage),
      grade: row.grade as ExamGradeLetter,
      passed: row.passed,
      timeUsedSeconds: row.time_used_seconds,
      createdAt: row.created_at,
      outcomes: toOutcomes(row.breakdown),
    });
  }

  let attemptQuery = supabase
    .from("exam_attempts")
    .select("id, user_id, status, created_at")
    .eq("tenant_id", tenantId);
  if (restrictToUserId) attemptQuery = attemptQuery.eq("user_id", restrictToUserId);
  if (filter.assessmentIds.length > 0)
    attemptQuery = attemptQuery.in("assessment_id", [...filter.assessmentIds]);
  if (filter.dateFrom) attemptQuery = attemptQuery.gte("created_at", startOfDay(filter.dateFrom));
  if (filter.dateTo) attemptQuery = attemptQuery.lte("created_at", endOfDay(filter.dateTo));

  const attemptRows = unwrapList(await attemptQuery, "analytics.dataset.attempts") as readonly {
    user_id: string;
    status: string;
  }[];
  const scopedAttempts = attemptRows.filter((row) => inAcademicScope(row.user_id));

  let progressQuery = supabase
    .from("learning_progress")
    .select("user_id, status")
    .eq("tenant_id", tenantId);
  if (restrictToUserId) progressQuery = progressQuery.eq("user_id", restrictToUserId);
  const progressRows = unwrapList(await progressQuery, "analytics.dataset.progress") as readonly {
    user_id: string;
    status: string;
  }[];
  const scopedProgress = progressRows.filter((row) => inAcademicScope(row.user_id));

  return {
    tenantId,
    generatedAt: new Date().toISOString(),
    records,
    students: [...directory.values()],
    attemptCount: scopedAttempts.length,
    submittedAttemptCount: scopedAttempts.filter((row) => row.status === "submitted").length,
    lessonsCompleted: scopedProgress.filter((row) => row.status === "completed").length,
    lessonsTracked: scopedProgress.length,
  };
}
