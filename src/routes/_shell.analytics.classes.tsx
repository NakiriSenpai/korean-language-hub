import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Trophy, Users } from "lucide-react";

import { DashboardShell } from "@/modules/analytics/components/DashboardShell";
import { DataTable, exportFileName, formatDate } from "@/modules/analytics";
import type { ExportColumn } from "@/modules/analytics";
import { Stack } from "@/shared/components/layout";
import { EmptyState } from "@/shared/components/shell";

export const Route = createFileRoute("/_shell/analytics/classes")({
  head: () => ({
    meta: [
      { title: "Insight Kelas & Pengajar — Hangeul LPK Platform" },
      {
        name: "description",
        content:
          "Perbandingan performa kelas, tingkat partisipasi, peserta terbaik, dan peserta yang perlu pendampingan.",
      },
      { property: "og:title", content: "Insight Kelas & Pengajar — Hangeul LPK Platform" },
      {
        property: "og:description",
        content: "Bandingkan capaian kelas dan temukan peserta yang butuh pendampingan.",
      },
    ],
  }),
  component: ClassInsightsPage,
});

const GROUP_COLUMNS: readonly ExportColumn[] = [
  { key: "studyGroupName", label: "Kelas", width: 26 },
  { key: "periodName", label: "Gelombang" },
  { key: "studentCount", label: "Peserta" },
  { key: "activeStudentCount", label: "Peserta aktif" },
  { key: "participationRate", label: "Partisipasi (%)" },
  { key: "examCount", label: "Hasil ujian" },
  { key: "averageScore", label: "Rata-rata (%)" },
  { key: "passRate", label: "Kelulusan (%)" },
];

const TOP_COLUMNS: readonly ExportColumn[] = [
  { key: "studentName", label: "Peserta", width: 26 },
  { key: "studyGroupName", label: "Kelas" },
  { key: "examCount", label: "Ujian" },
  { key: "averageScore", label: "Rata-rata (%)" },
  { key: "passRate", label: "Kelulusan (%)" },
  { key: "lastExamAt", label: "Ujian terakhir" },
];

const RISK_COLUMNS: readonly ExportColumn[] = [
  { key: "studentName", label: "Peserta", width: 26 },
  { key: "studyGroupName", label: "Kelas" },
  { key: "examCount", label: "Ujian" },
  { key: "averageScore", label: "Rata-rata (%)" },
  { key: "reason", label: "Catatan", width: 32 },
];

function ClassInsightsPage() {
  return (
    <DashboardShell
      title="Insight kelas & pengajar"
      description="Bandingkan capaian antar kelas dalam satu gelombang, lalu tindak lanjuti peserta yang tertinggal."
      hideFilters={["student"]}
      exportPrefix="insight-kelas"
      buildExport={({ views, filterLabel }) => ({
        fileName: exportFileName("insight-kelas"),
        heading: "Laporan Insight Kelas & Pengajar",
        subtitle: filterLabel,
        tables: [
          {
            title: "Performa kelas",
            columns: GROUP_COLUMNS,
            rows: views.teacher.groups.map((group) => ({ ...group })),
          },
          {
            title: "Peserta terbaik",
            columns: TOP_COLUMNS,
            rows: views.teacher.topStudents.map((student) => ({
              studentName: student.studentName,
              studyGroupName: student.studyGroupName,
              examCount: student.examCount,
              averageScore: student.averageScore,
              passRate: student.passRate,
              lastExamAt: formatDate(student.lastExamAt),
            })),
          },
          {
            title: "Perlu pendampingan",
            columns: RISK_COLUMNS,
            rows: views.teacher.atRiskStudents.map((student) => ({
              studentName: student.studentName,
              studyGroupName: student.studyGroupName,
              examCount: student.examCount,
              averageScore: student.averageScore,
              reason: student.reason,
            })),
          },
        ],
      })}
    >
      {({ views }) =>
        views.teacher.groups.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Belum ada kelas terdata"
            description="Insight kelas muncul setelah peserta terdaftar pada kelas di sebuah gelombang."
          />
        ) : (
          <Stack gap="lg">
            <DataTable
              title="Performa kelas"
              columns={GROUP_COLUMNS}
              rows={views.teacher.groups.map((group) => ({ ...group }))}
            />
            <DataTable
              title="Peserta terbaik"
              columns={TOP_COLUMNS}
              rows={views.teacher.topStudents.map((student) => ({
                studentName: student.studentName,
                studyGroupName: student.studyGroupName,
                examCount: student.examCount,
                averageScore: student.averageScore,
                passRate: student.passRate,
                lastExamAt: formatDate(student.lastExamAt),
              }))}
              emptyLabel="Belum ada peserta dengan hasil ujian."
            />
            <DataTable
              title="Perlu pendampingan"
              columns={RISK_COLUMNS}
              rows={views.teacher.atRiskStudents.map((student) => ({
                studentName: student.studentName,
                studyGroupName: student.studyGroupName,
                examCount: student.examCount,
                averageScore: student.averageScore,
                reason: student.reason,
              }))}
              emptyLabel="Tidak ada peserta berisiko pada filter ini."
            />
            <p className="inline-flex items-center gap-xs text-caption text-text-secondary">
              <AlertTriangle className="size-4" aria-hidden="true" />
              Peserta ditandai berisiko bila rata-rata nilai di bawah 60, kelulusan di bawah 50%,
              atau belum pernah mengikuti ujian.
              <Trophy className="ml-md size-4" aria-hidden="true" />
              Peringkat peserta terbaik diurutkan dari rata-rata nilai tertinggi.
            </p>
          </Stack>
        )
      }
    </DashboardShell>
  );
}
