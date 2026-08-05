import { Link } from "@tanstack/react-router";
import { PlayCircle } from "lucide-react";

import { useContinueTarget } from "@/modules/learning/hooks/useLearning";
import { AppCard } from "@/shared/components/layout";
import { buttonClass } from "@/shared/components/form";

/** Continue button — resumes the most recently opened lesson. */
export function ContinueLearningCard() {
  const target = useContinueTarget();

  if (target.isLoading || !target.data) return null;

  return (
    <AppCard>
      <div className="flex flex-col gap-md sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-caption text-text-secondary">Lanjutkan belajar</p>
          <p className="truncate text-title text-text-primary">{target.data.lessonTitle}</p>
          <p className="truncate text-body-sm text-text-secondary">{target.data.courseTitle}</p>
        </div>
        <Link
          to="/learning/lessons/$lessonId"
          params={{ lessonId: target.data.lessonId }}
          className={buttonClass}
        >
          <PlayCircle className="size-4" aria-hidden="true" />
          Lanjutkan
        </Link>
      </div>
    </AppCard>
  );
}
