/**
 * Academic Domain — React Query bindings.
 * Every hook is tenant scoped; queries stay disabled until a tenant is resolved.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useTenant } from "@/modules/identity";
import {
  createAcademicPeriod,
  deleteAcademicPeriod,
  getActiveAcademicPeriod,
  listAcademicPeriods,
  updateAcademicPeriodStatus,
} from "@/modules/academic/services/academic-period.service";
import {
  createStudyGroup,
  deleteStudyGroup,
  listStudyGroups,
  updateStudyGroupStatus,
  type StudyGroupFilter,
} from "@/modules/academic/services/study-group.service";
import {
  createStudentProfile,
  deleteStudentProfile,
  listStudentProfiles,
  updateStudentProfile,
} from "@/modules/academic/services/student-profile.service";
import {
  deleteEnrollment,
  enrollStudent,
  listEnrollments,
  updateEnrollmentStatus,
  type EnrollmentFilter,
} from "@/modules/academic/services/enrollment.service";
import {
  assignTeacher,
  listAssignableTeachers,
  listTeacherAssignments,
  removeTeacherAssignment,
} from "@/modules/academic/services/teacher-assignment.service";
import type {
  AcademicPeriodStatus,
  EnrollmentStatus,
  StudyGroupStatus,
} from "@/modules/academic/types";
import type {
  AcademicPeriodInput,
  EnrollmentInput,
  StudentProfileInput,
  StudyGroupInput,
  TeacherAssignmentInput,
} from "@/modules/academic/validation/schemas";

export const academicKeys = {
  all: (tenantId: string) => ["academic", tenantId] as const,
  periods: (tenantId: string) => ["academic", tenantId, "periods"] as const,
  activePeriod: (tenantId: string) => ["academic", tenantId, "periods", "active"] as const,
  studyGroups: (tenantId: string, filter: StudyGroupFilter) =>
    ["academic", tenantId, "study-groups", filter] as const,
  students: (tenantId: string, search: string) =>
    ["academic", tenantId, "students", search] as const,
  enrollments: (tenantId: string, filter: EnrollmentFilter) =>
    ["academic", tenantId, "enrollments", filter] as const,
  teacherAssignments: (tenantId: string, studyGroupId?: string) =>
    ["academic", tenantId, "teacher-assignments", studyGroupId ?? "all"] as const,
  teacherCandidates: (tenantId: string) => ["academic", tenantId, "teacher-candidates"] as const,
};

/** Current tenant id, or an empty string when identity is still resolving. */
export function useAcademicTenantId(): string {
  const { tenant } = useTenant();
  return tenant?.id ?? "";
}

function useInvalidateAcademic(tenantId: string) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: academicKeys.all(tenantId) });
}

/* ---------------------------------- periods --------------------------------- */

export function useAcademicPeriods() {
  const tenantId = useAcademicTenantId();
  return useQuery({
    queryKey: academicKeys.periods(tenantId),
    queryFn: () => listAcademicPeriods(tenantId),
    enabled: tenantId.length > 0,
  });
}

export function useActiveAcademicPeriod() {
  const tenantId = useAcademicTenantId();
  return useQuery({
    queryKey: academicKeys.activePeriod(tenantId),
    queryFn: () => getActiveAcademicPeriod(tenantId),
    enabled: tenantId.length > 0,
  });
}

export function useCreateAcademicPeriod() {
  const tenantId = useAcademicTenantId();
  const invalidate = useInvalidateAcademic(tenantId);
  return useMutation({
    mutationFn: (input: AcademicPeriodInput) => createAcademicPeriod(tenantId, input),
    onSuccess: invalidate,
  });
}

export function useUpdateAcademicPeriodStatus() {
  const tenantId = useAcademicTenantId();
  const invalidate = useInvalidateAcademic(tenantId);
  return useMutation({
    mutationFn: (vars: { id: string; status: AcademicPeriodStatus }) =>
      updateAcademicPeriodStatus(vars.id, vars.status),
    onSuccess: invalidate,
  });
}

export function useDeleteAcademicPeriod() {
  const tenantId = useAcademicTenantId();
  const invalidate = useInvalidateAcademic(tenantId);
  return useMutation({ mutationFn: deleteAcademicPeriod, onSuccess: invalidate });
}

/* -------------------------------- study groups ------------------------------- */

export function useStudyGroups(filter: StudyGroupFilter = {}) {
  const tenantId = useAcademicTenantId();
  return useQuery({
    queryKey: academicKeys.studyGroups(tenantId, filter),
    queryFn: () => listStudyGroups(tenantId, filter),
    enabled: tenantId.length > 0,
  });
}

export function useCreateStudyGroup() {
  const tenantId = useAcademicTenantId();
  const invalidate = useInvalidateAcademic(tenantId);
  return useMutation({
    mutationFn: (input: StudyGroupInput) => createStudyGroup(tenantId, input),
    onSuccess: invalidate,
  });
}

export function useUpdateStudyGroupStatus() {
  const tenantId = useAcademicTenantId();
  const invalidate = useInvalidateAcademic(tenantId);
  return useMutation({
    mutationFn: (vars: { id: string; status: StudyGroupStatus }) =>
      updateStudyGroupStatus(vars.id, vars.status),
    onSuccess: invalidate,
  });
}

export function useDeleteStudyGroup() {
  const tenantId = useAcademicTenantId();
  const invalidate = useInvalidateAcademic(tenantId);
  return useMutation({ mutationFn: deleteStudyGroup, onSuccess: invalidate });
}

/* ------------------------------ student profiles ----------------------------- */

export function useStudentProfiles(search = "") {
  const tenantId = useAcademicTenantId();
  return useQuery({
    queryKey: academicKeys.students(tenantId, search),
    queryFn: () => listStudentProfiles(tenantId, search),
    enabled: tenantId.length > 0,
  });
}

export function useCreateStudentProfile() {
  const tenantId = useAcademicTenantId();
  const invalidate = useInvalidateAcademic(tenantId);
  return useMutation({
    mutationFn: (input: StudentProfileInput) => createStudentProfile(tenantId, input),
    onSuccess: invalidate,
  });
}

export function useUpdateStudentProfile() {
  const tenantId = useAcademicTenantId();
  const invalidate = useInvalidateAcademic(tenantId);
  return useMutation({
    mutationFn: (vars: { id: string; input: StudentProfileInput }) =>
      updateStudentProfile(vars.id, vars.input),
    onSuccess: invalidate,
  });
}

export function useDeleteStudentProfile() {
  const tenantId = useAcademicTenantId();
  const invalidate = useInvalidateAcademic(tenantId);
  return useMutation({ mutationFn: deleteStudentProfile, onSuccess: invalidate });
}

/* -------------------------------- enrollments -------------------------------- */

export function useEnrollments(filter: EnrollmentFilter = {}) {
  const tenantId = useAcademicTenantId();
  return useQuery({
    queryKey: academicKeys.enrollments(tenantId, filter),
    queryFn: () => listEnrollments(tenantId, filter),
    enabled: tenantId.length > 0,
  });
}

export function useEnrollStudent() {
  const tenantId = useAcademicTenantId();
  const invalidate = useInvalidateAcademic(tenantId);
  return useMutation({
    mutationFn: (input: EnrollmentInput) => enrollStudent(tenantId, input),
    onSuccess: invalidate,
  });
}

export function useUpdateEnrollmentStatus() {
  const tenantId = useAcademicTenantId();
  const invalidate = useInvalidateAcademic(tenantId);
  return useMutation({
    mutationFn: (vars: { id: string; status: EnrollmentStatus }) =>
      updateEnrollmentStatus(vars.id, vars.status),
    onSuccess: invalidate,
  });
}

export function useDeleteEnrollment() {
  const tenantId = useAcademicTenantId();
  const invalidate = useInvalidateAcademic(tenantId);
  return useMutation({ mutationFn: deleteEnrollment, onSuccess: invalidate });
}

/* ----------------------------- teacher assignments ---------------------------- */

export function useTeacherAssignments(studyGroupId?: string) {
  const tenantId = useAcademicTenantId();
  return useQuery({
    queryKey: academicKeys.teacherAssignments(tenantId, studyGroupId),
    queryFn: () => listTeacherAssignments(tenantId, studyGroupId),
    enabled: tenantId.length > 0,
  });
}

export function useAssignableTeachers() {
  const tenantId = useAcademicTenantId();
  return useQuery({
    queryKey: academicKeys.teacherCandidates(tenantId),
    queryFn: () => listAssignableTeachers(tenantId),
    enabled: tenantId.length > 0,
  });
}

export function useAssignTeacher() {
  const tenantId = useAcademicTenantId();
  const invalidate = useInvalidateAcademic(tenantId);
  return useMutation({
    mutationFn: (input: TeacherAssignmentInput) => assignTeacher(tenantId, input),
    onSuccess: invalidate,
  });
}

export function useRemoveTeacherAssignment() {
  const tenantId = useAcademicTenantId();
  const invalidate = useInvalidateAcademic(tenantId);
  return useMutation({ mutationFn: removeTeacherAssignment, onSuccess: invalidate });
}
