/**
 * Study Group service — classes that belong to an academic period.
 */

import { supabase } from "@/integrations/supabase/client";
import { toAcademicError, unwrap } from "@/modules/academic/services/academic-client";
import type { StudyGroup, StudyGroupStatus } from "@/modules/academic/types";
import { studyGroupInputSchema, type StudyGroupInput } from "@/modules/academic/validation/schemas";

const COLUMNS =
  "id, tenant_id, period_id, name, code, level, room, capacity, status, enrollments(id, status)";

interface Row {
  id: string;
  tenant_id: string;
  period_id: string;
  name: string;
  code: string;
  level: string | null;
  room: string | null;
  capacity: number;
  status: StudyGroupStatus;
  enrollments?: { id: string; status: string }[] | null;
}

const toGroup = (row: Row): StudyGroup => ({
  id: row.id,
  tenantId: row.tenant_id,
  periodId: row.period_id,
  name: row.name,
  code: row.code,
  level: row.level,
  room: row.room,
  capacity: row.capacity,
  status: row.status,
  enrolledCount: (row.enrollments ?? []).filter((item) => item.status === "active").length,
});

export interface StudyGroupFilter {
  readonly periodId?: string;
  readonly status?: StudyGroupStatus;
}

export async function listStudyGroups(
  tenantId: string,
  filter: StudyGroupFilter = {},
): Promise<readonly StudyGroup[]> {
  let query = supabase.from("study_groups").select(COLUMNS).eq("tenant_id", tenantId);
  if (filter.periodId) query = query.eq("period_id", filter.periodId);
  if (filter.status) query = query.eq("status", filter.status);

  const result = await query.order("name", { ascending: true });
  return unwrap(result, "academic.studyGroup.list").map((row) => toGroup(row as unknown as Row));
}

export async function createStudyGroup(
  tenantId: string,
  input: StudyGroupInput,
): Promise<StudyGroup> {
  const values = studyGroupInputSchema.parse(input);
  const result = await supabase
    .from("study_groups")
    .insert({
      tenant_id: tenantId,
      period_id: values.periodId,
      name: values.name,
      code: values.code,
      level: values.level,
      room: values.room,
      capacity: values.capacity,
      status: values.status,
    })
    .select(COLUMNS)
    .single();

  return toGroup(unwrap(result, "academic.studyGroup.create") as unknown as Row);
}

export async function updateStudyGroupStatus(
  studyGroupId: string,
  status: StudyGroupStatus,
): Promise<StudyGroup> {
  const result = await supabase
    .from("study_groups")
    .update({ status })
    .eq("id", studyGroupId)
    .select(COLUMNS)
    .single();

  return toGroup(unwrap(result, "academic.studyGroup.updateStatus") as unknown as Row);
}

export async function deleteStudyGroup(studyGroupId: string): Promise<void> {
  const { error } = await supabase.from("study_groups").delete().eq("id", studyGroupId);
  if (error) throw toAcademicError(error, "academic.studyGroup.delete");
}
