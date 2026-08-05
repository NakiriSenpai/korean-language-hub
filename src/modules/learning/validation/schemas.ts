/**
 * Learning Domain — input validation.
 * Every mutation validates here before it reaches the database.
 */

import { z } from "zod";

const trimmed = (max: number) =>
  z.string().trim().min(1, "Wajib diisi").max(max, `Maksimal ${max} karakter`);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Maksimal ${max} karakter`)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null));

const contentStatus = z.enum(["draft", "published", "archived"]);

export const courseInputSchema = z.object({
  title: trimmed(160),
  slug: trimmed(80).regex(/^[a-z0-9-]+$/, "Hanya huruf kecil, angka, dan tanda minus"),
  summary: optionalText(500),
  level: optionalText(64),
  coverUrl: optionalText(500),
  status: contentStatus.default("draft"),
  position: z.coerce.number().int().min(0).default(0),
});

export const courseModuleInputSchema = z.object({
  courseId: z.string().uuid("Course wajib dipilih"),
  title: trimmed(160),
  summary: optionalText(500),
  status: contentStatus.default("draft"),
  position: z.coerce.number().int().min(0).default(0),
});

export const lessonInputSchema = z.object({
  moduleId: z.string().uuid("Module wajib dipilih"),
  title: trimmed(160),
  summary: optionalText(500),
  estimatedMinutes: z.coerce
    .number()
    .int("Estimasi harus bilangan bulat")
    .min(1, "Minimal 1 menit")
    .max(600, "Maksimal 600 menit")
    .default(10),
  status: contentStatus.default("draft"),
  position: z.coerce.number().int().min(0).default(0),
});

export const lessonUnitInputSchema = z.object({
  lessonId: z.string().uuid("Lesson wajib dipilih"),
  title: trimmed(160),
  position: z.coerce.number().int().min(0).default(0),
});

export const lessonBlockInputSchema = z.object({
  unitId: z.string().uuid("Unit wajib dipilih"),
  type: z.enum(["text", "image", "audio", "video", "quote", "divider", "callout"]),
  content: z.record(z.string(), z.unknown()).default({}),
  position: z.coerce.number().int().min(0).default(0),
});

export const progressInputSchema = z.object({
  lessonId: z.string().uuid(),
  unitId: z.string().uuid().nullable().default(null),
  percent: z.coerce
    .number()
    .int("Persentase harus bilangan bulat")
    .min(0, "Persentase minimal 0")
    .max(100, "Persentase maksimal 100"),
  lastPosition: z.coerce.number().int().min(0).default(0),
  status: z.enum(["not_started", "in_progress", "completed"]).default("in_progress"),
});

export const bookmarkInputSchema = z
  .object({
    targetType: z.enum(["lesson", "unit"]),
    lessonId: z.string().uuid(),
    unitId: z.string().uuid().nullable().default(null),
    note: optionalText(280),
  })
  .refine((value) => value.targetType === "lesson" || value.unitId !== null, {
    message: "Bookmark unit membutuhkan unit",
    path: ["unitId"],
  });

export const continueLearningInputSchema = z.object({
  courseId: z.string().uuid(),
  moduleId: z.string().uuid(),
  lessonId: z.string().uuid(),
  unitId: z.string().uuid().nullable().default(null),
  lastPosition: z.coerce.number().int().min(0).default(0),
});

export type CourseInput = z.input<typeof courseInputSchema>;
export type CourseModuleInput = z.input<typeof courseModuleInputSchema>;
export type LessonInput = z.input<typeof lessonInputSchema>;
export type LessonUnitInput = z.input<typeof lessonUnitInputSchema>;
export type LessonBlockInput = z.input<typeof lessonBlockInputSchema>;
export type ProgressInput = z.input<typeof progressInputSchema>;
export type BookmarkInput = z.input<typeof bookmarkInputSchema>;
export type ContinueLearningInput = z.input<typeof continueLearningInputSchema>;
