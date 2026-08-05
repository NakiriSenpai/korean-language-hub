/**
 * Enrollment service — links students to study groups within a period.
 * Capacity is enforced by a database trigger; this layer only validates shape.
 */

import { supabase } from "@/integrations/supabase/client";
import { toAcademicError, unwrap } from "@/modules/academic/services/academic-client";
import type { Enrollment, EnrollmentStatus, EnrollmentSummary } from "@/modules/academic/types";
import {
  enrollmentInputSchema,
  enrollmentStatusSchema,
  type EnrollmentInput,
} from "@/modules/academic/validation/schemas";
import { AppError } from "@/shared/platform";

const COLUMNS =
  "id, tenant_id, period_id, study_group_id, student_profile_id, status, enrolled_on, completed_on, " +
  "student_profiles(full_name, student_number), study_groups(name)";

interface Row {
  id: string;
  tenant_id: string;
  period_id: string;
  study_group_id: string;
  student_profile_id: string;
  status: EnrollmentStatus;
  enrolled_on: string;
  completed_on: string | null;
  student_profiles: { full_name: string; student_number: string } | null;
  study_groups: { name: string } | null;
}

const toEnrollment = (row: Row): Enrollment => ({
  id: row.id,
  tenantId: row.tenant_id,
  periodId: row.period_id,
  studyGroupId: row.study_group_id,
  studentProfileId: row.student_profile_id,
  status: row.status,
  enrolledOn: row.enrolled_on,
  completedOn: row.completed_on,
  studentName: row.student_profiles?.full_name ?? "—",
  studentNumber: row.student_profiles?.student_number ?? "—",
  studyGroupName: row.study_groups?.name ?? "—",
});

export interface EnrollmentFilter {
  readonly periodId?: string;
  readonly studyGroupId?: string;
  readonly studentProfileId?: string;
  readonly status?: EnrollmentStatus;
}

export async function listEnrollments(
  tenantId: string,
  filter: EnrollmentFilter = {},
): Promise<readonly Enrollment[]> {
  let query = supabase.from("enrollments").select(COLUMNS).eq("tenant_id", tenantId);
  if (filter.periodId) query = query.eq("period_id", filter.periodId);
  if (filter.studyGroupId) query = query.eq("study_group_id", filter.studyGroupId);
  if (filter.studentProfileId) query = query.eq("student_profile_id", filter.studentProfileId);
  if (filter.status) query = query.eq("status", filter.status);

  const result = await query.order("enrolled_on", { ascending: false });
  return unwrap(result, "academic.enrollment.list").map((row) =>
    toEnrollment(row as unknown as Row),
  );
}

export async function enrollStudent(tenantId: string, input: EnrollmentInput): Promise<Enrollment> {
  const values = enrollmentInputSchema.parse(input);

  const groupResult = await supabase
    .from("study_groups")
    .select("id, period_id, status")
    .eq("id", values.studyGroupId)
    .eq("tenant_id", tenantId)
    .single();
  const group = unwrap(groupResult, "academic.enrollment.group") as {
    id: string;
    period_id: string;
    status: string;
  };

  if (group.status === "archived") {
    throw new AppError("Kelas sudah diarsipkan dan tidak menerima pendaftaran.", {
      kind: "validation",
      context: { scope: "academic.enrollment.create" },
    });
  }

  const result = await supabase
    .from("enrollments")
    .insert({
      tenant_id: tenantId,
      period_id: group.period_id,
      study_group_id: values.studyGroupId,
      student_profile_id: values.studentProfileId,
      ...(values.enrolledOn ? { enrolled_on: values.enrolledOn } : {}),
    })
    .select(COLUMNS)
    .single();

  return toEnrollment(unwrap(result, "academic.enrollment.create") as unknown as Row);
}

export async function updateEnrollmentStatus(
  enrollmentId: string,
  status: EnrollmentStatus,
): Promise<Enrollment> {
  const next = enrollmentStatusSchema.parse(status);
  const result = await supabase
    .from("enrollments")
    .update({
      status: next,
      completed_on: next === "completed" ? new Date().toISOString().slice(0, 10) : null,
    })
    .eq("id", enrollmentId)
    .select(COLUMNS)
    .single();

  return toEnrollment(unwrap(result, "academic.enrollment.updateStatus") as unknown as Row);
}

export async function deleteEnrollment(enrollmentId: string): Promise<void> {
  const { error } = await supabase.from("enrollments").delete().eq("id", enrollmentId);
  if (error) throw toAcademicError(error, "academic.enrollment.delete");
}

/** Counts enrollments by status for a tenant (optionally scoped to a period). */
export function summarizeEnrollments(items: readonly Enrollment[]): EnrollmentSummary {
  return {
    total: items.length,
    active: items.filter((item) => item.status === "active").length,
    completed: items.filter((item) => item.status === "completed").length,
    suspended: items.filter((item) => item.status === "suspended").length,
    dropped: items.filter((item) => item.status === "dropped").length,
  };
}
