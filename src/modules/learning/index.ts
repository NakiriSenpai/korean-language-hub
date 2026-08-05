/**
 * Learning Domain — public entry point.
 * Other modules must import from `@/modules/learning`, never from internals.
 */

export type {
  Block​Content,
  BlockType,
  Bookmark,
  CalloutTone,
  ContentStatus,
  ContinueLearningEntry,
  Course,
  CourseModule,
  LearningProgress,
  LearningTarget,
  Lesson,
  LessonBlock,
  LessonContext,
  LessonUnit,
  OutlineLesson,
  ProgressStatus,
} from "@/modules/learning/types";

export { LEARNING_PERMISSIONS } from "@/modules/learning/config/permissions";
export type { LearningPermissionKey } from "@/modules/learning/config/permissions";

export {
  bookmarkInputSchema,
  continueLearningInputSchema,
  courseInputSchema,
  courseModuleInputSchema,
  lessonBlockInputSchema,
  lessonInputSchema,
  lessonUnitInputSchema,
  progressInputSchema,
} from "@/modules/learning/validation/schemas";
export type {
  BookmarkInput,
  ContinueLearningInput,
  CourseInput,
  CourseModuleInput,
  LessonBlockInput,
  LessonInput,
  LessonUnitInput,
  ProgressInput,
} from "@/modules/learning/validation/schemas";

export {
  learningKeys,
  useBookmarks,
  useClearContinueLearning,
  useCompleteLesson,
  useContinueTarget,
  useCourse,
  useCourses,
  useCreateCourse,
  useCreateLesson,
  useCreateModule,
  useCreateUnit,
  useDeleteCourse,
  useDeleteLesson,
  useDeleteModule,
  useDeleteUnit,
  useLearningScope,
  useLearningTenantId,
  useLessonBookmarks,
  useLessonContext,
  useLessonProgress,
  useLessons,
  useModule,
  useModules,
  useMyProgress,
  useRecentlyOpened,
  useRecordContinueLearning,
  useRemoveBookmark,
  useSaveLastPosition,
  useSetUnitCompletion,
  useToggleBookmark,
  useUpdateCourseStatus,
  useUpdateLessonStatus,
  useUpdateModuleStatus,
} from "@/modules/learning/hooks/useLearning";

export { computePercent } from "@/modules/learning/services/progress.service";

export { BlockList, BlockRenderer } from "@/modules/learning/components/BlockRenderer";
export {
  ContentStatusBadge,
  ProgressBar,
  ProgressStatusBadge,
} from "@/modules/learning/components/LearningBadges";
export { LessonReader } from "@/modules/learning/components/LessonReader";
export { ContinueLearningCard } from "@/modules/learning/components/ContinueLearningCard";
export {
  LessonNavigation,
  UnitNavigation,
} from "@/modules/learning/components/ReaderNavigation";
