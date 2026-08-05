import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardList } from "lucide-react";

import {
  ASSESSMENT_PERMISSIONS,
  AssessmentForm,
  AssessmentTypeBadge,
  useAssessments,
  useCreateAssessment,
} from "@/modules/assessment";
import { PermissionGate } from "@/modules/identity";
import { DIFFICULTY_LABEL } from "@/modules/knowledge/config/kinds";
import { ghostButtonClass } from "@/shared/components/form";
import { AppCard, AppSection, Stack } from "@/shared/components/layout";
import { EmptyState } from "@/shared/components/shell";
import { toUserMessage } from "@/shared/platform";

export const Route = createFileRoute("/_shell/assessment/assessments/")({
  head: () => ({
    meta: [
      { title: "Asesmen — Assessment Studio | Hangeul LPK Platform" },
      {
        name: "description",
        content: "Susun exam, quiz, practice, dan try out dari soal yang sudah ada di bank soal.",
      },
      { property: "og:title", content: "Asesmen — Assessment Studio" },
      {
        property: "og:description",
        content: "Durasi, nilai lulus, pengacakan soal, dan snapshot saat penerbitan.",
      },
    ],
  }),
  component: AssessmentListPage,
});

const STATUS_LABEL = { draft: "Draf", published: "Terbit", archived: "Arsip" } as const;

function AssessmentListPage() {
  const assessments = useAssessments();
  const create = useCreateAssessment();
  const [creating, setCreating] = useState(false);

  return (
    <Stack gap="lg">
      <AppSection
        title="Daftar asesmen"
        description="Setiap asesmen hanya menyimpan referensi ke versi soal."
        actions={
          <PermissionGate required={[ASSESSMENT_PERMISSIONS.assessmentWrite]} fallback={null}>
            <button
              type="button"
              className={ghostButtonClass}
              onClick={() => setCreating((value) => !value)}
            >
              {creating ? "Tutup" : "Asesmen baru"}
            </button>
          </PermissionGate>
        }
      >
        <Stack gap="md">
          {creating ? (
            <AssessmentForm
              submitLabel="Buat asesmen"
              successMessage="Asesmen dibuat sebagai draf."
              pending={create.isPending}
              onSubmit={async (input) => {
                await create.mutateAsync(input);
                setCreating(false);
              }}
            />
          ) : null}

          {assessments.isPending ? (
            <p className="text-body-sm text-text-secondary">Memuat asesmen…</p>
          ) : assessments.isError ? (
            <p role="alert" className="text-body-sm text-danger">
              {toUserMessage(assessments.error)}
            </p>
          ) : assessments.data.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="Belum ada asesmen"
              description="Buat exam, quiz, practice, atau try out lalu tarik soal dari Question Bank."
            />
          ) : (
            <Stack gap="sm">
              {assessments.data.map((assessment) => (
                <AppCard key={assessment.id}>
                  <Stack gap="xs">
                    <div className="flex flex-wrap items-center gap-xs">
                      <AssessmentTypeBadge type={assessment.type} />
                      <span className="text-caption text-text-secondary">
                        {STATUS_LABEL[assessment.status]} · {DIFFICULTY_LABEL[assessment.difficulty]}
                      </span>
                    </div>
                    <Link
                      to="/assessment/assessments/$assessmentId"
                      params={{ assessmentId: assessment.id }}
                      className="text-title text-text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {assessment.title}
                    </Link>
                    <p className="text-caption text-text-secondary">
                      {assessment.durationMinutes} menit · nilai lulus {assessment.passingScore}
                      {assessment.publishedVersion > 0
                        ? ` · snapshot v${assessment.publishedVersion}`
                        : ""}
                    </p>
                  </Stack>
                </AppCard>
              ))}
            </Stack>
          )}
        </Stack>
      </AppSection>
    </Stack>
  );
}
