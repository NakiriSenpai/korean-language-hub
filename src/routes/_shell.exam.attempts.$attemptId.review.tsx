import { createFileRoute, Link } from "@tanstack/react-router";

import {
  ExamReview,
  useAttempt,
  useAttemptAnswers,
  useAttemptPackage,
} from "@/modules/exam";
import { ghostButtonClass } from "@/shared/components/form";
import { AppCard, Stack } from "@/shared/components/layout";
import { RouteLoading } from "@/shared/components/shell";
import { toUserMessage } from "@/shared/platform";

export const Route = createFileRoute("/_shell/exam/attempts/$attemptId/review")({
  head: () => ({
    meta: [
      { title: "Tinjau Jawaban — Exam Engine | Hangeul LPK Platform" },
      {
        name: "description",
        content: "Bandingkan jawaban Anda dengan kunci jawaban dan pembahasan tiap soal.",
      },
      { property: "og:title", content: "Tinjau Jawaban — Exam Engine" },
      {
        property: "og:description",
        content: "Pembahasan soal ujian dengan penanda jawaban benar dan salah.",
      },
    ],
  }),
  component: ExamReviewPage,
});

function ExamReviewPage() {
  const { attemptId } = Route.useParams();
  const attempt = useAttempt(attemptId);
  const examPackage = useAttemptPackage(
    attempt.data?.snapshotId ?? "",
    attempt.data?.questionOrder,
  );
  const answers = useAttemptAnswers(attemptId);

  if (attempt.isPending || examPackage.isPending || answers.isPending) return <RouteLoading />;

  const error = attempt.error ?? examPackage.error ?? answers.error;
  if (error || !examPackage.data) {
    return (
      <AppCard>
        <Stack gap="sm">
          <p role="alert" className="text-body-sm text-destructive">
            {error ? toUserMessage(error) : "Data ujian tidak ditemukan."}
          </p>
          <Link to="/exam" className={ghostButtonClass}>
            Kembali ke daftar ujian
          </Link>
        </Stack>
      </AppCard>
    );
  }

  return (
    <Stack gap="lg">
      <ExamReview questions={examPackage.data.questions} answers={answers.data ?? []} />
      <div>
        <Link
          to="/exam/attempts/$attemptId/result"
          params={{ attemptId }}
          className={ghostButtonClass}
        >
          Kembali ke hasil
        </Link>
      </div>
    </Stack>
  );
}
