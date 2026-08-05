import { cn } from "@/lib/utils";
import {
  getAssessmentType,
  getQuestionSkill,
  getQuestionType,
} from "@/modules/assessment/config/registry";
import type { AssessmentType, QuestionSkill, QuestionType } from "@/modules/assessment/types";

const chip = "inline-flex items-center gap-3xs rounded-full border px-sm py-3xs text-caption";

export function QuestionTypeBadge({ type }: { type: QuestionType }) {
  const definition = getQuestionType(type);
  const Icon = definition.icon;
  return (
    <span className={cn(chip, "border-border bg-muted text-text-secondary")}>
      <Icon className="size-3.5" aria-hidden="true" />
      {definition.label}
    </span>
  );
}

export function QuestionSkillBadge({ skill }: { skill: QuestionSkill }) {
  const definition = getQuestionSkill(skill);
  const Icon = definition.icon;
  return (
    <span className={cn(chip, "border-primary/40 bg-primary/10 text-primary")}>
      <Icon className="size-3.5" aria-hidden="true" />
      {definition.label}
    </span>
  );
}

export function AssessmentTypeBadge({ type }: { type: AssessmentType }) {
  const definition = getAssessmentType(type);
  const Icon = definition.icon;
  return (
    <span className={cn(chip, "border-primary/40 bg-primary/10 text-primary")}>
      <Icon className="size-3.5" aria-hidden="true" />
      {definition.label}
    </span>
  );
}

export function VersionBadge({ version }: { version: number }) {
  return (
    <span className={cn(chip, "border-border bg-surface text-text-secondary")}>v{version}</span>
  );
}
