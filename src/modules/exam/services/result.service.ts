/**
 * Engine 6 — Result.
 * Persists the auto score of a submitted attempt and reads it back.
 */

import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { AssessmentLoader } from "@/modules/exam/services/loader.service";
import { AttemptService } from "@/modules/exam/services/attempt.service";
import { scoreAttempt } from "@/modules/exam/services/scoring.service";
import {
  assertTenant,
  assertUser,
  unwrap,
  unwrapList,
  type ExamScope,
} from "@/modules/exam/services/exam-client";
import type { ExamGrade, ExamResult, ScoredQuestion } from "@/modules/exam/types";

const RESULT_COLUMNS =
  "id, tenant_id, attempt_id, assessment_id, user_id, total_questions, correct_count, wrong_count, empty_count, earned_points, total_points, percentage, grade, passed, time_used_seconds, breakdown, created_at";

interface ResultRow {
  id: string;
  tenant_id: string;
  attempt_id: string;
  assessment_id: string;
  user_id: string;
  total_questions: number;
  correct_count: number;
  wrong_count: number;
  empty_count: number;
  earned_points: number;
  total_points: number;
  percentage: number | string;
  grade: string;
  passed: boolean;
  time_used_seconds: number;
  breakdown: unknown;
  created_at: string;
}

function toResult(row: ResultRow): ExamResult {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    attemptId: row.attempt_id,
    assessmentId: row.assessment_id,
    userId: row.user_id,
    totalQuestions: row.total_questions,
    correctCount: row.correct_count,
    wrongCount: row.wrong_count,
    emptyCount: row.empty_count,
    earnedPoints: row.earned_points,
    totalPoints: row.total_points,
    percentage: Number(row.percentage),
    grade: row.grade as ExamGrade,
    passed: row.passed,
    timeUsedSeconds: row.time_used_seconds,
    breakdown: Array.isArray(row.breakdown) ? (row.breakdown as ScoredQuestion[]) : [],
    createdAt: row.created_at,
  };
}

export const ResultService = {
  async findByAttempt(tenantId: string, attemptId: string): Promise<ExamResult | null> {
    assertTenant(tenantId, "exam.result.find");
    const rows = unwrapList(
      await supabase
        .from("exam_results")
        .select(RESULT_COLUMNS)
        .eq("tenant_id", tenantId)
        .eq("attempt_id", attemptId)
        .limit(1),
      "exam.result.find",
    ) as readonly ResultRow[];
    const row = rows[0];
    return row ? toResult(row) : null;
  },

  async listMine(scope: ExamScope): Promise<readonly ExamResult[]> {
    assertTenant(scope.tenantId, "exam.result.list");
    assertUser(scope.userId, "exam.result.list");
    const rows = unwrapList(
      await supabase
        .from("exam_results")
        .select(RESULT_COLUMNS)
        .eq("tenant_id", scope.tenantId)
        .eq("user_id", scope.userId)
        .order("created_at", { ascending: false }),
      "exam.result.list",
    ) as readonly ResultRow[];
    return rows.map(toResult);
  },

  /**
   * Scores a submitted attempt against its own snapshot and stores the result.
   * Idempotent: an existing result is returned untouched.
   */
  async finalize(scope: ExamScope, attemptId: string): Promise<ExamResult> {
    assertTenant(scope.tenantId, "exam.result.finalize");
    assertUser(scope.userId, "exam.result.finalize");

    const existing = await ResultService.findByAttempt(scope.tenantId, attemptId);
    if (existing) return existing;

    const attempt = await AttemptService.get(scope.tenantId, attemptId);
    const base = await AssessmentLoader.loadById(scope.tenantId, attempt.snapshotId);
    const examPackage = AssessmentLoader.applyOrder(base, attempt.questionOrder);
    const answers = await AttemptService.answers(scope.tenantId, attemptId);

    const score = scoreAttempt(examPackage.questions, answers, {
      passingScore: examPackage.passingScore,
    });

    const startedAt = attempt.startedAt ? new Date(attempt.startedAt).getTime() : null;
    const submittedAt = attempt.submittedAt ? new Date(attempt.submittedAt).getTime() : Date.now();
    const timeUsedSeconds = startedAt ? Math.max(0, Math.round((submittedAt - startedAt) / 1000)) : 0;

    const row = unwrap(
      await supabase
        .from("exam_results")
        .insert({
          tenant_id: scope.tenantId,
          attempt_id: attemptId,
          assessment_id: attempt.assessmentId,
          user_id: scope.userId,
          total_questions: score.totalQuestions,
          correct_count: score.correctCount,
          wrong_count: score.wrongCount,
          empty_count: score.emptyCount,
          earned_points: score.earnedPoints,
          total_points: score.totalPoints,
          percentage: score.percentage,
          grade: score.grade,
          passed: score.passed,
          time_used_seconds: timeUsedSeconds,
          breakdown: score.breakdown as unknown as Json,
        })
        .select(RESULT_COLUMNS)
        .single(),
      "exam.result.finalize",
    ) as ResultRow;

    return toResult(row);
  },
};
