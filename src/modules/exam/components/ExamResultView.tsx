import { Award, CheckCircle2, CircleSlash, Clock, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ExamResult } from "@/modules/exam/types";
import { AppCard, Grid, Stack } from "@/shared/components/layout";

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return minutes > 0 ? `${minutes} menit ${rest} detik` : `${rest} detik`;
}

/** Engine 6 — result summary. */
export function ExamResultView({ result }: { readonly result: ExamResult }) {
  const stats = [
    { icon: CheckCircle2, label: "Benar", value: result.correctCount, tone: "text-success" },
    { icon: XCircle, label: "Salah", value: result.wrongCount, tone: "text-destructive" },
    { icon: CircleSlash, label: "Kosong", value: result.emptyCount, tone: "text-text-secondary" },
  ] as const;

  return (
    <Stack gap="lg">
      <AppCard>
        <Stack gap="md">
          <div className="flex flex-wrap items-center gap-md">
            <span
              aria-hidden="true"
              className={cn(
                "grid size-16 place-items-center rounded-full text-h2 font-semibold",
                result.passed ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
              )}
            >
              {result.grade}
            </span>
            <div className="min-w-0">
              <p className="text-h2 text-text-primary">{result.percentage.toFixed(2)}%</p>
              <p className="text-body-sm text-text-secondary">
                {result.earnedPoints} dari {result.totalPoints} poin ·{" "}
                {result.passed ? "Lulus" : "Belum lulus"}
              </p>
            </div>
            <span className="ml-auto inline-flex items-center gap-xs text-body-sm text-text-secondary">
              <Clock className="size-4" aria-hidden="true" />
              {formatDuration(result.timeUsedSeconds)}
            </span>
          </div>

          <div
            role="progressbar"
            aria-label="Persentase nilai"
            aria-valuenow={Math.round(result.percentage)}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-2 w-full overflow-hidden rounded-full bg-border"
          >
            <div
              className={cn("h-full rounded-full", result.passed ? "bg-success" : "bg-destructive")}
              style={{ width: `${Math.min(100, result.percentage)}%` }}
            />
          </div>
        </Stack>
      </AppCard>

      <Grid cols={3} gap="md">
        {stats.map((stat) => (
          <AppCard key={stat.label}>
            <div className="flex items-center gap-sm">
              <stat.icon aria-hidden="true" className={cn("size-6", stat.tone)} />
              <div>
                <p className="text-h3 text-text-primary">{stat.value}</p>
                <p className="text-caption text-text-secondary">{stat.label}</p>
              </div>
            </div>
          </AppCard>
        ))}
      </Grid>

      <AppCard>
        <div className="flex items-center gap-sm text-body-sm text-text-secondary">
          <Award className="size-5 text-primary" aria-hidden="true" />
          Total {result.totalQuestions} soal dinilai otomatis dari snapshot asesmen.
        </div>
      </AppCard>
    </Stack>
  );
}
