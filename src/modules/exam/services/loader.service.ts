/**
 * Engine 1 — Assessment Loader.
 *
 * Loads and validates an immutable Assessment Snapshot and prepares the exam
 * runtime package. The loader never reads the Question Studio or the Question
 * Bank, and never mutates a snapshot.
 */

import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import type { SnapshotQuestion } from "@/modules/assessment";
import { randomizeQuestionSet } from "@/modules/assessment";
import type { ExamListItem, ExamPackage } from "@/modules/exam/types";
import { assertTenant, unwrap, unwrapList } from "@/modules/exam/services/exam-client";
import { AppError } from "@/shared/platform";

const choiceSchema = z.object({
  id: z.string().min(1),
  label: z.string().nullable().default(null),
  content: z.string(),
  isCorrect: z.boolean(),
  position: z.number(),
});

const questionSchema = z.object({
  questionId: z.string().min(1),
  questionVersionId: z.string().min(1),
  publicId: z.string(),
  version: z.number(),
  position: z.number(),
  points: z.number().min(0),
  type: z.enum(["multiple_choice", "multiple_response", "true_false", "short_answer"]),
  skill: z.enum(["reading", "listening"]),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  prompt: z.string().min(1),
  passage: z.string().nullable().default(null),
  audioUrl: z.string().nullable().default(null),
  explanation: z.string().nullable().default(null),
  answerKey: z.string().nullable().default(null),
  choices: z.array(choiceSchema),
});

const payloadSchema = z.object({
  assessment: z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    slug: z.string(),
    type: z.enum(["exam", "quiz", "practice", "tryout"]),
    difficulty: z.enum(["beginner", "intermediate", "advanced"]),
    durationMinutes: z.number().min(0),
    passingScore: z.number().min(0),
    randomizeQuestions: z.boolean(),
    randomizeChoices: z.boolean(),
  }),
  questions: z.array(questionSchema).min(1),
});

const SNAPSHOT_COLUMNS =
  "id, tenant_id, assessment_id, version, payload, question_count, total_points, created_at";

interface SnapshotRow {
  id: string;
  assessment_id: string;
  version: number;
  payload: unknown;
  total_points: number;
}

function toPackage(row: SnapshotRow): ExamPackage {
  const parsed = payloadSchema.safeParse(row.payload);
  if (!parsed.success) {
    throw new AppError("Snapshot ujian rusak atau tidak lengkap, hubungi pengelola asesmen.", {
      kind: "validation",
      context: { scope: "exam.loader", snapshotId: row.id, issue: parsed.error.issues[0]?.message },
    });
  }

  const data = parsed.data;
  const questions = data.questions
    .map((question): SnapshotQuestion => question)
    .slice()
    .sort((a, b) => a.position - b.position);

  return {
    snapshotId: row.id,
    assessmentId: row.assessment_id,
    snapshotVersion: row.version,
    title: data.assessment.title,
    type: data.assessment.type,
    difficulty: data.assessment.difficulty,
    durationMinutes: data.assessment.durationMinutes,
    passingScore: data.assessment.passingScore,
    randomizeQuestions: data.assessment.randomizeQuestions,
    randomizeChoices: data.assessment.randomizeChoices,
    questions,
    totalPoints: questions.reduce((sum, question) => sum + question.points, 0),
  };
}

export const AssessmentLoader = {
  /** Latest published snapshot of an assessment. */
  async loadLatest(tenantId: string, assessmentId: string): Promise<ExamPackage> {
    assertTenant(tenantId, "exam.loader.latest");
    const rows = unwrapList(
      await supabase
        .from("assessment_snapshots")
        .select(SNAPSHOT_COLUMNS)
        .eq("tenant_id", tenantId)
        .eq("assessment_id", assessmentId)
        .order("version", { ascending: false })
        .limit(1),
      "exam.loader.latest",
    ) as SnapshotRow[];

    const row = rows[0];
    if (!row) {
      throw new AppError("Asesmen belum diterbitkan, snapshot ujian tidak tersedia.", {
        kind: "notFound",
        context: { scope: "exam.loader.latest", assessmentId },
      });
    }
    return toPackage(row);
  },

  /** Exact snapshot an attempt was started with. */
  async loadById(tenantId: string, snapshotId: string): Promise<ExamPackage> {
    assertTenant(tenantId, "exam.loader.byId");
    const row = unwrap(
      await supabase
        .from("assessment_snapshots")
        .select(SNAPSHOT_COLUMNS)
        .eq("tenant_id", tenantId)
        .eq("id", snapshotId)
        .maybeSingle(),
      "exam.loader.byId",
    ) as SnapshotRow;
    return toPackage(row);
  },

  /** Applies the assessment randomization settings to a freshly started attempt. */
  buildQuestionOrder(examPackage: ExamPackage): readonly string[] {
    const ordered = randomizeQuestionSet(examPackage.questions, {
      randomizeQuestions: examPackage.randomizeQuestions,
      randomizeChoices: false,
    });
    return ordered.map((question) => question.questionVersionId);
  },

  /** Re-orders a package to the order frozen on the attempt (resume safe). */
  applyOrder(examPackage: ExamPackage, order: readonly string[]): ExamPackage {
    if (order.length === 0) return examPackage;
    const byVersion = new Map(examPackage.questions.map((q) => [q.questionVersionId, q]));
    const ordered: SnapshotQuestion[] = [];
    order.forEach((versionId, index) => {
      const question = byVersion.get(versionId);
      if (question) ordered.push({ ...question, position: index });
    });
    // Any question missing from the stored order is appended so nothing is lost.
    examPackage.questions.forEach((question) => {
      if (!order.includes(question.questionVersionId)) {
        ordered.push({ ...question, position: ordered.length });
      }
    });
    return { ...examPackage, questions: ordered };
  },

  /** Published assessments that can be taken by the current tenant. */
  async listExams(tenantId: string): Promise<readonly ExamListItem[]> {
    assertTenant(tenantId, "exam.loader.list");
    const rows = unwrapList(
      await supabase
        .from("assessments")
        .select(
          "id, title, slug, description, type, difficulty, duration_minutes, passing_score, published_version, status",
        )
        .eq("tenant_id", tenantId)
        .eq("status", "published")
        .order("title", { ascending: true }),
      "exam.loader.list",
    ) as Array<{
      id: string;
      title: string;
      slug: string;
      description: string | null;
      type: ExamListItem["type"];
      difficulty: ExamListItem["difficulty"];
      duration_minutes: number;
      passing_score: number;
      published_version: number;
    }>;

    if (rows.length === 0) return [];

    const counts = unwrapList(
      await supabase
        .from("assessment_snapshots")
        .select("assessment_id, version, question_count")
        .eq("tenant_id", tenantId)
        .in(
          "assessment_id",
          rows.map((row) => row.id),
        ),
      "exam.loader.list.counts",
    ) as Array<{ assessment_id: string; version: number; question_count: number }>;

    const latest = new Map<string, { version: number; questionCount: number }>();
    counts.forEach((row) => {
      const current = latest.get(row.assessment_id);
      if (!current || row.version > current.version) {
        latest.set(row.assessment_id, { version: row.version, questionCount: row.question_count });
      }
    });

    return rows
      .filter((row) => latest.has(row.id))
      .map((row): ExamListItem => {
        const snapshot = latest.get(row.id);
        return {
          assessmentId: row.id,
          title: row.title,
          slug: row.slug,
          description: row.description,
          type: row.type,
          difficulty: row.difficulty,
          durationMinutes: row.duration_minutes,
          passingScore: row.passing_score,
          questionCount: snapshot?.questionCount ?? 0,
          snapshotVersion: snapshot?.version ?? row.published_version,
        };
      });
  },
};
