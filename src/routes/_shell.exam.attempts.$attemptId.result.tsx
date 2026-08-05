import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpenCheck, ListChecks } from "lucide-react";

import { ExamResultView, useAttempt, useExamResult } from "@/modules/exam";
import { ghostButtonClass } from "@/shared/components/form";
import { AppCard, Stack } from "@/shared/components/layout";
import { EmptyState, RouteLoading } from "@/shared/components/shell";
import { toUserMessage } from "@/shared/platform";

export const Route = createFileRoute("/_shell/exam/attempts/$attemptId/result")({
  head: () => ({
    meta: [
      { title: "Hasil Ujian — Exam Engine | Hangeul LPK Platform" },
      {
        name: "description",
        content: "Ringkasan nilai otomatis: jumlah benar, salah, kosong, persentase, dan grade.",
      },
      { property: "og:title", content: "Hasil Ujian — Exam Engine" },
      {
        property: "og:description",
        content: "Ringkasan skor ujian EPS-TOPIK beserta status kelulusan.",
      },
    ],
  }),
  component: ExamResultPage,
});

function ExamResultPage() {
  const { attemptId } = Route.useParams();
  const attempt = useAttempt(attemptId);
  const result = useExamResult(attemptId);

  if (result.isPending || attempt.isPending) return <RouteLoading />;
  if (result.isError) {
    return (
      <AppCard>
        <p role="alert" className="text-body-sm text-destructive">
          {toUserMessage(result.error)}
        </p>
      </AppCard>
    );
  }

  if (!result.data) {
    return (
      <EmptyState
        icon={ListChecks}
        title="Hasil belum tersedia"
        description="Ujian ini belum dikumpulkan, sehingga penilaian otomatis belum dijalankan."
      />
    );
  }

  return (
    <Stack gap="lg">
      <ExamResultView result={result.data} />
      <div className="flex flex-wrap gap-sm">
        <Link
          to="/exam/attempts/$attemptId/review"
          params={{ attemptId }}
          className={ghostButtonClass}
        >
          <BookOpenCheck className="size-4" aria-hidden="true" />
          Tinjau pembahasan
        </Link>
        <Link to="/exam" className={ghostButtonClass}>
          Kembali ke daftar ujian
        </Link>
      </div>
    </Stack>
  );
}
