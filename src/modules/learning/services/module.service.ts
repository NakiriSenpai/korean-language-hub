/**
 * ModuleService — modules that belong to a course.
 */

import { supabase } from "@/integrations/supabase/client";
import { assertTenant, unwrap } from "@/modules/learning/services/learning-client";
import type { ContentStatus, CourseModule } from "@/modules/learning/types";
import {
  courseModuleInputSchema,
  type CourseModuleInput,
} from "@/modules/learning/validation/schemas";

const COLUMNS = "id, tenant_id, course_id, title, summary, status, position, lessons(id)";

interface Row {
  id: string;
  tenant_id: string;
  course_id: string;
  title: string;
  summary: string | null;
  status: ContentStatus;
  position: number;
  lessons?: { id: string }[] | null;
}

const toModule = (row: Row): CourseModule => ({
  id: row.id,
  tenantId: row.tenant_id,
  courseId: row.course_id,
  title: row.title,
  summary: row.summary,
  status: row.status,
  position: row.position,
  lessonCount: (row.lessons ?? []).length,
});

export async function listModules(
  tenantId: string,
  courseId: string,
): Promise<readonly CourseModule[]> {
  assertTenant(tenantId, "learning.module.list");
  const result = await supabase
    .from("course_modules")
    .select(COLUMNS)
    .eq("tenant_id", tenantId)
    .eq("course_id", courseId)
    .order("position", { ascending: true })
    .order("title", { ascending: true });
  return unwrap(result, "learning.module.list").map((row) => toModule(row as unknown as Row));
}

export async function getModule(tenantId: string, moduleId: string): Promise<CourseModule> {
  assertTenant(tenantId, "learning.module.get");
  const result = await supabase
    .from("course_modules")
    .select(COLUMNS)
    .eq("tenant_id", tenantId)
    .eq("id", moduleId)
    .maybeSingle();
  return toModule(unwrap(result, "learning.module.get") as unknown as Row);
}

export async function createModule(
  tenantId: string,
  input: CourseModuleInput,
): Promise<CourseModule> {
  assertTenant(tenantId, "learning.module.create");
  const values = courseModuleInputSchema.parse(input);
  const result = await supabase
    .from("course_modules")
    .insert({
      tenant_id: tenantId,
      course_id: values.courseId,
      title: values.title,
      summary: values.summary,
      status: values.status,
      position: values.position,
    })
    .select(COLUMNS)
    .single();
  return toModule(unwrap(result, "learning.module.create") as unknown as Row);
}

export async function updateModuleStatus(
  tenantId: string,
  moduleId: string,
  status: ContentStatus,
): Promise<void> {
  assertTenant(tenantId, "learning.module.status");
  const result = await supabase
    .from("course_modules")
    .update({ status })
    .eq("tenant_id", tenantId)
    .eq("id", moduleId)
    .select("id")
    .single();
  unwrap(result, "learning.module.status");
}

export async function deleteModule(tenantId: string, moduleId: string): Promise<void> {
  assertTenant(tenantId, "learning.module.delete");
  const { error } = await supabase
    .from("course_modules")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("id", moduleId);
  if (error) unwrap({ data: null, error }, "learning.module.delete");
}
