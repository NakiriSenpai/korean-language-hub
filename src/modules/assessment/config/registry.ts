/**
 * Assessment Domain — registry of question types, skills, and assessment types.
 * Single source of labels and behaviour flags used by validation, services, and UI.
 */

import {
  BookOpenCheck,
  CheckSquare,
  Headphones,
  ListChecks,
  PenLine,
  ToggleLeft,
  Trophy,
  type LucideIcon,
} from "lucide-react";

import type { AssessmentType, QuestionSkill, QuestionType } from "@/modules/assessment/types";

export interface QuestionTypeDefinition {
  readonly type: QuestionType;
  readonly label: string;
  readonly description: string;
  readonly icon: LucideIcon;
  /** Choice based types store their options in question_choices. */
  readonly hasChoices: boolean;
  /** Exactly one correct answer allowed. */
  readonly singleAnswer: boolean;
  /** Options are fixed by the type (true / false). */
  readonly fixedChoices: readonly string[] | null;
}

export const QUESTION_TYPES: readonly QuestionTypeDefinition[] = [
  {
    type: "multiple_choice",
    label: "Pilihan Ganda",
    description: "Satu jawaban benar dari beberapa pilihan.",
    icon: ListChecks,
    hasChoices: true,
    singleAnswer: true,
    fixedChoices: null,
  },
  {
    type: "multiple_response",
    label: "Jawaban Ganda",
    description: "Lebih dari satu jawaban benar diperbolehkan.",
    icon: CheckSquare,
    hasChoices: true,
    singleAnswer: false,
    fixedChoices: null,
  },
  {
    type: "true_false",
    label: "Benar / Salah",
    description: "Pernyataan yang dinilai benar atau salah.",
    icon: ToggleLeft,
    hasChoices: true,
    singleAnswer: true,
    fixedChoices: ["Benar", "Salah"],
  },
  {
    type: "short_answer",
    label: "Isian Singkat",
    description: "Peserta menuliskan jawaban singkat sesuai kunci.",
    icon: PenLine,
    hasChoices: false,
    singleAnswer: true,
    fixedChoices: null,
  },
] as const;

const TYPE_MAP = new Map(QUESTION_TYPES.map((item) => [item.type, item]));

export function getQuestionType(type: QuestionType): QuestionTypeDefinition {
  const found = TYPE_MAP.get(type);
  if (!found) throw new Error(`Unknown question type: ${type}`);
  return found;
}

export interface QuestionSkillDefinition {
  readonly skill: QuestionSkill;
  readonly label: string;
  readonly icon: LucideIcon;
  /** Listening questions must carry audio; reading questions must carry content. */
  readonly requiresAudio: boolean;
  readonly requiresPassage: boolean;
}

export const QUESTION_SKILLS: readonly QuestionSkillDefinition[] = [
  {
    skill: "reading",
    label: "Reading",
    icon: BookOpenCheck,
    requiresAudio: false,
    requiresPassage: true,
  },
  {
    skill: "listening",
    label: "Listening",
    icon: Headphones,
    requiresAudio: true,
    requiresPassage: false,
  },
] as const;

const SKILL_MAP = new Map(QUESTION_SKILLS.map((item) => [item.skill, item]));

export function getQuestionSkill(skill: QuestionSkill): QuestionSkillDefinition {
  const found = SKILL_MAP.get(skill);
  if (!found) throw new Error(`Unknown question skill: ${skill}`);
  return found;
}

export interface AssessmentTypeDefinition {
  readonly type: AssessmentType;
  readonly label: string;
  readonly description: string;
  readonly icon: LucideIcon;
}

export const ASSESSMENT_TYPES: readonly AssessmentTypeDefinition[] = [
  {
    type: "exam",
    label: "Exam",
    description: "Ujian resmi dengan durasi dan nilai lulus.",
    icon: Trophy,
  },
  {
    type: "quiz",
    label: "Quiz",
    description: "Kuis singkat untuk mengukur pemahaman harian.",
    icon: ListChecks,
  },
  {
    type: "practice",
    label: "Practice",
    description: "Latihan mandiri tanpa tekanan nilai.",
    icon: PenLine,
  },
  {
    type: "tryout",
    label: "Try Out",
    description: "Simulasi penuh menyerupai ujian EPS-TOPIK.",
    icon: BookOpenCheck,
  },
] as const;

const ASSESSMENT_TYPE_MAP = new Map(ASSESSMENT_TYPES.map((item) => [item.type, item]));

export function getAssessmentType(type: AssessmentType): AssessmentTypeDefinition {
  const found = ASSESSMENT_TYPE_MAP.get(type);
  if (!found) throw new Error(`Unknown assessment type: ${type}`);
  return found;
}

export const LANGUAGE_OPTIONS: readonly { readonly value: string; readonly label: string }[] = [
  { value: "ko", label: "Korea" },
  { value: "id", label: "Indonesia" },
  { value: "en", label: "Inggris" },
] as const;
