import { Link } from "@tanstack/react-router";

import {
  QuestionSkillBadge,
  QuestionTypeBadge,
  VersionBadge,
} from "@/modules/assessment/components/AssessmentBadges";
import type { Question } from "@/modules/assessment/types";
import { DIFFICULTY_LABEL } from "@/modules/knowledge/config/kinds";
import { AppCard, Stack } from "@/shared/components/layout";

const STATUS_LABEL: Record<Question["status"], string> = {
  draft: "Draf",
  published: "Terbit",
  archived: "Arsip",
};

/** Question Bank row (Work Package 2). */
export function QuestionCard({ question }: { question: Question }) {
  return (
    <AppCard>
      <Stack gap="sm">
        <div className="flex flex-wrap items-center gap-xs">
          <span className="text-caption text-text-secondary">{question.publicId}</span>
          <QuestionTypeBadge type={question.type} />
          <QuestionSkillBadge skill={question.skill} />
          <VersionBadge version={question.currentVersion} />
        </div>

        <Link
          to="/assessment/questions/$questionId"
          params={{ questionId: question.id }}
          className="text-title text-text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {question.latestVersion?.prompt ?? question.publicId}
        </Link>

        <p className="text-caption text-text-secondary">
          {DIFFICULTY_LABEL[question.difficulty]} · {STATUS_LABEL[question.status]}
          {question.category ? ` · ${question.category}` : ""}
        </p>
      </Stack>
    </AppCard>
  );
}
