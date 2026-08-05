/**
 * Academic Domain — public entry point.
 * Other modules must import from `@/modules/academic`, never from internals.
 */

export type {
  AcademicPeriod,
  AcademicPeriodStatus,
  Enrollment,
  EnrollmentStatus,
  EnrollmentSummary,
  StudentProfile,
  StudyGroup,
  StudyGroupStatus,
  TeacherAssignment,
  TeacherAssignmentRole,
} from "@/modules/academic/types";

export { ACADEMIC_PERMISSIONS } from "@/modules/academic/config/permissions";
export type { AcademicPermissionKey } from "@/modules/academic/config/permissions";

export {
  academicPeriodInputSchema,
  enrollmentInputSchema,
  studentProfileInputSchema,
  studyGroupInputSchema,
  teacherAssignmentInputSchema,
} from "@/modules/academic/validation/schemas";
export type {
  AcademicPeriodInput,
  EnrollmentInput,
  StudentProfileInput,
  StudyGroupInput,
  TeacherAssignmentInput,
} from "@/modules/academic/validation/schemas";

export {
  academicKeys,
  useAcademicPeriods,
  useAcademicTenantId,
  useActiveAcademicPeriod,
  useAssignTeacher,
  useAssignableTeachers,
  useCreateAcademicPeriod,
  useCreateStudentProfile,
  useCreateStudyGroup,
  useDeleteAcademicPeriod,
  useDeleteEnrollment,
  useDeleteStudentProfile,
  useDeleteStudyGroup,
  useEnrollStudent,
  useEnrollments,
  useRemoveTeacherAssignment,
  useStudentProfiles,
  useStudyGroups,
  useTeacherAssignments,
  useUpdateAcademicPeriodStatus,
  useUpdateEnrollmentStatus,
  useUpdateStudentProfile,
  useUpdateStudyGroupStatus,
} from "@/modules/academic/hooks/useAcademic";

export { summarizeEnrollments } from "@/modules/academic/services/enrollment.service";
export { suggestStudentNumber } from "@/modules/academic/services/student-profile.service";

export {
  EnrollmentBadge,
  LifecycleBadge,
  StatusBadge,
  statusLabel,
} from "@/modules/academic/components/StatusBadge";
