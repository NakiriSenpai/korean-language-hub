import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { History } from "lucide-react";

import {
  ASSESSMENT_PERMISSIONS,
  QuestionEditor,
  QuestionPreview,
  VersionBadge,
  useQuestion,
  useQuestionVersions,
  useUpdateQuestion,
} from "@/modules/assessment";
import { PermissionGate } from "@/modules/identity";
import { ghostButtonClass } from "@/shared/components/form";
import { AppCard, AppSection, Stack } from "@/shared/components/layout";
import { toUserMessage } from "@/shared/platform";

export const Route = createFileRoute("/_shell/assessment/questions/$questionId")({
  head: () => ({
    meta: [
      { title: "Detail Soal — Question Bank | Hangeul LPK Platform" },
      {
        name: "description",
        content: "Pratinjau soal, riwayat versi, dan penyuntingan yang selalu membuat versi baru.",
      },
      { property: "og:title", content: "Detail Soal — Question Bank" },
      {
        property: "og:description",
        content: "Versi lama tetap utuh sehingga asesmen yang sudah terbit tidak ikut berubah.",
      },
    ],
  }),
  component: QuestionDetailPage,
});

function QuestionDetailPage() {
  const { questionId } = Route.useParams();
  const question = useQuestion(questionId);
  const versions = useQuestionVersions(questionId);
  const update = useUpdateQuestion();
  const [editing, setEditing] = useState(false);

  if (question.isPending) {
    return <p className="text-body-sm text-text-secondary">Memuat soal…</p>;
  }

  if (question.isError || !question.data) {
    return (
      <p role="alert" className="text-body-sm text-danger">
        {toUserMessage(question.error)}
      </p>
    );
  }

  const detail = question.data;
  const latest = detail.latestVersion;

  return (
    <Stack gap="lg">
      <AppSection
        title={detail.publicId}
        description="Metadata soal mengikuti versi terbaru; versi lama tetap tersimpan."
        actions={
          <PermissionGate required={[ASSESSMENT_PERMISSIONS.questionWrite]} fallback={null}>
            <button
              type="button"
              className={ghostButtonClass}
              onClick={() => setEditing((value) => !value)}
            >
              {editing ? "Batal" : "Sunting soal"}
            </button>
          </PermissionGate>
        }
      >
        {latest ? <QuestionPreview version={latest} /> : null}
      </AppSection>

      {editing && latest ? (
        <AppSection
          title="Sunting soal"
          description="Menyimpan tidak menimpa versi lama — sistem membuat versi baru."
        >
          <QuestionEditor
            version={latest}
            publicId={detail.publicId}
            status={detail.status}
            submitLabel="Simpan versi baru"
            successMessage="Versi baru soal tersimpan."
            pending={update.isPending}
            onSubmit={async (input) => {
              await update.mutateAsync({ questionId, input });
              setEditing(false);
            }}
          />
        </AppSection>
      ) : null}

      <AppSection title="Riwayat versi" description="Setiap versi bersifat permanen.">
        <Stack gap="sm">
          {(versions.data ?? []).map((version) => (
            <AppCard key={version.id}>
              <div className="flex flex-wrap items-center gap-sm">
                <History className="size-4 text-text-secondary" aria-hidden="true" />
                <VersionBadge version={version.version} />
                <span className="min-w-0 flex-1 truncate text-body-sm text-text-primary">
                  {version.prompt}
                </span>
                <span className="text-caption text-text-secondary">
                  {new Date(version.createdAt).toLocaleString("id-ID")}
                </span>
              </div>
            </AppCard>
          ))}
        </Stack>
      </AppSection>
    </Stack>
  );
}
