import { useState } from "react";
import { ListChecks, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { QuestionFilters } from "@/modules/assessment/components/QuestionFilters";
import {
  QuestionSkillBadge,
  QuestionTypeBadge,
  VersionBadge,
} from "@/modules/assessment/components/AssessmentBadges";
import {
  useAddAssessmentQuestion,
  useQuestionCategories,
  useQuestions,
} from "@/modules/assessment/hooks/useAssessment";
import { QuestionService } from "@/modules/assessment/services/question.service";
import type { QuestionFilters as Filters } from "@/modules/assessment/types";
import { useTenant } from "@/modules/identity";
import { buttonClass, ghostButtonClass } from "@/shared/components/form";
import { AppCard, AppSection, Stack } from "@/shared/components/layout";
import { EmptyState } from "@/shared/components/shell";
import { toUserMessage } from "@/shared/platform";

export interface QuestionPickerProps {
  readonly assessmentId: string;
  /** Question ids already attached, hidden from the picker. */
  readonly excludeIds: readonly string[];
  readonly nextPosition: number;
}

/**
 * Question Picker (Work Package 6).
 * Picks a published bank question and pins the assessment to its current version.
 */
export function QuestionPicker({ assessmentId, excludeIds, nextPosition }: QuestionPickerProps) {
  const { tenant } = useTenant();
  const [filters, setFilters] = useState<Filters>({ status: "published" });
  const [pendingId, setPendingId] = useState<string | null>(null);

  const questions = useQuestions(filters);
  const categories = useQuestionCategories();
  const addQuestion = useAddAssessmentQuestion(assessmentId);

  const available = (questions.data ?? []).filter((item) => !excludeIds.includes(item.id));

  const onPick = async (questionId: string) => {
    if (!tenant?.id) return;
    setPendingId(questionId);
    try {
      const detail = await QuestionService.get(tenant.id, questionId);
      const versionId = detail.latestVersion?.id;
      if (!versionId) throw new Error("Versi soal tidak ditemukan.");
      await addQuestion.mutateAsync({
        questionId,
        questionVersionId: versionId,
        position: nextPosition,
        points: 1,
      });
      toast.success(`Soal ${detail.publicId} ditambahkan (v${detail.latestVersion?.version}).`);
    } catch (cause) {
      toast.error(toUserMessage(cause));
    } finally {
      setPendingId(null);
    }
  };

  return (
    <AppSection
      title="Ambil soal dari Question Bank"
      description="Asesmen menyimpan referensi ke versi soal, bukan salinan kontennya."
    >
      <Stack gap="md">
        <QuestionFilters
          value={filters}
          onChange={setFilters}
          categories={categories.data ?? []}
          idPrefix="picker"
        />

        {questions.isPending ? (
          <p className="text-body-sm text-text-secondary">Memuat soal…</p>
        ) : available.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title="Tidak ada soal tersedia"
            description="Ubah filter atau buat soal baru di Question Studio."
          />
        ) : (
          <Stack gap="sm">
            {available.map((question) => (
              <AppCard key={question.id}>
                <div className="flex flex-col gap-sm sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-xs">
                      <span className="text-caption text-text-secondary">{question.publicId}</span>
                      <QuestionTypeBadge type={question.type} />
                      <QuestionSkillBadge skill={question.skill} />
                      <VersionBadge version={question.currentVersion} />
                    </div>
                    <p className="mt-xs truncate text-body-sm text-text-primary">
                      {question.latestVersion?.prompt ?? "—"}
                    </p>
                  </div>

                  <button
                    type="button"
                    className={pendingId === question.id ? ghostButtonClass : buttonClass}
                    onClick={() => void onPick(question.id)}
                    disabled={pendingId !== null}
                  >
                    {pendingId === question.id ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Plus className="size-4" aria-hidden="true" />
                    )}
                    Tambah
                  </button>
                </div>
              </AppCard>
            ))}
          </Stack>
        )}
      </Stack>
    </AppSection>
  );
}
