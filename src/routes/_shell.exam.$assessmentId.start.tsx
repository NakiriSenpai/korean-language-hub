import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, ClipboardCheck, FileQuestion, PlayCircle, Timer } from "lucide-react";
import { toast } from "sonner";

import { useLatestExamPackage, useMyAttempts, useStartAttempt } from "@/modules/exam";
import { buttonClass, ghostButtonClass } from "@/shared/components/form";
import { AppCard, Stack } from "@/shared/components/layout";
import { RouteLoading } from "@/shared/components/shell";
import { toUserMessage } from "@/shared/platform";

export const Route = createFileRoute("/_shell/exam/$assessmentId/start")({
  head: () => ({
    meta: [
      { title: "Mulai Ujian — Exam Engine | Hangeul LPK Platform" },
      {
        name: "description",
        content: "Konfirmasi aturan ujian, durasi, dan jumlah soal sebelum pengerjaan dimulai.",
      },
      { property: "og:title", content: "Mulai Ujian — Exam Engine" },
      {
        property: "og:description",
        content: "Halaman konfirmasi sebelum ujian EPS-TOPIK dimulai.",
      },
    ],
  }),
  component: ExamStartPage,
});

function ExamStartPage() {
  const { assessmentId } = Route.useParams();
  const navigate = useNavigate();
  const examPackage = useLatestExamPackage(assessmentId);
  const attempts = useMyAttempts(assessmentId);
  const start = useStartAttempt();

  if (examPackage.isPending) return <RouteLoading />;
  if (examPackage.isError) {
    return (
      <AppCard>
        <Stack gap="sm">
          <p role="alert" className="text-body-sm text-destructive">
            {toUserMessage(examPackage.error)}
          </p>
          <Link to="/exam" className={ghostButtonClass}>
            Kembali ke daftar ujian
          </Link>
        </Stack>
      </AppCard>
    );
  }

  const pkg = examPackage.data;
  const resumable = (attempts.data ?? []).find((attempt) => attempt.status === "in_progress");

  const onStart = () => {
    start.mutate(assessmentId, {
      onSuccess: (attempt) =>
        void navigate({ to: "/exam/attempts/$attemptId", params: { attemptId: attempt.id } }),
      onError: (error) => toast.error(toUserMessage(error)),
    });
  };

  return (
    <AppCard>
      <Stack gap="lg">
        <div>
          <h3 className="text-h3 text-text-primary">{pkg.title}</h3>
          <p className="mt-xs text-body-sm text-text-secondary">
            Versi snapshot {pkg.snapshotVersion} · total {pkg.totalPoints} poin
          </p>
        </div>

        <ul className="flex flex-wrap gap-lg text-body-sm text-text-secondary">
          <li className="inline-flex items-center gap-xs">
            <Timer className="size-4" aria-hidden="true" />
            Durasi {pkg.durationMinutes} menit
          </li>
          <li className="inline-flex items-center gap-xs">
            <FileQuestion className="size-4" aria-hidden="true" />
            {pkg.questions.length} soal
          </li>
          <li className="inline-flex items-center gap-xs">
            <ClipboardCheck className="size-4" aria-hidden="true" />
            Nilai kelulusan {pkg.passingScore}%
          </li>
        </ul>

        <div className="flex gap-sm rounded-md bg-muted p-md">
          <AlertTriangle className="size-5 shrink-0 text-warning" aria-hidden="true" />
          <ul className="list-disc space-y-xs pl-md text-body-sm text-text-secondary">
            <li>Timer berjalan sejak ujian dimulai dan tidak dapat dijeda.</li>
            <li>Jawaban tersimpan otomatis setiap kali Anda memilih atau mengetik.</li>
            <li>Soal listening memiliki batas pemutaran audio.</li>
            <li>
              Jika koneksi terputus, ujian dapat dilanjutkan kembali dari perangkat yang sama.
            </li>
          </ul>
        </div>

        <div className="flex flex-wrap gap-sm">
          <button
            type="button"
            className={buttonClass}
            onClick={onStart}
            disabled={start.isPending}
          >
            <PlayCircle className="size-4" aria-hidden="true" />
            {resumable ? "Lanjutkan ujian" : "Mulai ujian"}
          </button>
          <Link to="/exam" className={ghostButtonClass}>
            Batal
          </Link>
        </div>
      </Stack>
    </AppCard>
  );
}
