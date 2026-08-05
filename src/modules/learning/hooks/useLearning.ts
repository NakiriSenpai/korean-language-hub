/**
 * Learning Domain — React Query bindings.
 * Every hook is tenant scoped; personal hooks also require the signed-in user.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth, useTenant } from "@/modules/identity";
import {
  createCourse,
  deleteCourse,
  getCourse,
  listCourses,
  updateCourseStatus,
} from "@/modules/learning/services/course.service";
import {
  createModule,
  deleteModule,
  getModule,
  listModules,
  updateModuleStatus,
} from "@/modules/learning/services/module.service";
import {
  createLesson,
  deleteLesson,
  getLessonContext,
  listLessons,
  updateLessonStatus,
} from "@/modules/learning/services/lesson.service";
import { createUnit, deleteUnit } from "@/modules/learning/services/unit.service";
import {
  completeLesson,
  listLessonProgress,
  listMyLessonProgress,
  saveLastPosition,
  setUnitCompletion,
} from "@/modules/learning/services/progress.service";
import {
  listBookmarks,
  listLessonBookmarks,
  removeBookmark,
  toggleBookmark,
} from "@/modules/learning/services/bookmark.service";
import {
  clearContinueLearning,
  getContinueTarget,
  listRecentlyOpened,
  recordContinueLearning,
} from "@/modules/learning/services/continue-learning.service";
import type { ContentStatus } from "@/modules/learning/types";
import type {
  BookmarkInput,
  ContinueLearningInput,
  CourseInput,
  CourseModuleInput,
  LessonInput,
  LessonUnitInput,
} from "@/modules/learning/validation/schemas";

export const learningKeys = {
  all: (tenantId: string) => ["learning", tenantId] as const,
  courses: (tenantId: string) => ["learning", tenantId, "courses"] as const,
  course: (tenantId: string, courseId: string) =>
    ["learning", tenantId, "courses", courseId] as const,
  modules: (tenantId: string, courseId: string) =>
    ["learning", tenantId, "modules", courseId] as const,
  module: (tenantId: string, moduleId: string) =>
    ["learning", tenantId, "module", moduleId] as const,
  lessons: (tenantId: string, moduleId: string) =>
    ["learning", tenantId, "lessons", moduleId] as const,
  lessonContext: (tenantId: string, lessonId: string) =>
    ["learning", tenantId, "lesson-context", lessonId] as const,
  progress: (tenantId: string, userId: string, lessonId: string) =>
    ["learning", tenantId, "progress", userId, lessonId] as const,
  myProgress: (tenantId: string, userId: string) =>
    ["learning", tenantId, "progress", userId] as const,
  bookmarks: (tenantId: string, userId: string) =>
    ["learning", tenantId, "bookmarks", userId] as const,
  lessonBookmarks: (tenantId: string, userId: string, lessonId: string) =>
    ["learning", tenantId, "bookmarks", userId, lessonId] as const,
  continueList: (tenantId: string, userId: string) =>
    ["learning", tenantId, "continue", userId] as const,
  continueTarget: (tenantId: string, userId: string) =>
    ["learning", tenantId, "continue", userId, "target"] as const,
};

/** Current tenant id, or an empty string while identity resolves. */
export function useLearningTenantId(): string {
  const { tenant } = useTenant();
  return tenant?.id ?? "";
}

/** Tenant + user scope used by all personal learning records. */
export function useLearningScope(): { tenantId: string; userId: string; ready: boolean } {
  const tenantId = useLearningTenantId();
  const { user } = useAuth();
  const userId = user?.id ?? "";
  return { tenantId, userId, ready: Boolean(tenantId && userId) };
}

function useInvalidateLearning(tenantId: string) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: learningKeys.all(tenantId) });
}

/* ------------------------------------------------------------------ */
/* Content structure                                                    */
/* ------------------------------------------------------------------ */

export function useCourses() {
  const tenantId = useLearningTenantId();
  return useQuery({
    queryKey: learningKeys.courses(tenantId),
    queryFn: () => listCourses(tenantId),
    enabled: Boolean(tenantId),
  });
}

export function useCourse(courseId: string) {
  const tenantId = useLearningTenantId();
  return useQuery({
    queryKey: learningKeys.course(tenantId, courseId),
    queryFn: () => getCourse(tenantId, courseId),
    enabled: Boolean(tenantId && courseId),
  });
}

export function useCreateCourse() {
  const tenantId = useLearningTenantId();
  const invalidate = useInvalidateLearning(tenantId);
  return useMutation({
    mutationFn: (input: CourseInput) => createCourse(tenantId, input),
    onSuccess: invalidate,
  });
}

export function useUpdateCourseStatus() {
  const tenantId = useLearningTenantId();
  const invalidate = useInvalidateLearning(tenantId);
  return useMutation({
    mutationFn: (args: { courseId: string; status: ContentStatus }) =>
      updateCourseStatus(tenantId, args.courseId, args.status),
    onSuccess: invalidate,
  });
}

export function useDeleteCourse() {
  const tenantId = useLearningTenantId();
  const invalidate = useInvalidateLearning(tenantId);
  return useMutation({
    mutationFn: (courseId: string) => deleteCourse(tenantId, courseId),
    onSuccess: invalidate,
  });
}

export function useModules(courseId: string) {
  const tenantId = useLearningTenantId();
  return useQuery({
    queryKey: learningKeys.modules(tenantId, courseId),
    queryFn: () => listModules(tenantId, courseId),
    enabled: Boolean(tenantId && courseId),
  });
}

export function useModule(moduleId: string) {
  const tenantId = useLearningTenantId();
  return useQuery({
    queryKey: learningKeys.module(tenantId, moduleId),
    queryFn: () => getModule(tenantId, moduleId),
    enabled: Boolean(tenantId && moduleId),
  });
}

export function useCreateModule() {
  const tenantId = useLearningTenantId();
  const invalidate = useInvalidateLearning(tenantId);
  return useMutation({
    mutationFn: (input: CourseModuleInput) => createModule(tenantId, input),
    onSuccess: invalidate,
  });
}

export function useUpdateModuleStatus() {
  const tenantId = useLearningTenantId();
  const invalidate = useInvalidateLearning(tenantId);
  return useMutation({
    mutationFn: (args: { moduleId: string; status: ContentStatus }) =>
      updateModuleStatus(tenantId, args.moduleId, args.status),
    onSuccess: invalidate,
  });
}

export function useDeleteModule() {
  const tenantId = useLearningTenantId();
  const invalidate = useInvalidateLearning(tenantId);
  return useMutation({
    mutationFn: (moduleId: string) => deleteModule(tenantId, moduleId),
    onSuccess: invalidate,
  });
}

export function useLessons(moduleId: string) {
  const tenantId = useLearningTenantId();
  return useQuery({
    queryKey: learningKeys.lessons(tenantId, moduleId),
    queryFn: () => listLessons(tenantId, moduleId),
    enabled: Boolean(tenantId && moduleId),
  });
}

export function useCreateLesson() {
  const tenantId = useLearningTenantId();
  const invalidate = useInvalidateLearning(tenantId);
  return useMutation({
    mutationFn: (input: LessonInput) => createLesson(tenantId, input),
    onSuccess: invalidate,
  });
}

export function useUpdateLessonStatus() {
  const tenantId = useLearningTenantId();
  const invalidate = useInvalidateLearning(tenantId);
  return useMutation({
    mutationFn: (args: { lessonId: string; status: ContentStatus }) =>
      updateLessonStatus(tenantId, args.lessonId, args.status),
    onSuccess: invalidate,
  });
}

export function useDeleteLesson() {
  const tenantId = useLearningTenantId();
  const invalidate = useInvalidateLearning(tenantId);
  return useMutation({
    mutationFn: (lessonId: string) => deleteLesson(tenantId, lessonId),
    onSuccess: invalidate,
  });
}

export function useLessonContext(lessonId: string) {
  const tenantId = useLearningTenantId();
  return useQuery({
    queryKey: learningKeys.lessonContext(tenantId, lessonId),
    queryFn: () => getLessonContext(tenantId, lessonId),
    enabled: Boolean(tenantId && lessonId),
  });
}

export function useCreateUnit() {
  const tenantId = useLearningTenantId();
  const invalidate = useInvalidateLearning(tenantId);
  return useMutation({
    mutationFn: (input: LessonUnitInput) => createUnit(tenantId, input),
    onSuccess: invalidate,
  });
}

export function useDeleteUnit() {
  const tenantId = useLearningTenantId();
  const invalidate = useInvalidateLearning(tenantId);
  return useMutation({
    mutationFn: (unitId: string) => deleteUnit(tenantId, unitId),
    onSuccess: invalidate,
  });
}

/* ------------------------------------------------------------------ */
/* Learning engine                                                      */
/* ------------------------------------------------------------------ */

export function useLessonProgress(lessonId: string) {
  const { tenantId, userId, ready } = useLearningScope();
  return useQuery({
    queryKey: learningKeys.progress(tenantId, userId, lessonId),
    queryFn: () => listLessonProgress({ tenantId, userId }, lessonId),
    enabled: ready && Boolean(lessonId),
  });
}

export function useMyProgress() {
  const { tenantId, userId, ready } = useLearningScope();
  return useQuery({
    queryKey: learningKeys.myProgress(tenantId, userId),
    queryFn: () => listMyLessonProgress({ tenantId, userId }),
    enabled: ready,
  });
}

export function useSetUnitCompletion() {
  const { tenantId, userId } = useLearningScope();
  const invalidate = useInvalidateLearning(tenantId);
  return useMutation({
    mutationFn: (args: {
      lessonId: string;
      unitId: string;
      totalUnits: number;
      completed: boolean;
    }) => setUnitCompletion({ tenantId, userId }, args),
    onSuccess: invalidate,
  });
}

export function useCompleteLesson() {
  const { tenantId, userId } = useLearningScope();
  const invalidate = useInvalidateLearning(tenantId);
  return useMutation({
    mutationFn: (lessonId: string) => completeLesson({ tenantId, userId }, lessonId),
    onSuccess: invalidate,
  });
}

export function useSaveLastPosition() {
  const { tenantId, userId } = useLearningScope();
  return useMutation({
    mutationFn: (args: { lessonId: string; position: number; percent: number }) =>
      saveLastPosition({ tenantId, userId }, args),
  });
}

export function useBookmarks() {
  const { tenantId, userId, ready } = useLearningScope();
  return useQuery({
    queryKey: learningKeys.bookmarks(tenantId, userId),
    queryFn: () => listBookmarks({ tenantId, userId }),
    enabled: ready,
  });
}

export function useLessonBookmarks(lessonId: string) {
  const { tenantId, userId, ready } = useLearningScope();
  return useQuery({
    queryKey: learningKeys.lessonBookmarks(tenantId, userId, lessonId),
    queryFn: () => listLessonBookmarks({ tenantId, userId }, lessonId),
    enabled: ready && Boolean(lessonId),
  });
}

export function useToggleBookmark() {
  const { tenantId, userId } = useLearningScope();
  const invalidate = useInvalidateLearning(tenantId);
  return useMutation({
    mutationFn: (input: BookmarkInput) => toggleBookmark({ tenantId, userId }, input),
    onSuccess: invalidate,
  });
}

export function useRemoveBookmark() {
  const { tenantId, userId } = useLearningScope();
  const invalidate = useInvalidateLearning(tenantId);
  return useMutation({
    mutationFn: (bookmarkId: string) => removeBookmark({ tenantId, userId }, bookmarkId),
    onSuccess: invalidate,
  });
}

export function useRecentlyOpened(limit = 10) {
  const { tenantId, userId, ready } = useLearningScope();
  return useQuery({
    queryKey: learningKeys.continueList(tenantId, userId),
    queryFn: () => listRecentlyOpened({ tenantId, userId }, limit),
    enabled: ready,
  });
}

export function useContinueTarget() {
  const { tenantId, userId, ready } = useLearningScope();
  return useQuery({
    queryKey: learningKeys.continueTarget(tenantId, userId),
    queryFn: () => getContinueTarget({ tenantId, userId }),
    enabled: ready,
  });
}

export function useRecordContinueLearning() {
  const { tenantId, userId } = useLearningScope();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ContinueLearningInput) =>
      recordContinueLearning({ tenantId, userId }, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: learningKeys.continueList(tenantId, userId) });
      void queryClient.invalidateQueries({
        queryKey: learningKeys.continueTarget(tenantId, userId),
      });
    },
  });
}

export function useClearContinueLearning() {
  const { tenantId, userId } = useLearningScope();
  const invalidate = useInvalidateLearning(tenantId);
  return useMutation({
    mutationFn: (entryId: string) => clearContinueLearning({ tenantId, userId }, entryId),
    onSuccess: invalidate,
  });
}
