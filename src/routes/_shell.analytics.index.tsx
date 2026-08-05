import { createFileRoute } from "@tanstack/react-router";

import {
  ChartRow,
  DashboardShell,
  OverviewCards,
} from "@/modules/analytics/components/DashboardShell";
import { DataTable, exportFileName, formatDate, formatDuration } from "@/modules/analytics";
import type { ExportColumn } from "@/modules/analytics";

export const Route = createFileRoute("/_shell/analytics/")({
  head: () => ({
    meta: [
      { title: "Analytics Peserta — Hangeul LPK Platform" },
      {
        name: "description",
        content:
          "Rata-rata nilai, tingkat kelulusan, akurasi jawaban, dan tren belajar setiap peserta.",
      },
      { property: "og:title", content: "Analytics Peserta — Hangeul LPK Platform" },
      {
        property: "og:description",
        content: "Statistik performa peserta lengkap dengan tren nilai dan ekspor laporan.",
      },
    ],
  }),
  component: StudentAnalyticsPage,
});

const COLUMNS: readonly ExportColumn[] = [
  { key: "studentName", label: "Peserta", width: 28 },
  { key: "studentNumber", label: "No. Induk" },
  { key: "studyGroupName", label: "Kelas" },
  { key: "periodName", label: "Gelombang" },
  { key: "examCount", label: "Jumlah ujian" },
  { key: "averageScore", label: "Rata-rata (%)" },
  { key: "bestScore", label: "Tertinggi (%)" },
  { key: "lowestScore", label: "Terendah (%)" },
  { key: "passRate", label: "Kelulusan (%)" },
  { key: "correctRate", label: "Akurasi (%)" },
  { key: "totalTime", label: "Total waktu" },
  { key: "lastExamAt", label: "Ujian terakhir" },
];

function StudentAnalyticsPage() {
  return (
    <DashboardShell
      title="Analytics peserta"
      description="Capaian setiap peserta dihitung dari hasil ujian yang sudah dinilai otomatis oleh Exam Engine."
      exportPrefix="analytics-peserta"
      buildExport={({ views, filterLabel }) => ({
        fileName: exportFileName("analytics-peserta"),
        heading: "Laporan Analytics Peserta",
        subtitle: filterLabel,
        tables: [
          {
            title: "Peserta",
            columns: COLUMNS,
            rows: views.students.map((student) => ({
              studentName: student.studentName,
              studentNumber: student.studentNumber,
              studyGroupName: student.studyGroupName,
              periodName: student.periodName,
              examCount: student.examCount,
              averageScore: student.averageScore,
              bestScore: student.bestScore,
              lowestScore: student.lowestScore,
              passRate: student.passRate,
              correctRate: student.correctRate,
              totalTime: formatDuration(student.totalTimeSeconds),
              lastExamAt: formatDate(student.lastExamAt),
            })),
          },
        ],
      })}
    >
      {({ views }) => (
        <>
          <OverviewCards overview={views.overview} lessonRate={views.lessonCompletionRate} />
          <ChartRow overview={views.overview} />
          <DataTable
            title="Rincian per peserta"
            columns={COLUMNS}
            rows={views.students.map((student) => ({
              studentName: student.studentName,
              studentNumber: student.studentNumber,
              studyGroupName: student.studyGroupName,
              periodName: student.periodName,
              examCount: student.examCount,
              averageScore: student.averageScore,
              bestScore: student.bestScore,
              lowestScore: student.lowestScore,
              passRate: student.passRate,
              correctRate: student.correctRate,
              totalTime: formatDuration(student.totalTimeSeconds),
              lastExamAt: formatDate(student.lastExamAt),
            }))}
            emptyLabel="Belum ada hasil ujian pada filter ini."
          />
        </>
      )}
    </DashboardShell>
  );
}
