/**
 * Learning Domain — domain types.
 * Mirrors the database schema but exposes camelCase, UI friendly shapes.
 */

export type ContentStatus = "draft" | "published" | "archived";
export type BlockType = "text" | "image" | "audio" | "video" | "quote" | "divider" | "callout";
export type ProgressStatus = "not_started" | "in_progress" | "completed";
export type LearningTarget = "lesson" | "unit";
export type CalloutTone = "info" | "success" | "warning" | "danger";

export interface Course {
  readonly id: string;
  readonly tenantId: string;
  readonly slug: string;
  readonly title: string;
  readonly summary: string | null;
  readonly level: string | null;
  readonly coverUrl: string | null;
  readonly status: ContentStatus;
  readonly position: number;
  readonly moduleCount: number;
}

export interface CourseModule {
  readonly id: string;
  readonly tenantId: string;
  readonly courseId: string;
  readonly title: string;
  readonly summary: string | null;
  readonly status: ContentStatus;
  readonly position: number;
  readonly lessonCount: number;
}

export interface Lesson {
  readonly id: string;
  readonly tenantId: string;
  readonly moduleId: string;
  readonly title: string;
  readonly summary: string | null;
  readonly estimatedMinutes: number;
  readonly status: ContentStatus;
  readonly position: number;
}

export interface LessonBlock {
  readonly id: string;
  readonly tenantId: string;
  readonly unitId: string;
  readonly type: BlockType;
  readonly content: BlockContent;
  readonly position: number;
}

export interface LessonUnit {
  readonly id: string;
  readonly tenantId: string;
  readonly lessonId: string;
  readonly title: string;
  readonly position: number;
  readonly blocks: readonly LessonBlock[];
}

/** Loosely typed block payload; the reader narrows per block type. */
export interface BlockContent {
  readonly text?: string;
  readonly url?: string;
  readonly alt?: string;
  readonly caption?: string;
  readonly author?: string;
  readonly title?: string;
  readonly tone?: CalloutTone;
}

export interface LearningProgress {
  readonly id: string;
  readonly tenantId: string;
  readonly userId: string;
  readonly targetType: LearningTarget;
  readonly lessonId: string;
  readonly unitId: string | null;
  readonly status: ProgressStatus;
  readonly percent: number;
  readonly lastPosition: number;
  readonly lastViewedAt: string;
}

export interface Bookmark {
  readonly id: string;
  readonly tenantId: string;
  readonly userId: string;
  readonly targetType: LearningTarget;
  readonly lessonId: string;
  readonly unitId: string | null;
  readonly note: string | null;
  readonly lessonTitle: string;
  readonly unitTitle: string | null;
  readonly createdAt: string;
}

export interface ContinueLearningEntry {
  readonly id: string;
  readonly tenantId: string;
  readonly userId: string;
  readonly courseId: string;
  readonly moduleId: string;
  readonly lessonId: string;
  readonly unitId: string | null;
  readonly lastPosition: number;
  readonly openedAt: string;
  readonly courseTitle: string;
  readonly lessonTitle: string;
}

/** A single lesson inside the flattened course outline. */
export interface OutlineLesson {
  readonly lessonId: string;
  readonly moduleId: string;
  readonly courseId: string;
  readonly title: string;
  readonly moduleTitle: string;
}

/** Everything the reader needs to render and navigate one lesson. */
export interface LessonContext {
  readonly course: Pick<Course, "id" | "title" | "slug">;
  readonly module: Pick<CourseModule, "id" | "title">;
  readonly lesson: Lesson;
  readonly units: readonly LessonUnit[];
  readonly outline: readonly OutlineLesson[];
  readonly previousLesson: OutlineLesson | null;
  readonly nextLesson: OutlineLesson | null;
}
