/**
 * Assessment Domain — input validation (Work Package 4).
 *
 * Rules enforced here, before any write reaches the database:
 * - choice based questions need at least 2 choices;
 * - at least one correct answer;
 * - single answer types may not have more than one correct answer;
 * - listening questions require audio;
 * - reading questions require content (passage or prompt body).
 */

import { z } from "zod";

import { getQuestionType } from "@/modules/assessment/config/registry";

const trimmed = (max: number, label = "Wajib diisi") =>
  z.string().trim().min(1, label).max(max, `Maksimal ${max} karakter`);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Maksimal ${max} karakter`)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null));

export const questionTypeSchema = z.enum([
  "multiple_choice",
  "multiple_response",
  "true_false",
  "short_answer",
]);
export const questionSkillSchema = z.enum(["reading", "listening"]);
export const assessmentTypeSchema = z.enum(["exam", "quiz", "practice", "tryout"]);
export const contentStatusSchema = z.enum(["draft", "published", "archived"]);
export const difficultySchema = z.enum(["beginner", "intermediate", "advanced"]);

export const questionChoiceInputSchema = z.object({
  label: optionalText(10),
  content: trimmed(500, "Isi pilihan wajib diisi"),
  isCorrect: z.boolean().default(false),
  position: z.coerce.number().int().min(0).default(0),
});

const baseQuestionInputSchema = z.object({
  publicId: z
    .string()
    .trim()
    .max(40)
    .regex(/^[A-Za-z0-9-]*$/, "Hanya huruf, angka, dan tanda minus")
    .optional()
    .transform((value) => (value && value.length > 0 ? value.toUpperCase() : null)),
  type: questionTypeSchema,
  skill: questionSkillSchema.default("reading"),
  difficulty: difficultySchema.default("beginner"),
  status: contentStatusSchema.default("draft"),
  prompt: trimmed(2000, "Pertanyaan wajib diisi"),
  passage: optionalText(8000),
  audioUrl: optionalText(1000),
  explanation: optionalText(4000),
  answerKey: optionalText(500),
  category: optionalText(120),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  source: optionalText(200),
  language: z.string().trim().min(2).max(10).default("ko"),
  choices: z.array(questionChoiceInputSchema).max(10).default([]),
});

/** Applies the Work Package 4 rules that depend on more than one field. */
export const questionInputSchema = baseQuestionInputSchema.superRefine((value, ctx) => {
  const definition = getQuestionType(value.type);

  if (value.skill === "listening" && !value.audioUrl) {
    ctx.addIssue({
      code: "custom",
      path: ["audioUrl"],
      message: "Soal listening wajib memiliki audio.",
    });
  }

  if (value.skill === "reading" && !value.passage && value.prompt.trim().length < 10) {
    ctx.addIssue({
      code: "custom",
      path: ["passage"],
      message: "Soal reading wajib memiliki konten bacaan.",
    });
  }

  if (definition.hasChoices) {
    if (value.choices.length < 2) {
      ctx.addIssue({
        code: "custom",
        path: ["choices"],
        message: "Minimal 2 pilihan jawaban.",
      });
      return;
    }
    const correct = value.choices.filter((choice) => choice.isCorrect).length;
    if (correct < 1) {
      ctx.addIssue({
        code: "custom",
        path: ["choices"],
        message: "Minimal 1 jawaban benar.",
      });
    }
    if (definition.singleAnswer && correct > 1) {
      ctx.addIssue({
        code: "custom",
        path: ["choices"],
        message: "Tipe ini hanya boleh memiliki satu jawaban benar.",
      });
    }
    return;
  }

  if (!value.answerKey) {
    ctx.addIssue({
      code: "custom",
      path: ["answerKey"],
      message: "Kunci jawaban wajib diisi untuk isian singkat.",
    });
  }
});

export const assessmentInputSchema = z.object({
  title: trimmed(200),
  slug: trimmed(120).regex(/^[a-z0-9-]+$/, "Hanya huruf kecil, angka, dan tanda minus"),
  description: optionalText(1000),
  type: assessmentTypeSchema.default("quiz"),
  status: contentStatusSchema.default("draft"),
  difficulty: difficultySchema.default("beginner"),
  durationMinutes: z.coerce.number().int().min(0).max(600).default(0),
  passingScore: z.coerce.number().int().min(0).max(100).default(0),
  randomizeQuestions: z.boolean().default(false),
  randomizeChoices: z.boolean().default(false),
});

export const assessmentQuestionInputSchema = z.object({
  questionId: z.string().uuid("Soal tidak valid"),
  questionVersionId: z.string().uuid("Versi soal tidak valid"),
  position: z.coerce.number().int().min(0).default(0),
  points: z.coerce.number().int().min(1).max(100).default(1),
});

export const questionFiltersSchema = z.object({
  keyword: z.string().trim().max(120).optional(),
  difficulty: z.union([difficultySchema, z.literal("")]).optional(),
  category: z.string().trim().max(120).optional(),
  tag: z.string().trim().max(40).optional(),
  type: z.union([questionTypeSchema, z.literal("")]).optional(),
  skill: z.union([questionSkillSchema, z.literal("")]).optional(),
  language: z.string().trim().max(10).optional(),
  status: z.union([contentStatusSchema, z.literal("")]).optional(),
});

export type QuestionInput = z.input<typeof questionInputSchema>;
export type QuestionChoiceInput = z.input<typeof questionChoiceInputSchema>;
export type AssessmentInput = z.input<typeof assessmentInputSchema>;
export type AssessmentQuestionInput = z.input<typeof assessmentQuestionInputSchema>;
export type QuestionFiltersInput = z.input<typeof questionFiltersSchema>;
