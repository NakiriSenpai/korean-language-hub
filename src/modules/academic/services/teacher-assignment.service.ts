/**
 * Teacher Assignment service — assigns tenant members as lead/assistant of a study group.
 */

import { supabase } from "@/integrations/supabase/client";
import { toAcademicError, unwrap } from "@/modules/academic/services/academic-client";
import type { TeacherAssignment, TeacherAssignmentRole } from "@/modules/academic/types";
import {
  teacherAssignmentInputSchema,
  type TeacherAssignmentInput,
} from "@/modules/academic/validation/schemas";

const COLUMNS =
  "id, tenant_id, study_group_id, teacher_user_id, assignment_role, assigned_on, study_groups(name)";

interface Row {
  id: string;
  tenant_id: string;
  study_group_id: string;
  teacher_user_id: string;
  assignment_role: TeacherAssignmentRole;
  assigned_on: string;
  study_groups: { name: string } | null;
}

/** Teacher display names come from `profiles`, resolved in a second query. */
async function resolveTeacherNames(userIds: readonly string[]): Promise<Map<string, string | null>> {
  const unique = [...new Set(userIds)];
  if (unique.length === 0) return new Map();

  const { data, error } = await supabase.from("profiles").select("id, full_name").in("id", unique);
  if (error) throw toAcademicError(error, "academic.teacherAssignment.profiles");

  return new Map((data ?? []).map((row) => [row.id, row.full_name]));
}

export async function listTeacherAssignments(
  tenantId: string,
  studyGroupId?: string,
): Promise<readonly TeacherAssignment[]> {
  let query = supabase.from("teacher_assignments").select(COLUMNS).eq("tenant_id", tenantId);
  if (studyGroupId) query = query.eq("study_group_id", studyGroupId);

  const rows = unwrap(
    await query.order("assigned_on", { ascending: false }),
    "academic.teacherAssignment.list",
  ) as unknown as Row[];

  const names = await resolveTeacherNames(rows.map((row) => row.teacher_user_id));

  return rows.map((row) => ({
    id: row.id,
    tenantId: row.tenant_id,
    studyGroupId: row.study_group_id,
    teacherUserId: row.teacher_user_id,
    assignmentRole: row.assignment_role,
    assignedOn: row.assigned_on,
    teacherName: names.get(row.teacher_user_id) ?? null,
    studyGroupName: row.study_groups?.name ?? "—",
  }));
}

export async function assignTeacher(
  tenantId: string,
  input: TeacherAssignmentInput,
): Promise<void> {
  const values = teacherAssignmentInputSchema.parse(input);
  const { error } = await supabase.from("teacher_assignments").insert({
    tenant_id: tenantId,
    study_group_id: values.studyGroupId,
    teacher_user_id: values.teacherUserId,
    assignment_role: values.assignmentRole,
  });
  if (error) throw toAcademicError(error, "academic.teacherAssignment.create");
}

export async function removeTeacherAssignment(assignmentId: string): Promise<void> {
  const { error } = await supabase.from("teacher_assignments").delete().eq("id", assignmentId);
  if (error) throw toAcademicError(error, "academic.teacherAssignment.delete");
}

/** Tenant members that can be assigned as teachers. */
export interface AssignableTeacher {
  readonly userId: string;
  readonly name: string;
  readonly role: string;
}

export async function listAssignableTeachers(
  tenantId: string,
): Promise<readonly AssignableTeacher[]> {
  const { data, error } = await supabase
    .from("memberships")
    .select("user_id, role")
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .in("role", ["owner", "admin", "instructor"]);

  if (error) throw toAcademicError(error, "academic.teacherAssignment.candidates");

  const rows = data ?? [];
  const names = await resolveTeacherNames(rows.map((row) => row.user_id));

  return rows.map((row) => ({
    userId: row.user_id,
    name: names.get(row.user_id) ?? row.user_id.slice(0, 8),
    role: row.role,
  }));
}
