import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Building2, GraduationCap, Percent, Users } from "lucide-react";

import {
  DataTable,
  EMPTY_ANALYTICS_FILTER,
  ExportMenu,
  StatCard,
  exportFileName,
  formatPercent,
  useAnalyticsScope,
  usePlatformSummary,
} from "@/modules/analytics";
import type { AnalyticsFilter, ExportColumn } from "@/modules/analytics";
import { AppCard, Grid, Stack } from "@/shared/components/layout";
import { EmptyState, RouteLoading } from "@/shared/components/shell";
import { toUserMessage } from "@/shared/platform";

export const Route = createFileRoute("/_shell/analytics/platform")({
  head: () => ({
    meta: [
      { title: "Insight Lembaga — Hangeul LPK Platform" },
      {
        name: "description",
        content:
          "Ringkasan lintas lembaga: jumlah peserta, volume ujian, rata-rata nilai, dan penyelesaian materi.",
      },
      { property: "og:title", content: "Insight Lembaga — Hangeul LPK Platform" },
      {
        property: "og:description",
        content: "Bandingkan capaian antar lembaga yang Anda kelola dalam satu tampilan.",
      },
    ],
  }),
  component: PlatformInsightsPage,
});

const COLUMNS: readonly ExportColumn[] = [
  { key: "tenantName", label: "Lembaga", width: 30 },
  { key: "studentCount", label: "Peserta" },
  { key: "studyGroupCount", label: "Kelas" },
  { key: "examCount", label: "Hasil ujian" },
  { key: "averageScore", label: "Rata-rata (%)" },
  { key: "passRate", label: "Kelulusan (%)" },
  { key: "lessonCompletionRate", label: "Materi selesai (%)" },
];

function PlatformInsightsPage() {
  const [filter] = useState<AnalyticsFilter>(EMPTY_ANALYTICS_FILTER);
  const { canViewPlatform, canExport } = useAnalyticsScope();
  const summary = usePlatformSummary(filter);

  const rows = useMemo(
    () => (summary.data?.tenants ?? []).map((tenant) => ({ ...tenant })),
    [summary.data],
  );

  if (!canViewPlatform) {
    return (
      <EmptyState
        icon={Building2}
        title="Akses terbatas"
        description="Insight lintas lembaga hanya tersedia untuk pemilik lembaga."
      />
    );
  }

  if (summary.isPending) return <RouteLoading />;

  if (summary.isError) {
    return (
      <AppCard>
        <p role="alert" className="text-body-sm text-destructive">
          {toUserMessage(summary.error)}
        </p>
      </AppCard>
    );
  }

  const data = summary.data;

  return (
    <Stack gap="lg">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-md">
        <div className="min-w-0">
          <h3 className="text-h3 text-text-primary">Insight lembaga</h3>
          <p className="mt-xs text-body-sm text-text-secondary">
            Ringkasan mencakup seluruh lembaga tempat Anda terdaftar sebagai pemilik atau
            administrator aktif.
          </p>
        </div>
        {canExport && (
          <ExportMenu
            build={() => ({
              fileName: exportFileName("insight-lembaga"),
              heading: "Laporan Insight Lembaga",
              subtitle: "Semua lembaga yang Anda kelola",
              tables: [{ title: "Lembaga", columns: COLUMNS, rows }],
            })}
          />
        )}
      </div>

      <Grid cols={1} smCols={2} lgCols={4} gap="md">
        <StatCard icon={Building2} label="Lembaga" value={String(data.tenants.length)} />
        <StatCard icon={Users} label="Total peserta" value={String(data.totalStudents)} />
        <StatCard icon={GraduationCap} label="Total ujian" value={String(data.totalExams)} />
        <StatCard
          icon={Percent}
          label="Rata-rata nilai"
          value={formatPercent(data.averageScore)}
          tone={data.averageScore >= 70 ? "success" : "warning"}
        />
      </Grid>

      <DataTable
        title="Perbandingan lembaga"
        columns={COLUMNS}
        rows={rows}
        emptyLabel="Belum ada lembaga dengan data laporan."
      />
    </Stack>
  );
}
