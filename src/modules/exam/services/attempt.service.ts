/**
 * Engine 2 — Attempt Engine.
 *
 * Start, resume, auto save, save answer, finish, and abandon. An attempt is
 * always bound to one immutable snapshot; the snapshot id and question order
 * are frozen at start time so a resume is always identical.
 */

import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { AssessmentLoader } from "@/modules/exam/services/loader.service";
import {
  assertTenant,
  assertUser,
  toExamError,
  unwrap,
  unwrapList,
  type ExamScope,
} from "@/modules/exam/services/exam-client";
import type {
  AttemptAnswer,
  AttemptAnswerInput,
  AttemptStatus,
  ExamAttempt,
} from "@/modules/exam/types";
import { AppError } from "@/shared/platform";

const ATTEMPT_COLUMNS =
  "id, tenant_id, assessment_id, snapshot_id, snapshot_version, user_id, status, question_order, duration_minutes, started_at, expires_at, submitted_at, last_saved_at, created_at, updated_at";

const ANSWER_COLUMNS =
  "id, tenant_id, attempt_id, question_id, question_version_id, selected_choice_ids, text_answer, flagged, audio_plays, answered_at";

interface AttemptRow {
  id: string;
  tenant_id: string;
  assessment_id: string;
  snapshot_id: string;
  snapshot_version: number;
  user_id: string;
  status: AttemptStatus;
  question_order: unknown;
  duration_minutes: number;
  started_at: string | null;
  expires_at: string | null;
  submitted_at: string | null;
  last_saved_at: string | null;
  created_at: string;
  updated_at: string;
}

interface AnswerRow {
  id: string;
  tenant_id: string;
  attempt_id: string;
  question_id: string;
  question_version_id: string;
  selected_choice_ids: unknown;
  text_answer: string | null;
  flagged: boolean;
  audio_plays: number;
  answered_at: string | null;
}

function toStringArray(value: unknown): readonly string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function toAttempt(row: AttemptRow): ExamAttempt {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    assessmentId: row.assessment_id,
    snapshotId: row.snapshot_id,
    snapshotVersion: row.snapshot_version,
    userId: row.user_id,
    status: row.status,
    questionOrder: toStringArray(row.question_order),
    durationMinutes: row.duration_minutes,
    startedAt: row.started_at,
    expiresAt: row.expires_at,
    submittedAt: row.submitted_at,
    lastSavedAt: row.last_saved_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toAnswer(row: AnswerRow): AttemptAnswer {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    attemptId: row.attempt_id,
    questionId: row.question_id,
    questionVersionId: row.question_version_id,
    selectedChoiceIds: toStringArray(row.selected_choice_ids),
    textAnswer: row.text_answer,
    flagged: row.flagged,
    audioPlays: row.audio_plays,
    answeredAt: row.answered_at,
  };
}

/** True when the server side deadline has passed. */
export function isExpired(attempt: ExamAttempt, now = Date.now()): boolean {
  if (!attempt.expiresAt) return false;
  return new Date(attempt.expiresAt).getTime() <= now;
}

export const AttemptService = {
  async get(tenantId: string, attemptId: string): Promise<ExamAttempt> {
    assertTenant(tenantId, "exam.attempt.get");
    const row = unwrap(
      await supabase
        .from("exam_attempts")
        .select(ATTEMPT_COLUMNS)
        .eq("tenant_id", tenantId)
        .eq("id", attemptId)
        .maybeSingle(),
      "exam.attempt.get",
    ) as AttemptRow;
    return toAttempt(row);
  },

  /** Open attempt for the current user on the given assessment, if any. */
  async findActive(scope: ExamScope, assessmentId: string): Promise<ExamAttempt | null> {
    assertTenant(scope.tenantId, "exam.attempt.active");
    assertUser(scope.userId, "exam.attempt.active");
    const rows = unwrapList(
      await supabase
        .from("exam_attempts")
        .select(ATTEMPT_COLUMNS)
        .eq("tenant_id", scope.tenantId)
        .eq("assessment_id", assessmentId)
        .eq("user_id", scope.userId)
        .in("status", ["draft", "in_progress"])
        .order("created_at", { ascending: false })
        .limit(1),
      "exam.attempt.active",
    ) as readonly AttemptRow[];
    const row = rows[0];
    return row ? toAttempt(row) : null;
  },

  async listMine(scope: ExamScope, assessmentId?: string): Promise<readonly ExamAttempt[]> {
    assertTenant(scope.tenantId, "exam.attempt.list");
    assertUser(scope.userId, "exam.attempt.list");
    let query = supabase
      .from("exam_attempts")
      .select(ATTEMPT_COLUMNS)
      .eq("tenant_id", scope.tenantId)
      .eq("user_id", scope.userId)
      .order("created_at", { ascending: false });
    if (assessmentId) query = query.eq("assessment_id", assessmentId);
    const rows = unwrapList(await query, "exam.attempt.list") as readonly AttemptRow[];
    return rows.map(toAttempt);
  },

  /** Starts a new attempt, or resumes the open one. */
  async startOrResume(scope: ExamScope, assessmentId: string): Promise<ExamAttempt> {
    const existing = await AttemptService.findActive(scope, assessmentId);
    if (existing) {
      if (isExpired(existing)) return AttemptService.expire(scope, existing.id);
      return existing;
    }

    const examPackage = await AssessmentLoader.loadLatest(scope.tenantId, assessmentId);
    const order = AssessmentLoader.buildQuestionOrder(examPackage);
    const startedAt = new Date();
    const expiresAt =
      examPackage.durationMinutes > 0
        ? new Date(startedAt.getTime() + examPackage.durationMinutes * 60_000)
        : null;

    const row = unwrap(
      await supabase
        .from("exam_attempts")
        .insert({
          tenant_id: scope.tenantId,
          assessment_id: assessmentId,
          snapshot_id: examPackage.snapshotId,
          snapshot_version: examPackage.snapshotVersion,
          user_id: scope.userId,
          status: "in_progress",
          question_order: order as unknown as Json,
          duration_minutes: examPackage.durationMinutes,
          started_at: startedAt.toISOString(),
          expires_at: expiresAt ? expiresAt.toISOString() : null,
          last_saved_at: startedAt.toISOString(),
        })
        .select(ATTEMPT_COLUMNS)
        .single(),
      "exam.attempt.start",
    ) as AttemptRow;

    return toAttempt(row);
  },

  async answers(tenantId: string, attemptId: string): Promise<readonly AttemptAnswer[]> {
    assertTenant(tenantId, "exam.answer.list");
    const rows = unwrapList(
      await supabase
        .from("attempt_answers")
        .select(ANSWER_COLUMNS)
        .eq("tenant_id", tenantId)
        .eq("attempt_id", attemptId),
      "exam.answer.list",
    ) as readonly AnswerRow[];
    return rows.map(toAnswer);
  },

  /** Upserts one answer. Safe to call repeatedly (auto save). */
  async saveAnswer(
    scope: ExamScope,
    attemptId: string,
    input: AttemptAnswerInput,
  ): Promise<AttemptAnswer> {
    assertTenant(scope.tenantId, "exam.answer.save");
    assertUser(scope.userId, "exam.answer.save");

    const row = unwrap(
      await supabase
        .from("attempt_answers")
        .upsert(
          {
            tenant_id: scope.tenantId,
            attempt_id: attemptId,
            question_id: input.questionId,
            question_version_id: input.questionVersionId,
            selected_choice_ids: (input.selectedChoiceIds ?? []) as unknown as Json,
            text_answer: input.textAnswer ?? null,
            flagged: input.flagged ?? false,
            audio_plays: input.audioPlays ?? 0,
            answered_at: new Date().toISOString(),
          },
          { onConflict: "attempt_id,question_version_id" },
        )
        .select(ANSWER_COLUMNS)
        .single(),
      "exam.answer.save",
    ) as AnswerRow;

    await AttemptService.touch(scope, attemptId);
    return toAnswer(row);
  },

  /** Auto save heartbeat — records that the runtime is alive. */
  async touch(scope: ExamScope, attemptId: string): Promise<void> {
    const { error } = await supabase
      .from("exam_attempts")
      .update({ last_saved_at: new Date().toISOString() })
      .eq("tenant_id", scope.tenantId)
      .eq("id", attemptId)
      .eq("user_id", scope.userId);
    if (error) throw toExamError(error, "exam.attempt.touch");
  },

  async setStatus(
    scope: ExamScope,
    attemptId: string,
    status: AttemptStatus,
  ): Promise<ExamAttempt> {
    assertTenant(scope.tenantId, "exam.attempt.status");
    assertUser(scope.userId, "exam.attempt.status");
    const patch: Record<string, unknown> = {
      status,
      last_saved_at: new Date().toISOString(),
    };
    if (status === "submitted" || status === "expired") {
      patch["submitted_at"] = new Date().toISOString();
    }

    const row = unwrap(
      await supabase
        .from("exam_attempts")
        .update(patch)
        .eq("tenant_id", scope.tenantId)
        .eq("id", attemptId)
        .eq("user_id", scope.userId)
        .select(ATTEMPT_COLUMNS)
        .single(),
      "exam.attempt.status",
    ) as AttemptRow;
    return toAttempt(row);
  },

  async finish(scope: ExamScope, attemptId: string): Promise<ExamAttempt> {
    const attempt = await AttemptService.get(scope.tenantId, attemptId);
    if (attempt.status === "submitted") return attempt;
    if (attempt.userId !== scope.userId) {
      throw new AppError("Percobaan ujian ini bukan milik Anda.", {
        kind: "permission",
        context: { scope: "exam.attempt.finish" },
      });
    }
    return AttemptService.setStatus(scope, attemptId, "submitted");
  },

  async abandon(scope: ExamScope, attemptId: string): Promise<ExamAttempt> {
    return AttemptService.setStatus(scope, attemptId, "abandoned");
  },

  async expire(scope: ExamScope, attemptId: string): Promise<ExamAttempt> {
    return AttemptService.setStatus(scope, attemptId, "expired");
  },
};
