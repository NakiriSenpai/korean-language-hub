/**
 * Snapshot service (Work Package 8).
 *
 * Publishing an assessment freezes its full content — question text, choices,
 * points, and settings — into `assessment_snapshots`. Snapshots have no update
 * or delete policy, so later Question Bank edits can never alter a published
 * assessment.
 */

import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import {
  assertTenant,
  assertUser,
  toAssessmentError,
  unwrap,
  unwrapList,
  type AssessmentScope,
} from "@/modules/assessment/services/assessment-client";
import { AssessmentService } from "@/modules/assessment/services/assessment.service";
import { QuestionService } from "@/modules/assessment/services/question.service";
import type {
  AssessmentSnapshot,
  AssessmentSnapshotPayload,
  SnapshotQuestion,
} from "@/modules/assessment/types";
import { AppError } from "@/shared/platform";

const SNAPSHOT_COLUMNS =
  "id, tenant_id, assessment_id, version, payload, question_count, total_points, created_by, created_at";

interface SnapshotRow {
  id: string;
  tenant_id: string;
  assessment_id: string;
  version: number;
  payload: unknown;
  question_count: number;
  total_points: number;
  created_by: string | null;
  created_at: string;
}

function toSnapshot(row: SnapshotRow): AssessmentSnapshot {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    assessmentId: row.assessment_id,
    version: row.version,
    questionCount: row.question_count,
    totalPoints: row.total_points,
    payload: row.payload as AssessmentSnapshotPayload,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

export const SnapshotService = {
  async list(tenantId: string, assessmentId: string): Promise<readonly AssessmentSnapshot[]> {
    assertTenant(tenantId, "snapshot.list");
    const rows = unwrapList(
      await supabase
        .from("assessment_snapshots")
        .select(SNAPSHOT_COLUMNS)
        .eq("tenant_id", tenantId)
        .eq("assessment_id", assessmentId)
        .order("version", { ascending: false }),
      "snapshot.list",
    ) as SnapshotRow[];
    return rows.map(toSnapshot);
  },

  /** Publishes the assessment and writes an immutable snapshot of its content. */
  async publish(scope: AssessmentScope, assessmentId: string): Promise<AssessmentSnapshot> {
    assertTenant(scope.tenantId, "snapshot.publish");
    assertUser(scope.userId, "snapshot.publish");

    const assessment = await AssessmentService.get(scope.tenantId, assessmentId);
    const references = await AssessmentService.questions(scope.tenantId, assessmentId);

    if (references.length === 0) {
      throw new AppError("Asesmen belum memiliki soal, tambahkan soal sebelum menerbitkan.", {
        kind: "validation",
        context: { scope: "snapshot.publish" },
      });
    }

    const versions = await QuestionService.versionsByIds(
      scope.tenantId,
      references.map((reference) => reference.questionVersionId),
    );
    const versionById = new Map(versions.map((version) => [version.id, version]));

    const questions: SnapshotQuestion[] = references.map((reference, index) => {
      const version = versionById.get(reference.questionVersionId);
      if (!version) {
        throw new AppError("Versi soal tidak ditemukan, perbarui daftar soal asesmen.", {
          kind: "notFound",
          context: { scope: "snapshot.publish", versionId: reference.questionVersionId },
        });
      }
      return {
        questionId: reference.questionId,
        questionVersionId: version.id,
        publicId: reference.publicId,
        version: version.version,
        position: reference.position || index,
        points: reference.points,
        type: version.type,
        skill: version.skill,
        difficulty: version.difficulty,
        prompt: version.prompt,
        passage: version.passage,
        audioUrl: version.audioUrl,
        explanation: version.explanation,
        answerKey: version.answerKey,
        choices: version.choices.map((choice) => ({
          id: choice.id,
          label: choice.label,
          content: choice.content,
          isCorrect: choice.isCorrect,
          position: choice.position,
        })),
      };
    });

    const payload: AssessmentSnapshotPayload = {
      assessment: {
        id: assessment.id,
        title: assessment.title,
        slug: assessment.slug,
        type: assessment.type,
        difficulty: assessment.difficulty,
        durationMinutes: assessment.durationMinutes,
        passingScore: assessment.passingScore,
        randomizeQuestions: assessment.randomizeQuestions,
        randomizeChoices: assessment.randomizeChoices,
      },
      questions,
      takenAt: new Date().toISOString(),
    };

    const version = assessment.publishedVersion + 1;
    const totalPoints = questions.reduce((sum, question) => sum + question.points, 0);

    const row = unwrap(
      await supabase
        .from("assessment_snapshots")
        .insert({
          tenant_id: scope.tenantId,
          assessment_id: assessmentId,
          version,
          payload: payload as unknown as Json,
          question_count: questions.length,
          total_points: totalPoints,
          created_by: scope.userId,
        })
        .select(SNAPSHOT_COLUMNS)
        .single(),
      "snapshot.publish",
    ) as SnapshotRow;

    const { error } = await supabase
      .from("assessments")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
        published_version: version,
      })
      .eq("tenant_id", scope.tenantId)
      .eq("id", assessmentId);
    if (error) throw toAssessmentError(error, "snapshot.publish.mark");

    return toSnapshot(row);
  },
};
