/**
 * LessonService — lessons inside a module, plus reader navigation context.
 * Navigation is always derived from the course structure, never hardcoded.
 */

import { supabase } from "@/integrations/supabase/client";
import { assertTenant, unwrap } from "@/modules/learning/services/learning-client";
import { listUnits } from "@/modules/learning/services/unit.service";
import type { ContentStatus, Lesson, LessonContext, OutlineLesson } from "@/modules/learning/types";
import { lessonInputSchema, type LessonInput } from "@/modules/learning/validation/schemas";
import { AppError } from "@/shared/platform";

const COLUMNS = "id, tenant_id, module_id, title, summary, estimated_minutes, status, position";

interface Row {
  id: string;
  tenant_id: string;
  module_id: string;
  title: string;
  summary: string | null;
  estimated_minutes: number;
  status: ContentStatus;
  position: number;
}

const toLesson = (row: Row): Lesson => ({
  id: row.id,
  tenantId: row.tenant_id,
  moduleId: row.module_id,
  title: row.title,
  summary: row.summary,
  estimatedMinutes: row.estimated_minutes,
  status: row.status,
  position: row.position,
});

export async function listLessons(tenantId: string, moduleId: string): Promise<readonly Lesson[]> {
  assertTenant(tenantId, "learning.lesson.list");
  const result = await supabase
    .from("lessons")
    .select(COLUMNS)
    .eq("tenant_id", tenantId)
    .eq("module_id", moduleId)
    .order("position", { ascending: true })
    .order("title", { ascending: true });
  return unwrap(result, "learning.lesson.list").map((row) => toLesson(row as unknown as Row));
}

export async function getLesson(tenantId: string, lessonId: string): Promise<Lesson> {
  assertTenant(tenantId, "learning.lesson.get");
  const result = await supabase
    .from("lessons")
    .select(COLUMNS)
    .eq("tenant_id", tenantId)
    .eq("id", lessonId)
    .maybeSingle();
  return toLesson(unwrap(result, "learning.lesson.get") as unknown as Row);
}

export async function createLesson(tenantId: string, input: LessonInput): Promise<Lesson> {
  assertTenant(tenantId, "learning.lesson.create");
  const values = lessonInputSchema.parse(input);
  const result = await supabase
    .from("lessons")
    .insert({
      tenant_id: tenantId,
      module_id: values.moduleId,
      title: values.title,
      summary: values.summary,
      estimated_minutes: values.estimatedMinutes,
      status: values.status,
      position: values.position,
    })
    .select(COLUMNS)
    .single();
  return toLesson(unwrap(result, "learning.lesson.create") as unknown as Row);
}

export async function updateLessonStatus(
  tenantId: string,
  lessonId: string,
  status: ContentStatus,
): Promise<void> {
  assertTenant(tenantId, "learning.lesson.status");
  const result = await supabase
    .from("lessons")
    .update({ status })
    .eq("tenant_id", tenantId)
    .eq("id", lessonId)
    .select("id")
    .single();
  unwrap(result, "learning.lesson.status");
}

export async function deleteLesson(tenantId: string, lessonId: string): Promise<void> {
  assertTenant(tenantId, "learning.lesson.delete");
  const { error } = await supabase
    .from("lessons")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("id", lessonId);
  if (error) unwrap({ data: null, error }, "learning.lesson.delete");
}

interface OutlineRow {
  id: string;
  title: string;
  position: number;
  course_modules: {
    id: string;
    title: string;
    position: number;
    courses: { id: string; title: string; slug: string } | null;
  } | null;
}

/** Flattened, ordered list of every lesson in a course. */
export async function getCourseOutline(
  tenantId: string,
  courseId: string,
): Promise<readonly OutlineLesson[]> {
  assertTenant(tenantId, "learning.lesson.outline");
  const result = await supabase
    .from("lessons")
    .select("id, title, position, course_modules!inner(id, title, position, course_id)")
    .eq("tenant_id", tenantId)
    .eq("course_modules.course_id", courseId);

  const rows = unwrap(result, "learning.lesson.outline") as unknown as {
    id: string;
    title: string;
    position: number;
    course_modules: { id: string; title: string; position: number } | null;
  }[];

  return rows
    .filter((row) => row.course_modules !== null)
    .sort((a, b) => {
      const modDiff = (a.course_modules?.position ?? 0) - (b.course_modules?.position ?? 0);
      if (modDiff !== 0) return modDiff;
      return a.position - b.position;
    })
    .map((row) => ({
      lessonId: row.id,
      moduleId: row.course_modules?.id ?? "",
      courseId,
      title: row.title,
      moduleTitle: row.course_modules?.title ?? "",
    }));
}

/** Lesson + units + previous/next navigation derived from the course structure. */
export async function getLessonContext(tenantId: string, lessonId: string): Promise<LessonContext> {
  assertTenant(tenantId, "learning.lesson.context");
  const result = await supabase
    .from("lessons")
    .select(
      "id, tenant_id, module_id, title, summary, estimated_minutes, status, position, course_modules!inner(id, title, position, courses!inner(id, title, slug))",
    )
    .eq("tenant_id", tenantId)
    .eq("id", lessonId)
    .maybeSingle();

  const row = unwrap(result, "learning.lesson.context") as unknown as Row & OutlineRow;
  const parentModule = row.course_modules;
  const course = parentModule?.courses ?? null;
  if (!parentModule || !course) {
    throw new AppError("Lesson tidak terhubung ke module dan course yang valid.", {
      kind: "validation",
      context: { scope: "learning.lesson.context", lessonId },
    });
  }

  const [units, outline] = await Promise.all([
    listUnits(tenantId, lessonId),
    getCourseOutline(tenantId, course.id),
  ]);

  const index = outline.findIndex((item) => item.lessonId === lessonId);
  return {
    course: { id: course.id, title: course.title, slug: course.slug },
    module: { id: parentModule.id, title: parentModule.title },
    lesson: toLesson(row),
    units,
    outline,
    previousLesson: index > 0 ? (outline[index - 1] ?? null) : null,
    nextLesson: index >= 0 && index < outline.length - 1 ? (outline[index + 1] ?? null) : null,
  };
}
