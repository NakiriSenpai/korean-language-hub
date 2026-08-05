import { createFileRoute } from "@tanstack/react-router";

import { DashboardShell } from "@/modules/analytics/components/DashboardShell";
import {
  DataTable,
  ScoreDistributionChart,
  StatCard,
  exportFileName,
  formatDuration,
  formatPercent,
} from "@/modules/analytics";
import type { ExportColumn, ExportTable } from "@/modules/analytics";
import { AppCard, Grid, Stack } from "@/shared/components/layout";
import { EmptyState } from "@/shared/components/shell";
import { FileBarChart, Percent, Users } from "lucide-react";

export const Route = createFileRoute("/_shell/analytics/assessments")({
  head: () => ({
    meta: [
      { title: "Analytics Asesmen — Hangeul LPK Platform" },
      {
        name: "description",
        content:
          "Statistik tiap asesmen: rata-rata nilai, distribusi, tingkat kelulusan, dan soal tersulit.",
      },
      { property: "og:title", content: "Analytics Asesmen — Hangeul LPK Platform" },
      {
        property: "og:description",
        content: "Analisis butir soal dan performa asesmen EPS-TOPIK.",
      },
    ],
  }),
  component: AssessmentAnalyticsPage,
});

const SUMMARY_COLUMNS: readonly ExportColumn[] = [
  { key: "title", label: "Asesmen", width: 30 },
  { key: "type", label: "Tipe" },
  { key: "participantCount", label: "Peserta" },
  { key: "attemptCount", label: "Hasil" },
  { key: "averageScore", label: "Rata-rata (%)" },
  { key: "highestScore", label: "Tertinggi (%)" },
  { key: "lowestScore", label: "Terendah (%)" },
  { key: "passRate", label: "Kelulusan (%)" },
  { key: "averageTime", label: "Rata-rata waktu" },
];

const QUESTION_COLUMNS: readonly ExportColumn[] = [
  { key: "assessment", label: "Asesmen", width: 30 },
  { key: "questionId", label: "ID soal", width: 38 },
  { key: "attempts", label: "Dikerjakan" },
  { key: "correctRate", label: "Benar (%)" },
  { key: "emptyRate", label: "Kosong (%)" },
  { key: "difficultyBand", label: "Tingkat kesulitan" },
];

function AssessmentAnalyticsPage() {
  return (
    <DashboardShell
      title="Analytics asesmen"
      description="Perbandingan performa antar asesmen serta analisis butir soal berdasarkan rincian penilaian otomatis."
      exportPrefix="analytics-asesmen"
      buildExport={({ views, filterLabel }) => {
        const summary: ExportTable = {
          title: "Ringkasan asesmen",
          columns: SUMMARY_COLUMNS,
          rows: views.assessments.map((item) => ({
            title: item.title,
            type: item.type,
            participantCount: item.participantCount,
            attemptCount: item.attemptCount,
            averageScore: item.averageScore,
            highestScore: item.highestScore,
            lowestScore: item.lowestScore,
            passRate: item.passRate,
            averageTime: formatDuration(item.averageTimeSeconds),
          })),
        };
        const questions: ExportTable = {
          title: "Analisis butir soal",
          columns: QUESTION_COLUMNS,
          rows: views.assessments.flatMap((item) =>
            item.questionStats.map((stat) => ({
              assessment: item.title,
              questionId: stat.questionId,
              attempts: stat.attempts,
              correctRate: stat.correctRate,
              emptyRate: stat.emptyRate,
              difficultyBand: stat.difficultyBand,
            })),
          ),
        };
        return {
          fileName: exportFileName("analytics-asesmen"),
          heading: "Laporan Analytics Asesmen",
          subtitle: filterLabel,
          tables: [summary, questions],
        };
      }}
    >
      {({ views }) =>
        views.assessments.length === 0 ? (
          <EmptyState
            icon={FileBarChart}
            title="Belum ada asesmen bernilai"
            description="Statistik asesmen muncul setelah minimal satu ujian dikumpulkan dan dinilai."
          />
        ) : (
          <Stack gap="lg">
            <DataTable
              title="Ringkasan asesmen"
              columns={SUMMARY_COLUMNS}
              rows={views.assessments.map((item) => ({
                title: item.title,
                type: item.type,
                participantCount: item.participantCount,
                attemptCount: item.attemptCount,
                averageScore: item.averageScore,
                highestScore: item.highestScore,
                lowestScore: item.lowestScore,
                passRate: item.passRate,
                averageTime: formatDuration(item.averageTimeSeconds),
              }))}
            />

            {views.assessments.map((item) => (
              <AppCard key={item.assessmentId} padding="lg">
                <Stack gap="md">
                  <div className="min-w-0">
                    <h4 className="text-title text-text-primary">{item.title}</h4>
                    <p className="mt-xs text-caption text-text-secondary">
                      {item.participantCount} peserta • rata-rata {formatPercent(item.averageScore)}{" "}
                      • kelulusan {formatPercent(item.passRate)}
                    </p>
                  </div>

                  <Grid cols={1} smCols={2} lgCols={3} gap="md">
                    <StatCard icon={Users} label="Peserta" value={String(item.participantCount)} />
                    <StatCard
                      icon={Percent}
                      label="Kelulusan"
                      value={formatPercent(item.passRate)}
                      tone={item.passRate >= 70 ? "success" : "danger"}
                    />
                    <StatCard
                      icon={FileBarChart}
                      label="Soal dianalisis"
                      value={String(item.questionStats.length)}
                    />
                  </Grid>

                  <ScoreDistributionChart data={item.scoreDistribution} />

                  <DataTable
                    title="Soal tersulit"
                    columns={QUESTION_COLUMNS.filter((column) => column.key !== "assessment")}
                    rows={item.questionStats.slice(0, 10).map((stat) => ({
                      questionId: stat.questionId,
                      attempts: stat.attempts,
                      correctRate: stat.correctRate,
                      emptyRate: stat.emptyRate,
                      difficultyBand: stat.difficultyBand,
                    }))}
                    emptyLabel="Rincian butir soal belum tersedia."
                  />
                </Stack>
              </AppCard>
            ))}
          </Stack>
        )
      }
    </DashboardShell>
  );
}
