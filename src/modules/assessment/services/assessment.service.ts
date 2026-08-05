/**
 * Assessment service — assessments and their question references.
 * Assessments only ever store references to Question Bank versions.
 */

import { supabase } from "@/integrations/supabase/client";
import {
  assertTenant,
  assertUser,
  toAssessmentError,
  unwrap,
  unwrapList,
  type AssessmentScope,
} from "@/modules/assessment/services/assessment-client";
import type {
  Assessment,
  AssessmentQuestion,
  AssessmentType,
  ContentStatus,
} from "@/modules/assessment/types";
import {
  assessmentInputSchema,
  assessmentQuestionInputSchema,
  type AssessmentInput,
  type AssessmentQuestionInput,
} from "@/modules/assessment/validation/schemas";

const ASSESSMENT_COLUMNS =
  "id, tenant_id, title, slug, description, type, status, difficulty, duration_minutes, passing_score, randomize_questions, randomize_choices, published_at, published_version, created_by, created_at, updated_at";

interface AssessmentRow {
  id: string;
  tenant_id: string;
  title: string;
  slug: string;
  description: string | null;
  type: AssessmentType;
  status: ContentStatus;
  difficulty: Assessment["difficulty"];
  duration_minutes: number;
  passing_score: number;
  randomize_questions: boolean;
  randomize_choices: boolean;
  published_at: string | null;
  published_version: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface AssessmentQuestionRow {
  id: string;
  tenant_id: string;
  assessment_id: string;
  question_id: string;
  question_version_id: string;
  position: number;
  points: number;
  questions: { public_id: string } | null;
  question_versions: {
    version: number;
    type: AssessmentQuestion["type"];
    skill: AssessmentQuestion["skill"];
    difficulty: AssessmentQuestion["difficulty"];
    prompt: string;
  } | null;
}

function toAssessment(row: AssessmentRow): Assessment {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    type: row.type,
    status: row.status,
    difficulty: row.difficulty,
    durationMinutes: row.duration_minutes,
    passingScore: row.passing_score,
    randomizeQuestions: row.randomize_questions,
    randomizeChoices: row.randomize_choices,
    publishedAt: row.published_at,
    publishedVersion: row.published_version,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toAssessmentQuestion(row: AssessmentQuestionRow): AssessmentQuestion {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    assessmentId: row.assessment_id,
    questionId: row.question_id,
    questionVersionId: row.question_version_id,
    position: row.position,
    points: row.points,
    publicId: row.questions?.public_id ?? "—",
    version: row.question_versions?.version ?? 1,
    type: row.question_versions?.type ?? "multiple_choice",
    skill: row.question_versions?.skill ?? "reading",
    difficulty: row.question_versions?.difficulty ?? "beginner",
    prompt: row.question_versions?.prompt ?? "",
  };
}

export const AssessmentService = {
  async list(
    tenantId: string,
    filters: { type?: AssessmentType | ""; status?: ContentStatus | "" } = {},
  ): Promise<readonly Assessment[]> {
    assertTenant(tenantId, "assessment.list");
    let query = supabase
      .from("assessments")
      .select(ASSESSMENT_COLUMNS)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (filters.type) query = query.eq("type", filters.type);
    if (filters.status) query = query.eq("status", filters.status);

    const rows = unwrapList(await query, "assessment.list") as AssessmentRow[];
    return rows.map(toAssessment);
  },

  async get(tenantId: string, assessmentId: string): Promise<Assessment> {
    assertTenant(tenantId, "assessment.get");
    const row = unwrap(
      await supabase
        .from("assessments")
        .select(ASSESSMENT_COLUMNS)
        .eq("tenant_id", tenantId)
        .eq("id", assessmentId)
        .maybeSingle(),
      "assessment.get",
    ) as AssessmentRow;
    return toAssessment(row);
  },

  async create(scope: AssessmentScope, input: AssessmentInput): Promise<Assessment> {
    assertTenant(scope.tenantId, "assessment.create");
    assertUser(scope.userId, "assessment.create");
    const parsed = assessmentInputSchema.parse(input);

    const row = unwrap(
      await supabase
        .from("assessments")
        .insert({
          tenant_id: scope.tenantId,
          title: parsed.title,
          slug: parsed.slug,
          description: parsed.description,
          type: parsed.type,
          status: parsed.status,
          difficulty: parsed.difficulty,
          duration_minutes: parsed.durationMinutes,
          passing_score: parsed.passingScore,
          randomize_questions: parsed.randomizeQuestions,
          randomize_choices: parsed.randomizeChoices,
          created_by: scope.userId,
        })
        .select(ASSESSMENT_COLUMNS)
        .single(),
      "assessment.create",
    ) as AssessmentRow;
    return toAssessment(row);
  },

  async update(
    tenantId: string,
    assessmentId: string,
    input: AssessmentInput,
  ): Promise<Assessment> {
    assertTenant(tenantId, "assessment.update");
    const parsed = assessmentInputSchema.parse(input);

    const row = unwrap(
      await supabase
        .from("assessments")
        .update({
          title: parsed.title,
          slug: parsed.slug,
          description: parsed.description,
          type: parsed.type,
          status: parsed.status,
          difficulty: parsed.difficulty,
          duration_minutes: parsed.durationMinutes,
          passing_score: parsed.passingScore,
          randomize_questions: parsed.randomizeQuestions,
          randomize_choices: parsed.randomizeChoices,
        })
        .eq("tenant_id", tenantId)
        .eq("id", assessmentId)
        .select(ASSESSMENT_COLUMNS)
        .single(),
      "assessment.update",
    ) as AssessmentRow;
    return toAssessment(row);
  },

  async remove(tenantId: string, assessmentId: string): Promise<void> {
    assertTenant(tenantId, "assessment.remove");
    const { error } = await supabase
      .from("assessments")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("id", assessmentId);
    if (error) throw toAssessmentError(error, "assessment.remove");
  },

  /* ---------------- question references ---------------- */

  async questions(tenantId: string, assessmentId: string): Promise<readonly AssessmentQuestion[]> {
    assertTenant(tenantId, "assessment.questions");
    const rows = unwrapList(
      await supabase
        .from("assessment_questions")
        .select(
          "id, tenant_id, assessment_id, question_id, question_version_id, position, points, questions(public_id), question_versions(version, type, skill, difficulty, prompt)",
        )
        .eq("tenant_id", tenantId)
        .eq("assessment_id", assessmentId)
        .order("position", { ascending: true }),
      "assessment.questions",
    ) as unknown as AssessmentQuestionRow[];
    return rows.map(toAssessmentQuestion);
  },

  /** Adds a question reference pinned to the version supplied by the picker. */
  async addQuestion(
    tenantId: string,
    assessmentId: string,
    input: AssessmentQuestionInput,
  ): Promise<void> {
    assertTenant(tenantId, "assessment.addQuestion");
    const parsed = assessmentQuestionInputSchema.parse(input);
    const { error } = await supabase.from("assessment_questions").insert({
      tenant_id: tenantId,
      assessment_id: assessmentId,
      question_id: parsed.questionId,
      question_version_id: parsed.questionVersionId,
      position: parsed.position,
      points: parsed.points,
    });
    if (error) throw toAssessmentError(error, "assessment.addQuestion");
  },

  async updateQuestion(
    tenantId: string,
    id: string,
    patch: { position?: number; points?: number; questionVersionId?: string },
  ): Promise<void> {
    assertTenant(tenantId, "assessment.updateQuestion");
    const { error } = await supabase
      .from("assessment_questions")
      .update({
        ...(patch.position === undefined ? {} : { position: patch.position }),
        ...(patch.points === undefined ? {} : { points: patch.points }),
        ...(patch.questionVersionId === undefined
          ? {}
          : { question_version_id: patch.questionVersionId }),
      })
      .eq("tenant_id", tenantId)
      .eq("id", id);
    if (error) throw toAssessmentError(error, "assessment.updateQuestion");
  },

  async removeQuestion(tenantId: string, id: string): Promise<void> {
    assertTenant(tenantId, "assessment.removeQuestion");
    const { error } = await supabase
      .from("assessment_questions")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("id", id);
    if (error) throw toAssessmentError(error, "assessment.removeQuestion");
  },
};
