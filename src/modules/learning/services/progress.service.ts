/**
 * ProgressService — lesson and unit completion, percentage, and last position.
 * Percent is validated to stay within 0..100 both in Zod and in the database.
 */

import { supabase } from "@/integrations/supabase/client";
import { assertTenant, assertUser, unwrap } from "@/modules/learning/services/learning-client";
import type { LearningProgress, LearningTarget, ProgressStatus } from "@/modules/learning/types";
import { progressInputSchema } from "@/modules/learning/validation/schemas";

const COLUMNS =
  "id, tenant_id, user_id, target_type, lesson_id, unit_id, status, percent, last_position, last_viewed_at";

interface Row {
  id: string;
  tenant_id: string;
  user_id: string;
  target_type: LearningTarget;
  lesson_id: string;
  unit_id: string | null;
  status: ProgressStatus;
  percent: number;
  last_position: number;
  last_viewed_at: string;
}

const toProgress = (row: Row): LearningProgress => ({
  id: row.id,
  tenantId: row.tenant_id,
  userId: row.user_id,
  targetType: row.target_type,
  lessonId: row.lesson_id,
  unitId: row.unit_id,
  status: row.status,
  percent: row.percent,
  lastPosition: row.last_position,
  lastViewedAt: row.last_viewed_at,
});

export interface ProgressScope {
  readonly tenantId: string;
  readonly userId: string;
}

/** All progress rows of the signed-in user for one lesson (lesson row + unit rows). */
export async function listLessonProgress(
  scope: ProgressScope,
  lessonId: string,
): Promise<readonly LearningProgress[]> {
  assertTenant(scope.tenantId, "learning.progress.list");
  assertUser(scope.userId, "learning.progress.list");
  const result = await supabase
    .from("learning_progress")
    .select(COLUMNS)
    .eq("tenant_id", scope.tenantId)
    .eq("user_id", scope.userId)
    .eq("lesson_id", lessonId);
  return unwrap(result, "learning.progress.list").map((row) => toProgress(row as unknown as Row));
}

/** Every lesson-level progress row of the signed-in user. */
export async function listMyLessonProgress(
  scope: ProgressScope,
): Promise<readonly LearningProgress[]> {
  assertTenant(scope.tenantId, "learning.progress.mine");
  assertUser(scope.userId, "learning.progress.mine");
  const result = await supabase
    .from("learning_progress")
    .select(COLUMNS)
    .eq("tenant_id", scope.tenantId)
    .eq("user_id", scope.userId)
    .eq("target_type", "lesson")
    .order("last_viewed_at", { ascending: false });
  return unwrap(result, "learning.progress.mine").map((row) => toProgress(row as unknown as Row));
}

interface SaveProgressArgs {
  readonly targetType: LearningTarget;
  readonly lessonId: string;
  readonly unitId?: string | null;
  readonly percent: number;
  readonly lastPosition?: number;
  readonly status?: ProgressStatus;
}

/**
 * Insert-or-update a single progress row.
 * Partial unique indexes make PostgREST upsert unusable, so the lookup is explicit.
 */
export async function saveProgress(
  scope: ProgressScope,
  args: SaveProgressArgs,
): Promise<LearningProgress> {
  assertTenant(scope.tenantId, "learning.progress.save");
  assertUser(scope.userId, "learning.progress.save");
  const values = progressInputSchema.parse({
    lessonId: args.lessonId,
    unitId: args.unitId ?? null,
    percent: args.percent,
    lastPosition: args.lastPosition ?? 0,
    status: args.status ?? (args.percent >= 100 ? "completed" : "in_progress"),
  });

  let lookup = supabase
    .from("learning_progress")
    .select("id")
    .eq("tenant_id", scope.tenantId)
    .eq("user_id", scope.userId)
    .eq("target_type", args.targetType)
    .eq("lesson_id", values.lessonId);
  lookup =
    args.targetType === "unit" && values.unitId
      ? lookup.eq("unit_id", values.unitId)
      : lookup.is("unit_id", null);

  const existing = await lookup.maybeSingle();
  if (existing.error) unwrap(existing, "learning.progress.save");

  const payload = {
    status: values.status,
    percent: values.percent,
    last_position: values.lastPosition,
    last_viewed_at: new Date().toISOString(),
  };

  if (existing.data) {
    const updated = await supabase
      .from("learning_progress")
      .update(payload)
      .eq("id", existing.data.id)
      .select(COLUMNS)
      .single();
    return toProgress(unwrap(updated, "learning.progress.save") as unknown as Row);
  }

  const inserted = await supabase
    .from("learning_progress")
    .insert({
      tenant_id: scope.tenantId,
      user_id: scope.userId,
      target_type: args.targetType,
      lesson_id: values.lessonId,
      unit_id: args.targetType === "unit" ? values.unitId : null,
      ...payload,
    })
    .select(COLUMNS)
    .single();
  return toProgress(unwrap(inserted, "learning.progress.save") as unknown as Row);
}

/** Percentage helper — always clamped to 0..100. */
export function computePercent(completed: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((completed / total) * 100)));
}

/** Marks a unit complete (or reopens it) and recomputes the parent lesson percentage. */
export async function setUnitCompletion(
  scope: ProgressScope,
  args: { lessonId: string; unitId: string; totalUnits: number; completed: boolean },
): Promise<void> {
  await saveProgress(scope, {
    targetType: "unit",
    lessonId: args.lessonId,
    unitId: args.unitId,
    percent: args.completed ? 100 : 0,
    status: args.completed ? "completed" : "in_progress",
  });

  const rows = await listLessonProgress(scope, args.lessonId);
  const completedUnits = rows.filter(
    (row) => row.targetType === "unit" && row.status === "completed",
  ).length;
  const percent = computePercent(completedUnits, args.totalUnits);

  await saveProgress(scope, {
    targetType: "lesson",
    lessonId: args.lessonId,
    percent,
    status: percent >= 100 ? "completed" : "in_progress",
  });
}

/** Marks the whole lesson complete regardless of unit state. */
export async function completeLesson(scope: ProgressScope, lessonId: string): Promise<void> {
  await saveProgress(scope, {
    targetType: "lesson",
    lessonId,
    percent: 100,
    status: "completed",
  });
}

/** Records the reader position (unit index) without changing completion. */
export async function saveLastPosition(
  scope: ProgressScope,
  args: { lessonId: string; position: number; percent: number },
): Promise<void> {
  await saveProgress(scope, {
    targetType: "lesson",
    lessonId: args.lessonId,
    percent: args.percent,
    lastPosition: args.position,
    status: args.percent >= 100 ? "completed" : "in_progress",
  });
}
