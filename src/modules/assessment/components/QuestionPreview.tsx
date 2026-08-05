import { QuestionSkillBadge, QuestionTypeBadge, VersionBadge } from "@/modules/assessment/components/AssessmentBadges";
import type { QuestionVersion } from "@/modules/assessment/types";
import { DIFFICULTY_LABEL } from "@/modules/knowledge/config/kinds";
import { AppCard, Stack } from "@/shared/components/layout";

/** Read-only rendering of one immutable question version. */
export function QuestionPreview({
  version,
  showAnswers = true,
}: {
  readonly version: QuestionVersion;
  readonly showAnswers?: boolean;
}) {
  return (
    <AppCard>
      <Stack gap="md">
        <div className="flex flex-wrap items-center gap-xs">
          <QuestionTypeBadge type={version.type} />
          <QuestionSkillBadge skill={version.skill} />
          <VersionBadge version={version.version} />
          <span className="text-caption text-text-secondary">
            {DIFFICULTY_LABEL[version.difficulty]}
          </span>
        </div>

        {version.passage ? (
          <p className="whitespace-pre-line rounded-md bg-muted p-md text-body-sm text-text-secondary">
            {version.passage}
          </p>
        ) : null}

        {version.audioUrl ? (
          <audio controls src={version.audioUrl} className="w-full">
            <track kind="captions" />
          </audio>
        ) : null}

        <p className="whitespace-pre-line text-body text-text-primary">{version.prompt}</p>

        {version.choices.length > 0 ? (
          <ol className="flex flex-col gap-xs">
            {version.choices.map((choice, index) => (
              <li
                key={choice.id}
                className={
                  showAnswers && choice.isCorrect
                    ? "rounded-md border border-primary/40 bg-primary/10 px-md py-sm text-body-sm text-text-primary"
                    : "rounded-md border border-border px-md py-sm text-body-sm text-text-secondary"
                }
              >
                <span className="mr-xs font-medium">
                  {choice.label ?? String.fromCharCode(65 + index)}.
                </span>
                {choice.content}
              </li>
            ))}
          </ol>
        ) : null}

        {showAnswers && version.answerKey ? (
          <p className="text-body-sm text-text-primary">
            <span className="text-text-secondary">Kunci jawaban: </span>
            {version.answerKey}
          </p>
        ) : null}

        {showAnswers && version.explanation ? (
          <p className="whitespace-pre-line text-body-sm text-text-secondary">
            {version.explanation}
          </p>
        ) : null}
      </Stack>
    </AppCard>
  );
}
