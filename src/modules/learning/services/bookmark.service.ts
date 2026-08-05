/**
 * BookmarkService — personal lesson and unit bookmarks (never duplicated).
 */

import { supabase } from "@/integrations/supabase/client";
import { assertTenant, assertUser, unwrap } from "@/modules/learning/services/learning-client";
import type { Bookmark, LearningTarget } from "@/modules/learning/types";
import { bookmarkInputSchema, type BookmarkInput } from "@/modules/learning/validation/schemas";

const COLUMNS =
  "id, tenant_id, user_id, target_type, lesson_id, unit_id, note, created_at, lessons(title), lesson_units(title)";

interface Row {
  id: string;
  tenant_id: string;
  user_id: string;
  target_type: LearningTarget;
  lesson_id: string;
  unit_id: string | null;
  note: string | null;
  created_at: string;
  lessons?: { title: string } | null;
  lesson_units?: { title: string } | null;
}

const toBookmark = (row: Row): Bookmark => ({
  id: row.id,
  tenantId: row.tenant_id,
  userId: row.user_id,
  targetType: row.target_type,
  lessonId: row.lesson_id,
  unitId: row.unit_id,
  note: row.note,
  lessonTitle: row.lessons?.title ?? "Lesson",
  unitTitle: row.lesson_units?.title ?? null,
  createdAt: row.created_at,
});

export interface BookmarkScope {
  readonly tenantId: string;
  readonly userId: string;
}

export async function listBookmarks(scope: BookmarkScope): Promise<readonly Bookmark[]> {
  assertTenant(scope.tenantId, "learning.bookmark.list");
  assertUser(scope.userId, "learning.bookmark.list");
  const result = await supabase
    .from("bookmarks")
    .select(COLUMNS)
    .eq("tenant_id", scope.tenantId)
    .eq("user_id", scope.userId)
    .order("created_at", { ascending: false });
  return unwrap(result, "learning.bookmark.list").map((row) => toBookmark(row as unknown as Row));
}

export async function listLessonBookmarks(
  scope: BookmarkScope,
  lessonId: string,
): Promise<readonly Bookmark[]> {
  assertTenant(scope.tenantId, "learning.bookmark.lesson");
  assertUser(scope.userId, "learning.bookmark.lesson");
  const result = await supabase
    .from("bookmarks")
    .select(COLUMNS)
    .eq("tenant_id", scope.tenantId)
    .eq("user_id", scope.userId)
    .eq("lesson_id", lessonId);
  return unwrap(result, "learning.bookmark.lesson").map((row) =>
    toBookmark(row as unknown as Row),
  );
}

async function findBookmarkId(
  scope: BookmarkScope,
  values: { targetType: LearningTarget; lessonId: string; unitId: string | null },
): Promise<string | null> {
  let query = supabase
    .from("bookmarks")
    .select("id")
    .eq("tenant_id", scope.tenantId)
    .eq("user_id", scope.userId)
    .eq("target_type", values.targetType)
    .eq("lesson_id", values.lessonId);
  query = values.targetType === "unit" && values.unitId
    ? query.eq("unit_id", values.unitId)
    : query.is("unit_id", null);

  const result = await query.maybeSingle();
  if (result.error) unwrap(result, "learning.bookmark.find");
  return result.data?.id ?? null;
}

/** Adds the bookmark when missing, removes it when present. Never duplicates. */
export async function toggleBookmark(
  scope: BookmarkScope,
  input: BookmarkInput,
): Promise<"added" | "removed"> {
  assertTenant(scope.tenantId, "learning.bookmark.toggle");
  assertUser(scope.userId, "learning.bookmark.toggle");
  const values = bookmarkInputSchema.parse(input);

  const existingId = await findBookmarkId(scope, {
    targetType: values.targetType,
    lessonId: values.lessonId,
    unitId: values.unitId,
  });

  if (existingId) {
    const { error } = await supabase.from("bookmarks").delete().eq("id", existingId);
    if (error) unwrap({ data: null, error }, "learning.bookmark.remove");
    return "removed";
  }

  const inserted = await supabase
    .from("bookmarks")
    .insert({
      tenant_id: scope.tenantId,
      user_id: scope.userId,
      target_type: values.targetType,
      lesson_id: values.lessonId,
      unit_id: values.targetType === "unit" ? values.unitId : null,
      note: values.note,
    })
    .select("id")
    .single();
  unwrap(inserted, "learning.bookmark.add");
  return "added";
}

export async function removeBookmark(scope: BookmarkScope, bookmarkId: string): Promise<void> {
  assertTenant(scope.tenantId, "learning.bookmark.delete");
  assertUser(scope.userId, "learning.bookmark.delete");
  const { error } = await supabase
    .from("bookmarks")
    .delete()
    .eq("id", bookmarkId)
    .eq("user_id", scope.userId);
  if (error) unwrap({ data: null, error }, "learning.bookmark.delete");
}
