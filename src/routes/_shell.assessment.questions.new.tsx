import { createFileRoute, useNavigate } from "@tanstack/react-router";

import {
  ASSESSMENT_PERMISSIONS,
  QuestionEditor,
  useCreateQuestion,
} from "@/modules/assessment";
import { PermissionGate } from "@/modules/identity";
import { AppSection } from "@/shared/components/layout";

export const Route = createFileRoute("/_shell/assessment/questions/new")({
  head: () => ({
    meta: [
      { title: "Question Studio — Tulis Soal | Hangeul LPK Platform" },
      {
        name: "description",
        content: "Tulis soal reading atau listening dengan validasi tipe, pilihan, dan kunci jawaban.",
      },
      { property: "og:title", content: "Question Studio — Tulis Soal" },
      {
        property: "og:description",
        content: "Editor soal pilihan ganda, jawaban ganda, benar/salah, dan isian singkat.",
      },
    ],
  }),
  component: NewQuestionPage,
});

function NewQuestionPage() {
  const create = useCreateQuestion();
  const navigate = useNavigate();

  return (
    <PermissionGate required={[ASSESSMENT_PERMISSIONS.questionWrite]}>
      <AppSection
        title="Question Studio"
        description="Soal baru langsung masuk ke Question Bank sebagai versi 1."
      >
        <QuestionEditor
          submitLabel="Simpan soal"
          successMessage="Soal tersimpan sebagai versi 1."
          pending={create.isPending}
          onSubmit={async (input) => {
            const question = await create.mutateAsync(input);
            await navigate({
              to: "/assessment/questions/$questionId",
              params: { questionId: question.id },
            });
          }}
        />
      </AppSection>
    </PermissionGate>
  );
}
