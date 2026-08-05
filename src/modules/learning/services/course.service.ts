/**
 * CourseService — top level of the content hierarchy.
 */

import { supabase } from "@/integrations/supabase/client";
import { assertTenant, unwrap } from "@/modules/learning/services/learning-client";
import type { ContentStatus, Course } from "@/modules/learning/types";
import { courseInputSchema, type CourseInput } from "@/modules/learning/validation/schemas";

const COLUMNS =
  "id, tenant_id, slug, title, summary, level, cover_url, status, position, course_modules(id)";

interface Row {
  id: string;
  tenant_id: string;
  slug: string;
  title: string;
  summary: string | null;
  level: string | null;
  cover_url: string | null;
  status: ContentStatus;
  position: number;
  course_modules?: { id: string }[] | null;
}

const toCourse = (row: Row): Course => ({
  id: row.id,
  tenantId: row.tenant_id,
  slug: row.slug,
  title: row.title,
  summary: row.summary,
  level: row.level,
  coverUrl: row.cover_url,
  status: row.status,
  position: row.position,
  moduleCount: (row.course_modules ?? []).length,
});

export async function listCourses(tenantId: string): Promise<readonly Course[]> {
  assertTenant(tenantId, "learning.course.list");
  const result = await supabase
    .from("courses")
    .select(COLUMNS)
    .eq("tenant_id", tenantId)
    .order("position", { ascending: true })
    .order("title", { ascending: true });
  return unwrap(result, "learning.course.list").map((row) => toCourse(row as unknown as Row));
}

export async function getCourse(tenantId: string, courseId: string): Promise<Course> {
  assertTenant(tenantId, "learning.course.get");
  const result = await supabase
    .from("courses")
    .select(COLUMNS)
    .eq("tenant_id", tenantId)
    .eq("id", courseId)
    .maybeSingle();
  return toCourse(unwrap(result, "learning.course.get") as unknown as Row);
}

export async function createCourse(tenantId: string, input: CourseInput): Promise<Course> {
  assertTenant(tenantId, "learning.course.create");
  const values = courseInputSchema.parse(input);
  const result = await supabase
    .from("courses")
    .insert({
      tenant_id: tenantId,
      slug: values.slug,
      title: values.title,
      summary: values.summary,
      level: values.level,
      cover_url: values.coverUrl,
      status: values.status,
      position: values.position,
    })
    .select(COLUMNS)
    .single();
  return toCourse(unwrap(result, "learning.course.create") as unknown as Row);
}

export async function updateCourseStatus(
  tenantId: string,
  courseId: string,
  status: ContentStatus,
): Promise<void> {
  assertTenant(tenantId, "learning.course.status");
  const result = await supabase
    .from("courses")
    .update({ status })
    .eq("tenant_id", tenantId)
    .eq("id", courseId)
    .select("id")
    .single();
  unwrap(result, "learning.course.status");
}

export async function deleteCourse(tenantId: string, courseId: string): Promise<void> {
  assertTenant(tenantId, "learning.course.delete");
  const { error } = await supabase
    .from("courses")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("id", courseId);
  if (error) unwrap({ data: null, error }, "learning.course.delete");
}
