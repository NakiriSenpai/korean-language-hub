/**
 * Academic Domain — types.
 * Mirrors the database contract; the app never touches raw rows outside services.
 */

import type { Database } from "@/integrations/supabase/types";

export type AcademicPeriodStatus = Database["public"]["Enums"]["academic_period_status"];
export type StudyGroupStatus = Database["public"]["Enums"]["study_group_status"];
export type EnrollmentStatus = Database["public"]["Enums"]["enrollment_status"];
export type TeacherAssignmentRole = Database["public"]["Enums"]["teacher_assignment_role"];

export interface AcademicPeriod {
  readonly id: string;
  readonly tenantId: string;
  readonly name: string;
  readonly code: string;
  readonly startsOn: string;
  readonly endsOn: string;
  readonly status: AcademicPeriodStatus;
}

export interface StudyGroup {
  readonly id: string;
  readonly tenantId: string;
  readonly periodId: string;
  readonly name: string;
  readonly code: string;
  readonly level: string | null;
  readonly room: string | null;
  readonly capacity: number;
  readonly status: StudyGroupStatus;
  /** Active enrollments currently occupying a seat. */
  readonly enrolledCount: number;
}

export interface StudentProfile {
  readonly id: string;
  readonly tenantId: string;
  readonly userId: string | null;
  readonly studentNumber: string;
  readonly fullName: string;
  readonly avatarUrl: string | null;
  readonly birthDate: string | null;
  readonly phone: string | null;
  readonly email: string | null;
  readonly notes: string | null;
}

export interface Enrollment {
  readonly id: string;
  readonly tenantId: string;
  readonly periodId: string;
  readonly studyGroupId: string;
  readonly studentProfileId: string;
  readonly status: EnrollmentStatus;
  readonly enrolledOn: string;
  readonly completedOn: string | null;
  readonly studentName: string;
  readonly studentNumber: string;
  readonly studyGroupName: string;
}

export interface TeacherAssignment {
  readonly id: string;
  readonly tenantId: string;
  readonly studyGroupId: string;
  readonly teacherUserId: string;
  readonly assignmentRole: TeacherAssignmentRole;
  readonly assignedOn: string;
  readonly teacherName: string | null;
  readonly studyGroupName: string;
}

/** Aggregated academic footprint of a single student. */
export interface EnrollmentSummary {
  readonly total: number;
  readonly active: number;
  readonly completed: number;
  readonly suspended: number;
  readonly dropped: number;
}
