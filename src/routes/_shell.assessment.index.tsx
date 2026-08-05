import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ListChecks, Plus } from "lucide-react";

import {
  ASSESSMENT_PERMISSIONS,
  QuestionCard,
  QuestionFilters,
  useQuestionCategories,
  useQuestions,
} from "@/modules/assessment";
import type { QuestionFilterValues } from "@/modules/assessment";
import { PermissionGate } from "@/modules/identity";
import { buttonClass } from "@/shared/components/form";
import { AppSection, Stack } from "@/shared/components/layout";
import { EmptyState } from "@/shared/components/shell";
import { toUserMessage } from "@/shared/platform";

export const Route = createFileRoute("/_shell/assessment/")({
  head: () => ({
    meta: [
      { title: "Question Bank — Assessment Studio | Hangeul LPK Platform" },
      {
        name: "description",
        content: "Satu bank soal untuk seluruh exam, quiz, practice, dan try out lembaga.",
      },
      { property: "og:title", content: "Question Bank — Assessment Studio" },
      {
        property: "og:description",
        content: "Cari soal berdasarkan tipe, keterampilan, tingkat, kategori, dan tag.",
      },
    ],
  }),
  component: QuestionBankPage,
});

function QuestionBankPage() {
  const [filters, setFilters] = useState<QuestionFilterValues>({});
  const questions = useQuestions(filters);
  const categories = useQuestionCategories();

  return (
    <Stack gap="lg">
      <AppSection
        title="Question Bank"
        description="Sumber tunggal seluruh soal. Setiap perubahan soal tersimpan sebagai versi baru."
        actions={
          <PermissionGate required={[ASSESSMENT_PERMISSIONS.questionWrite]} fallback={null}>
            <Link to="/assessment/questions/new" className={buttonClass}>
              <Plus className="size-4" aria-hidden="true" />
              Soal baru
            </Link>
          </PermissionGate>
        }
      >
        <Stack gap="md">
          <QuestionFilters
            value={filters}
            onChange={setFilters}
            categories={categories.data ?? []}
            idPrefix="bank"
          />

          {questions.isPending ? (
            <p className="text-body-sm text-text-secondary">Memuat soal…</p>
          ) : questions.isError ? (
            <p role="alert" className="text-body-sm text-danger">
              {toUserMessage(questions.error)}
            </p>
          ) : questions.data.length === 0 ? (
            <EmptyState
              icon={ListChecks}
              title="Belum ada soal"
              description="Mulai dari Question Studio untuk menulis soal reading atau listening pertama."
            />
          ) : (
            <Stack gap="sm">
              {questions.data.map((question) => (
                <QuestionCard key={question.id} question={question} />
              ))}
            </Stack>
          )}
        </Stack>
      </AppSection>
    </Stack>
  );
}
