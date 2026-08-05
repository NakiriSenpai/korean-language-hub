import { createFileRoute, Link, Navigate } from "@tanstack/react-router";

import { ExamRuntime, useAttempt } from "@/modules/exam";
import { ghostButtonClass } from "@/shared/components/form";
import { AppCard, Stack } from "@/shared/components/layout";
import { RouteLoading } from "@/shared/components/shell";
import { toUserMessage } from "@/shared/platform";

export const Route = createFileRoute("/_shell/exam/attempts/$attemptId/")({
  head: () => ({
    meta: [
      { title: "Sedang Ujian — Exam Engine | Hangeul LPK Platform" },
      {
        name: "description",
        content: "Runtime ujian dengan timer, peta soal, audio listening, dan simpan otomatis.",
      },
      { property: "og:title", content: "Sedang Ujian — Exam Engine" },
      {
        property: "og:description",
        content: "Pengerjaan ujian berlangsung dengan penyimpanan jawaban otomatis.",
      },
    ],
  }),
  component: ExamRuntimePage,
});

function ExamRuntimePage() {
  const { attemptId } = Route.useParams();
  const attempt = useAttempt(attemptId);

  if (attempt.isPending) return <RouteLoading />;
  if (attempt.isError || !attempt.data) {
    return (
      <AppCard>
        <Stack gap="sm">
          <p role="alert" className="text-body-sm text-destructive">
            {attempt.error ? toUserMessage(attempt.error) : "Percobaan ujian tidak ditemukan."}
          </p>
          <Link to="/exam" className={ghostButtonClass}>
            Kembali ke daftar ujian
          </Link>
        </Stack>
      </AppCard>
    );
  }

  if (attempt.data.status !== "in_progress" && attempt.data.status !== "draft") {
    return (
      <Navigate to="/exam/attempts/$attemptId/result" params={{ attemptId }} replace />
    );
  }

  return <ExamRuntime attempt={attempt.data} />;
}
