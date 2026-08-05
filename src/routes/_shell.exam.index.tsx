import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardCheck, FileQuestion, PlayCircle, Timer } from "lucide-react";

import { EXAM_PERMISSIONS, useExamList, useMyResults } from "@/modules/exam";
import { usePermissions } from "@/modules/identity";
import { AppCard, Grid, Stack } from "@/shared/components/layout";
import { EmptyState, RouteLoading } from "@/shared/components/shell";
import { buttonClass, ghostButtonClass } from "@/shared/components/form";
import { toUserMessage } from "@/shared/platform";

export const Route = createFileRoute("/_shell/exam/")({
  head: () => ({
    meta: [
      { title: "Daftar Ujian — Exam Engine | Hangeul LPK Platform" },
      {
        name: "description",
        content: "Pilih paket ujian EPS-TOPIK yang sudah diterbitkan dan mulai pengerjaan.",
      },
      { property: "og:title", content: "Daftar Ujian — Exam Engine" },
      {
        property: "og:description",
        content: "Paket ujian yang tersedia beserta durasi, jumlah soal, dan nilai kelulusan.",
      },
    ],
  }),
  component: ExamIndexPage,
});

function ExamIndexPage() {
  const exams = useExamList();
  const results = useMyResults();
  const { can } = usePermissions();

  if (exams.isPending) return <RouteLoading />;
  if (exams.isError) {
    return (
      <AppCard>
        <p role="alert" className="text-body-sm text-destructive">
          {toUserMessage(exams.error)}
        </p>
      </AppCard>
    );
  }

  return (
    <Stack gap="xl">
      <section aria-labelledby="exam-available">
        <Stack gap="md">
          <h3 id="exam-available" className="text-h3 text-text-primary">
            Ujian tersedia
          </h3>
          {exams.data.length === 0 ? (
            <EmptyState
              icon={FileQuestion}
              title="Belum ada ujian terbit"
              description="Asesmen harus diterbitkan di Assessment Studio agar snapshot ujian tersedia."
            />
          ) : (
            <Grid cols={2} gap="md">
              {exams.data.map((exam) => (
                <AppCard key={exam.assessmentId}>
                  <Stack gap="sm">
                    <h4 className="text-body font-medium text-text-primary">{exam.title}</h4>
                    {exam.description ? (
                      <p className="line-clamp-2 text-body-sm text-text-secondary">
                        {exam.description}
                      </p>
                    ) : null}
                    <ul className="flex flex-wrap gap-md text-caption text-text-secondary">
                      <li className="inline-flex items-center gap-xs">
                        <Timer className="size-4" aria-hidden="true" />
                        {exam.durationMinutes} menit
                      </li>
                      <li className="inline-flex items-center gap-xs">
                        <FileQuestion className="size-4" aria-hidden="true" />
                        {exam.questionCount} soal
                      </li>
                      <li className="inline-flex items-center gap-xs">
                        <ClipboardCheck className="size-4" aria-hidden="true" />
                        KKM {exam.passingScore}%
                      </li>
                    </ul>
                    {can(EXAM_PERMISSIONS.examStart) ? (
                      <Link
                        to="/exam/$assessmentId/start"
                        params={{ assessmentId: exam.assessmentId }}
                        className={buttonClass}
                      >
                        <PlayCircle className="size-4" aria-hidden="true" />
                        Buka ujian
                      </Link>
                    ) : (
                      <p className="text-caption text-text-secondary">
                        Anda tidak memiliki izin memulai ujian.
                      </p>
                    )}
                  </Stack>
                </AppCard>
              ))}
            </Grid>
          )}
        </Stack>
      </section>

      <section aria-labelledby="exam-results">
        <Stack gap="md">
          <h3 id="exam-results" className="text-h3 text-text-primary">
            Riwayat hasil
          </h3>
          {results.isPending ? (
            <p className="text-body-sm text-text-secondary">Memuat hasil…</p>
          ) : (results.data ?? []).length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title="Belum ada hasil ujian"
              description="Hasil akan muncul setelah Anda menyelesaikan sebuah ujian."
            />
          ) : (
            <Stack gap="sm">
              {(results.data ?? []).map((result) => (
                <AppCard key={result.id}>
                  <div className="flex flex-wrap items-center gap-md">
                    <span className="text-h3 text-text-primary">{result.grade}</span>
                    <span className="text-body-sm text-text-secondary">
                      {result.percentage.toFixed(2)}% · benar {result.correctCount}, salah{" "}
                      {result.wrongCount}, kosong {result.emptyCount}
                    </span>
                    <Link
                      to="/exam/attempts/$attemptId/result"
                      params={{ attemptId: result.attemptId }}
                      className={`${ghostButtonClass} ml-auto`}
                    >
                      Lihat hasil
                    </Link>
                  </div>
                </AppCard>
              ))}
            </Stack>
          )}
        </Stack>
      </section>
    </Stack>
  );
}
