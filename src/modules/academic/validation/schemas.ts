/**
 * Academic Domain — input validation.
 * Every mutation validates here before it reaches the database.
 */

import { z } from "zod";

const trimmed = (max: number) =>
  z.string().trim().min(1, "Wajib diisi").max(max, `Maksimal ${max} karakter`);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD");
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Maksimal ${max} karakter`)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null));

export const academicPeriodInputSchema = z
  .object({
    name: trimmed(120),
    code: trimmed(32).regex(/^[A-Za-z0-9._-]+$/, "Hanya huruf, angka, titik, minus, underscore"),
    startsOn: isoDate,
    endsOn: isoDate,
    status: z.enum(["draft", "active", "archived"]).default("draft"),
  })
  .refine((value) => value.endsOn > value.startsOn, {
    message: "Tanggal selesai harus setelah tanggal mulai",
    path: ["endsOn"],
  });

export const studyGroupInputSchema = z.object({
  periodId: z.string().uuid("Periode akademik wajib dipilih"),
  name: trimmed(120),
  code: trimmed(32),
  level: optionalText(64),
  room: optionalText(64),
  capacity: z.coerce
    .number()
    .int("Kapasitas harus bilangan bulat")
    .min(1, "Minimal 1")
    .max(500, "Maksimal 500"),
  status: z.enum(["draft", "active", "archived"]).default("draft"),
});

export const studentProfileInputSchema = z.object({
  studentNumber: trimmed(32),
  fullName: trimmed(120),
  birthDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD")
    .optional()
    .or(z.literal(""))
    .transform((value) => (value && value.length > 0 ? value : null)),
  phone: optionalText(32),
  email: z
    .string()
    .trim()
    .max(255)
    .email("Email tidak valid")
    .optional()
    .or(z.literal(""))
    .transform((value) => (value && value.length > 0 ? value : null)),
  notes: optionalText(500),
});

export const enrollmentInputSchema = z.object({
  studyGroupId: z.string().uuid("Kelas wajib dipilih"),
  studentProfileId: z.string().uuid("Peserta wajib dipilih"),
  enrolledOn: isoDate.optional(),
});

export const enrollmentStatusSchema = z.enum(["active", "completed", "suspended", "dropped"]);

export const teacherAssignmentInputSchema = z.object({
  studyGroupId: z.string().uuid("Kelas wajib dipilih"),
  teacherUserId: z.string().uuid("Pengajar wajib dipilih"),
  assignmentRole: z.enum(["lead", "assistant"]).default("lead"),
});

export type AcademicPeriodInput = z.input<typeof academicPeriodInputSchema>;
export type StudyGroupInput = z.input<typeof studyGroupInputSchema>;
export type StudentProfileInput = z.input<typeof studentProfileInputSchema>;
export type EnrollmentInput = z.input<typeof enrollmentInputSchema>;
export type TeacherAssignmentInput = z.input<typeof teacherAssignmentInputSchema>;
