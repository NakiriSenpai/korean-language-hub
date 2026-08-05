/**
 * ContinueLearningService — one active record per user per lesson,
 * plus the "recently opened" feed used by the Continue Learning page.
 */

import { supabase } from "@/integrations/supabase/client";
import { assertTenant, assertUser, unwrap } from "@/modules/learning/services/learning-client";
import type { ContinueLearningEntry } from "@/modules/learning/types";
import {
  continueLearningInputSchema,
  type ContinueLearningInput,
} from "@/modules/learning/validation/schemas";

const COLUMNS =
  "id, tenant_id, user_id, course_id, module_id, lesson_id, unit_id, last_position, opened_at, courses(title), lessons(title)";

interface Row {
  id: string;
  tenant_id: string;
  user_id: string;
  course_id: string;
  module_id: string;
  lesson_id: string;
  unit_id: string | null;
  last_position: number;
  opened_at: string;
  courses?: { title: string } | null;
  lessons?: { title: string } | null;
}

const toEntry = (row: Row): ContinueLearningEntry => ({
  id: row.id,
  tenantId: row.tenant_id,
  userId: row.user_id,
  courseId: row.course_id,
  moduleId: row.module_id,
  lessonId: row.lesson_id,
  unitId: row.unit_id,
  lastPosition: row.last_position,
  openedAt: row.opened_at,
  courseTitle: row.courses?.title ?? "Course",
  lessonTitle: row.lessons?.title ?? "Lesson",
});

export interface ContinueScope {
  readonly tenantId: string;
  readonly userId: string;
}

/** Recently opened lessons, newest first. */
export async function listRecentlyOpened(
  scope: ContinueScope,
  limit = 10,
): Promise<readonly ContinueLearningEntry[]> {
  assertTenant(scope.tenantId, "learning.continue.list");
  assertUser(scope.userId, "learning.continue.list");
  const result = await supabase
    .from("continue_learning")
    .select(COLUMNS)
    .eq("tenant_id", scope.tenantId)
    .eq("user_id", scope.userId)
    .order("opened_at", { ascending: false })
    .limit(limit);
  return unwrap(result, "learning.continue.list").map((row) => toEntry(row as unknown as Row));
}

/** The single lesson the Continue button should resume. */
export async function getContinueTarget(
  scope: ContinueScope,
): Promise<ContinueLearningEntry | null> {
  const entries = await listRecentlyOpened(scope, 1);
  return entries[0] ?? null;
}

/** Upserts the active record for a lesson (unique per tenant + user + lesson). */
export async function recordContinueLearning(
  scope: ContinueScope,
  input: ContinueLearningInput,
): Promise<ContinueLearningEntry> {
  assertTenant(scope.tenantId, "learning.continue.record");
  assertUser(scope.userId, "learning.continue.record");
  const values = continueLearningInputSchema.parse(input);

  const result = await supabase
    .from("continue_learning")
    .upsert(
      {
        tenant_id: scope.tenantId,
        user_id: scope.userId,
        course_id: values.courseId,
        module_id: values.moduleId,
        lesson_id: values.lessonId,
        unit_id: values.unitId,
        last_position: values.lastPosition,
        opened_at: new Date().toISOString(),
      },
      { onConflict: "tenant_id,user_id,lesson_id" },
    )
    .select(COLUMNS)
    .single();
  return toEntry(unwrap(result, "learning.continue.record") as unknown as Row);
}

export async function clearContinueLearning(scope: ContinueScope, entryId: string): Promise<void> {
  assertTenant(scope.tenantId, "learning.continue.clear");
  assertUser(scope.userId, "learning.continue.clear");
  const { error } = await supabase
    .from("continue_learning")
    .delete()
    .eq("id", entryId)
    .eq("user_id", scope.userId);
  if (error) unwrap({ data: null, error }, "learning.continue.clear");
}
