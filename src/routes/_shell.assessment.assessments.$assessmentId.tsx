import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ListChecks, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  ASSESSMENT_PERMISSIONS,
  AssessmentForm,
  AssessmentTypeBadge,
  QuestionPicker,
  QuestionSkillBadge,
  QuestionTypeBadge,
  VersionBadge,
  useAssessment,
  useAssessmentQuestions,
  useAssessmentSnapshots,
  usePublishAssessment,
  useRemoveAssessmentQuestion,
  useUpdateAssessment,
  useUpdateAssessmentQuestion,
} from "@/modules/assessment";
import { PermissionGate } from "@/modules/identity";
import { TextInput, buttonClass, ghostButtonClass } from "@/shared/components/form";
import { AppCard, AppSection, Stack } from "@/shared/components/layout";
import { EmptyState } from "@/shared/components/shell";
import { toUserMessage } from "@/shared/platform";

export const Route = createFileRoute("/_shell/assessment/assessments/$assessmentId")({
  head: () => ({
    meta: [
      { title: "Detail Asesmen — Assessment Studio | Hangeul LPK Platform" },
      {
        name: "description",
        content: "Susun daftar soal, atur bobot, dan terbitkan asesmen sebagai snapshot permanen.",
      },
      { property: "og:title", content: "Detail Asesmen — Assessment Studio" },
      {
        property: "og:description",
        content: "Snapshot membekukan isi soal sehingga perubahan bank soal tidak memengaruhinya.",
      },
    ],
  }),
  component: AssessmentDetailPage,
});

function AssessmentDetailPage() {
  const { assessmentId } = Route.useParams();
  const assessment = useAssessment(assessmentId);
  const questions = useAssessmentQuestions(assessmentId);
  const snapshots = useAssessmentSnapshots(assessmentId);
  const update = useUpdateAssessment();
  const updateQuestion = useUpdateAssessmentQuestion();
  const removeQuestion = useRemoveAssessmentQuestion();
  const publish = usePublishAssessment();

  if (assessment.isPending) {
    return <p className="text-body-sm text-text-secondary">Memuat asesmen…</p>;
  }

  if (assessment.isError || !assessment.data) {
    return (
      <p role="alert" className="text-body-sm text-danger">
        {toUserMessage(assessment.error)}
      </p>
    );
  }

  const detail = assessment.data;
  const attached = questions.data ?? [];
  const totalPoints = attached.reduce((sum, item) => sum + item.points, 0);

  const onPublish = async () => {
    try {
      const snapshot = await publish.mutateAsync(assessmentId);
      toast.success(`Asesmen diterbitkan sebagai snapshot v${snapshot.version}.`);
    } catch (cause) {
      toast.error(toUserMessage(cause));
    }
  };

  return (
    <Stack gap="lg">
      <div>
        <Link
          to="/assessment/assessments"
          className="inline-flex min-h-11 items-center gap-xs text-body-sm text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Kembali ke daftar asesmen
        </Link>
      </div>

      <AppSection
        title={detail.title}
        description={detail.description ?? "Asesmen tanpa deskripsi."}
        actions={
          <PermissionGate required={[ASSESSMENT_PERMISSIONS.assessmentWrite]} fallback={null}>
            <button
              type="button"
              className={buttonClass}
              onClick={() => void onPublish()}
              disabled={publish.isPending || attached.length === 0}
            >
              {publish.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : null}
              Terbitkan snapshot
            </button>
          </PermissionGate>
        }
      >
        <div className="flex flex-wrap items-center gap-xs">
          <AssessmentTypeBadge type={detail.type} />
          <span className="text-caption text-text-secondary">
            {attached.length} soal · {totalPoints} poin · {detail.durationMinutes} menit
            {detail.randomizeQuestions ? " · soal diacak" : ""}
            {detail.randomizeChoices ? " · pilihan diacak" : ""}
          </span>
        </div>
      </AppSection>

      <PermissionGate required={[ASSESSMENT_PERMISSIONS.assessmentWrite]} fallback={null}>
        <AppSection title="Pengaturan asesmen" description="Ubah metadata dan aturan pengacakan.">
          <AssessmentForm
            assessment={detail}
            submitLabel="Simpan perubahan"
            successMessage="Perubahan asesmen tersimpan."
            pending={update.isPending}
            onSubmit={(input) => update.mutateAsync({ assessmentId, input })}
          />
        </AppSection>
      </PermissionGate>

      <AppSection title="Soal dalam asesmen" description="Urutan dan bobot tiap soal.">
        {attached.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title="Belum ada soal"
            description="Tambahkan soal dari Question Bank di bawah."
          />
        ) : (
          <Stack gap="sm">
            {attached.map((item) => (
              <AppCard key={item.id}>
                <div className="flex flex-col gap-sm sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-xs">
                      <span className="text-caption text-text-secondary">{item.publicId}</span>
                      <QuestionTypeBadge type={item.type} />
                      <QuestionSkillBadge skill={item.skill} />
                      <VersionBadge version={item.version} />
                    </div>
                    <p className="mt-xs truncate text-body-sm text-text-primary">{item.prompt}</p>
                  </div>

                  <div className="flex items-center gap-sm">
                    <label className="flex items-center gap-xs text-caption text-text-secondary">
                      Poin
                      <TextInput
                        type="number"
                        min={1}
                        max={100}
                        className="w-20"
                        defaultValue={item.points}
                        onBlur={(event) =>
                          void updateQuestion.mutateAsync({
                            id: item.id,
                            patch: { points: Number(event.target.value) || 1 },
                          })
                        }
                      />
                    </label>
                    <button
                      type="button"
                      className={ghostButtonClass}
                      onClick={() => void removeQuestion.mutateAsync(item.id)}
                      aria-label={`Hapus soal ${item.publicId}`}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </AppCard>
            ))}
          </Stack>
        )}
      </AppSection>

      <PermissionGate required={[ASSESSMENT_PERMISSIONS.assessmentWrite]} fallback={null}>
        <QuestionPicker
          assessmentId={assessmentId}
          excludeIds={attached.map((item) => item.questionId)}
          nextPosition={attached.length}
        />
      </PermissionGate>

      <AppSection
        title="Riwayat snapshot"
        description="Snapshot bersifat permanen dan tidak berubah saat bank soal disunting."
      >
        <Stack gap="sm">
          {(snapshots.data ?? []).length === 0 ? (
            <p className="text-body-sm text-text-secondary">Belum ada snapshot.</p>
          ) : (
            (snapshots.data ?? []).map((snapshot) => (
              <AppCard key={snapshot.id}>
                <div className="flex flex-wrap items-center gap-sm">
                  <VersionBadge version={snapshot.version} />
                  <span className="text-body-sm text-text-primary">
                    {snapshot.questionCount} soal · {snapshot.totalPoints} poin
                  </span>
                  <span className="text-caption text-text-secondary">
                    {new Date(snapshot.createdAt).toLocaleString("id-ID")}
                  </span>
                </div>
              </AppCard>
            ))
          )}
        </Stack>
      </AppSection>
    </Stack>
  );
}
