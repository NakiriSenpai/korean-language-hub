/**
 * Question Studio + Question Bank service.
 *
 * Versioning rule (Work Package 3): updating a question never overwrites content.
 * Each edit inserts a new `question_versions` row with its own choices, and the
 * question row only moves its `current_version` pointer. Assessments keep
 * referencing the exact version they were built with.
 */

import { supabase } from "@/integrations/supabase/client";
import {
  assertTenant,
  assertUser,
  generatePublicId,
  toAssessmentError,
  unwrap,
  unwrapList,
  type AssessmentScope,
} from "@/modules/assessment/services/assessment-client";
import { getQuestionType } from "@/modules/assessment/config/registry";
import type {
  ContentStatus,
  Question,
  QuestionChoice,
  QuestionFilters,
  QuestionVersion,
} from "@/modules/assessment/types";
import { questionInputSchema, type QuestionInput } from "@/modules/assessment/validation/schemas";

const QUESTION_COLUMNS =
  "id, tenant_id, public_id, type, skill, difficulty, category, tags, source, language, status, author_id, current_version, created_at, updated_at";

const VERSION_COLUMNS =
  "id, tenant_id, question_id, version, type, skill, difficulty, prompt, passage, audio_url, explanation, answer_key, category, tags, source, language, created_by, created_at";

const CHOICE_COLUMNS =
  "id, tenant_id, question_version_id, label, content, is_correct, position";

interface QuestionRow {
  id: string;
  tenant_id: string;
  public_id: string;
  type: Question["type"];
  skill: Question["skill"];
  difficulty: Question["difficulty"];
  category: string | null;
  tags: string[] | null;
  source: string | null;
  language: string;
  status: ContentStatus;
  author_id: string | null;
  current_version: number;
  created_at: string;
  updated_at: string;
}

interface VersionRow {
  id: string;
  tenant_id: string;
  question_id: string;
  version: number;
  type: Question["type"];
  skill: Question["skill"];
  difficulty: Question["difficulty"];
  prompt: string;
  passage: string | null;
  audio_url: string | null;
  explanation: string | null;
  answer_key: string | null;
  category: string | null;
  tags: string[] | null;
  source: string | null;
  language: string;
  created_by: string | null;
  created_at: string;
}

interface ChoiceRow {
  id: string;
  tenant_id: string;
  question_version_id: string;
  label: string | null;
  content: string;
  is_correct: boolean;
  position: number;
}

function toQuestion(row: QuestionRow, latestVersion?: QuestionVersion): Question {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    publicId: row.public_id,
    type: row.type,
    skill: row.skill,
    difficulty: row.difficulty,
    category: row.category,
    tags: row.tags ?? [],
    source: row.source,
    language: row.language,
    status: row.status,
    authorId: row.author_id,
    currentVersion: row.current_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(latestVersion ? { latestVersion } : {}),
  };
}

function toChoice(row: ChoiceRow): QuestionChoice {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    questionVersionId: row.question_version_id,
    label: row.label,
    content: row.content,
    isCorrect: row.is_correct,
    position: row.position,
  };
}

function toVersion(row: VersionRow, choices: readonly QuestionChoice[]): QuestionVersion {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    questionId: row.question_id,
    version: row.version,
    type: row.type,
    skill: row.skill,
    difficulty: row.difficulty,
    prompt: row.prompt,
    passage: row.passage,
    audioUrl: row.audio_url,
    explanation: row.explanation,
    answerKey: row.answer_key,
    category: row.category,
    tags: row.tags ?? [],
    source: row.source,
    language: row.language,
    createdBy: row.created_by,
    createdAt: row.created_at,
    choices,
  };
}

async function loadChoices(versionIds: readonly string[]): Promise<Map<string, QuestionChoice[]>> {
  const grouped = new Map<string, QuestionChoice[]>();
  if (versionIds.length === 0) return grouped;

  const result = await supabase
    .from("question_choices")
    .select(CHOICE_COLUMNS)
    .in("question_version_id", versionIds as string[])
    .order("position", { ascending: true });

  for (const row of unwrapList(result, "question.choices")) {
    const choice = toChoice(row as ChoiceRow);
    const bucket = grouped.get(choice.questionVersionId) ?? [];
    bucket.push(choice);
    grouped.set(choice.questionVersionId, bucket);
  }
  return grouped;
}

/** Writes one version row plus its choices; used by both create and update. */
async function insertVersion(
  scope: AssessmentScope,
  questionId: string,
  version: number,
  input: ReturnType<typeof questionInputSchema.parse>,
): Promise<VersionRow> {
  const versionRow = unwrap(
    await supabase
      .from("question_versions")
      .insert({
        tenant_id: scope.tenantId,
        question_id: questionId,
        version,
        type: input.type,
        skill: input.skill,
        difficulty: input.difficulty,
        prompt: input.prompt,
        passage: input.passage,
        audio_url: input.audioUrl,
        explanation: input.explanation,
        answer_key: input.answerKey,
        category: input.category,
        tags: input.tags,
        source: input.source,
        language: input.language,
        created_by: scope.userId,
      })
      .select(VERSION_COLUMNS)
      .single(),
    "question.version.create",
  ) as VersionRow;

  if (getQuestionType(input.type).hasChoices && input.choices.length > 0) {
    const { error } = await supabase.from("question_choices").insert(
      input.choices.map((choice, index) => ({
        tenant_id: scope.tenantId,
        question_version_id: versionRow.id,
        label: choice.label,
        content: choice.content,
        is_correct: choice.isCorrect,
        position: choice.position || index,
      })),
    );
    if (error) throw toAssessmentError(error, "question.choices.create");
  }

  return versionRow;
}

export const QuestionService = {
  /** Question Bank listing with the Work Package 6 filter set. */
  async list(tenantId: string, filters: QuestionFilters = {}): Promise<readonly Question[]> {
    assertTenant(tenantId, "question.list");

    let query = supabase
      .from("questions")
      .select(QUESTION_COLUMNS)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (filters.difficulty) query = query.eq("difficulty", filters.difficulty);
    if (filters.type) query = query.eq("type", filters.type);
    if (filters.skill) query = query.eq("skill", filters.skill);
    if (filters.status) query = query.eq("status", filters.status);
    if (filters.language) query = query.eq("language", filters.language);
    if (filters.category) query = query.eq("category", filters.category);
    if (filters.tag) query = query.contains("tags", [filters.tag.trim().toLowerCase()]);

    const rows = unwrapList(await query, "question.list") as QuestionRow[];
    const keyword = filters.keyword?.trim().toLowerCase();
    const filtered = keyword
      ? rows.filter(
          (row) =>
            row.public_id.toLowerCase().includes(keyword) ||
            (row.category ?? "").toLowerCase().includes(keyword) ||
            (row.source ?? "").toLowerCase().includes(keyword),
        )
      : rows;

    return filtered.map((row) => toQuestion(row));
  },

  /** Distinct categories, used to populate filter dropdowns. */
  async categories(tenantId: string): Promise<readonly string[]> {
    assertTenant(tenantId, "question.categories");
    const rows = unwrapList(
      await supabase.from("questions").select("category").eq("tenant_id", tenantId),
      "question.categories",
    ) as { category: string | null }[];
    return [...new Set(rows.map((row) => row.category).filter((v): v is string => Boolean(v)))].sort();
  },

  /** Question with its current version and choices. */
  async get(tenantId: string, questionId: string): Promise<Question> {
    assertTenant(tenantId, "question.get");
    const row = unwrap(
      await supabase
        .from("questions")
        .select(QUESTION_COLUMNS)
        .eq("tenant_id", tenantId)
        .eq("id", questionId)
        .maybeSingle(),
      "question.get",
    ) as QuestionRow;

    const versions = await QuestionService.versions(tenantId, questionId);
    return toQuestion(row, versions[0]);
  },

  /** Full version history, newest first. */
  async versions(tenantId: string, questionId: string): Promise<readonly QuestionVersion[]> {
    assertTenant(tenantId, "question.versions");
    const rows = unwrapList(
      await supabase
        .from("question_versions")
        .select(VERSION_COLUMNS)
        .eq("tenant_id", tenantId)
        .eq("question_id", questionId)
        .order("version", { ascending: false }),
      "question.versions",
    ) as VersionRow[];

    const choices = await loadChoices(rows.map((row) => row.id));
    return rows.map((row) => toVersion(row, choices.get(row.id) ?? []));
  },

  /** Loads several versions at once — used by the assessment detail view. */
  async versionsByIds(
    tenantId: string,
    versionIds: readonly string[],
  ): Promise<readonly QuestionVersion[]> {
    assertTenant(tenantId, "question.versionsByIds");
    if (versionIds.length === 0) return [];
    const rows = unwrapList(
      await supabase
        .from("question_versions")
        .select(VERSION_COLUMNS)
        .eq("tenant_id", tenantId)
        .in("id", versionIds as string[]),
      "question.versionsByIds",
    ) as VersionRow[];

    const choices = await loadChoices(rows.map((row) => row.id));
    return rows.map((row) => toVersion(row, choices.get(row.id) ?? []));
  },

  /** Creates a question and its first version. */
  async create(scope: AssessmentScope, input: QuestionInput): Promise<Question> {
    assertTenant(scope.tenantId, "question.create");
    assertUser(scope.userId, "question.create");
    const parsed = questionInputSchema.parse(input);

    const questionRow = unwrap(
      await supabase
        .from("questions")
        .insert({
          tenant_id: scope.tenantId,
          public_id: parsed.publicId ?? generatePublicId(),
          type: parsed.type,
          skill: parsed.skill,
          difficulty: parsed.difficulty,
          category: parsed.category,
          tags: parsed.tags,
          source: parsed.source,
          language: parsed.language,
          status: parsed.status,
          author_id: scope.userId,
          current_version: 1,
        })
        .select(QUESTION_COLUMNS)
        .single(),
      "question.create",
    ) as QuestionRow;

    const versionRow = await insertVersion(scope, questionRow.id, 1, parsed);
    const choices = await loadChoices([versionRow.id]);
    return toQuestion(questionRow, toVersion(versionRow, choices.get(versionRow.id) ?? []));
  },

  /** Editing produces a NEW version; existing versions stay untouched. */
  async update(
    scope: AssessmentScope,
    questionId: string,
    input: QuestionInput,
  ): Promise<Question> {
    assertTenant(scope.tenantId, "question.update");
    assertUser(scope.userId, "question.update");
    const parsed = questionInputSchema.parse(input);

    const current = unwrap(
      await supabase
        .from("questions")
        .select(QUESTION_COLUMNS)
        .eq("tenant_id", scope.tenantId)
        .eq("id", questionId)
        .maybeSingle(),
      "question.update.read",
    ) as QuestionRow;

    const nextVersion = current.current_version + 1;
    const versionRow = await insertVersion(scope, questionId, nextVersion, parsed);

    const questionRow = unwrap(
      await supabase
        .from("questions")
        .update({
          public_id: parsed.publicId ?? current.public_id,
          type: parsed.type,
          skill: parsed.skill,
          difficulty: parsed.difficulty,
          category: parsed.category,
          tags: parsed.tags,
          source: parsed.source,
          language: parsed.language,
          status: parsed.status,
          current_version: nextVersion,
        })
        .eq("tenant_id", scope.tenantId)
        .eq("id", questionId)
        .select(QUESTION_COLUMNS)
        .single(),
      "question.update",
    ) as QuestionRow;

    const choices = await loadChoices([versionRow.id]);
    return toQuestion(questionRow, toVersion(versionRow, choices.get(versionRow.id) ?? []));
  },

  async setStatus(tenantId: string, questionId: string, status: ContentStatus): Promise<void> {
    assertTenant(tenantId, "question.setStatus");
    const { error } = await supabase
      .from("questions")
      .update({ status })
      .eq("tenant_id", tenantId)
      .eq("id", questionId);
    if (error) throw toAssessmentError(error, "question.setStatus");
  },

  async remove(tenantId: string, questionId: string): Promise<void> {
    assertTenant(tenantId, "question.remove");
    const { error } = await supabase
      .from("questions")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("id", questionId);
    if (error) throw toAssessmentError(error, "question.remove");
  },
};
