import { useMemo, useState } from "react";
import { Award, GraduationCap, Percent, Timer, Users } from "lucide-react";

import {
  DataTable,
  ExportMenu,
  FilterBar,
  GradeDistributionChart,
  ScoreDistributionChart,
  StatCard,
  TrendChart,
  describeFilter,
  exportFileName,
  useAnalyticsDataset,
  useAnalyticsFilterOptions,
  useAnalyticsScope,
  useAnalyticsViews,
  EMPTY_ANALYTICS_FILTER,
} from "@/modules/analytics";
import type { AnalyticsFilter, ExportRequest } from "@/modules/analytics";
import { formatDuration, formatPercent } from "@/modules/analytics/utils/format";
import { AppCard, Grid, Stack } from "@/shared/components/layout";
import { RouteLoading } from "@/shared/components/shell";
import { toUserMessage } from "@/shared/platform";

/**
 * Shared dashboard scaffold: filter state, dataset loading, error/loading UI,
 * and the export toolbar. Every analytics page renders through this.
 */
export interface DashboardShellProps {
  readonly title: string;
  readonly description: string;
  readonly hideFilters?: readonly ("period" | "group" | "assessment" | "student" | "date")[];
  readonly children: (context: DashboardContext) => React.ReactNode;
  readonly buildExport: (context: DashboardContext) => ExportRequest;
  readonly exportPrefix: string;
}

export interface DashboardContext {
  readonly filter: AnalyticsFilter;
  readonly filterLabel: string;
  readonly views: NonNullable<ReturnType<typeof useAnalyticsViews>>;
}

export function DashboardShell({
  title,
  description,
  hideFilters,
  children,
  buildExport,
  exportPrefix,
}: DashboardShellProps) {
  const [filter, setFilter] = useState<AnalyticsFilter>(EMPTY_ANALYTICS_FILTER);
  const { isCohortScope, canExport } = useAnalyticsScope();
  const options = useAnalyticsFilterOptions();
  const dataset = useAnalyticsDataset(filter);
  const views = useAnalyticsViews(dataset.data);

  const filterLabel = useMemo(() => describeFilter(filter, options.data), [filter, options.data]);

  return (
    <Stack gap="lg">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-md">
        <div className="min-w-0">
          <h3 className="text-h3 text-text-primary">{title}</h3>
          <p className="mt-xs text-body-sm text-text-secondary">{description}</p>
        </div>
        {canExport && views && (
          <ExportMenu
            build={() => buildExport({ filter, filterLabel, views })}
            disabled={dataset.isFetching}
          />
        )}
      </div>

      {isCohortScope && (
        <FilterBar
          value={filter}
          options={options.data}
          onChange={setFilter}
          hide={hideFilters ?? []}
        />
      )}

      {dataset.isPending && <RouteLoading />}

      {dataset.isError && (
        <AppCard>
          <p role="alert" className="text-body-sm text-destructive">
            {toUserMessage(dataset.error)}
          </p>
        </AppCard>
      )}

      {views && children({ filter, filterLabel, views })}
    </Stack>
  );
}

/** KPI row reused by the student and class dashboards. */
export function OverviewCards({
  overview,
  lessonRate,
}: {
  readonly overview: DashboardContext["views"]["overview"];
  readonly lessonRate: number;
}) {
  return (
    <Grid cols={1} smCols={2} lgCols={3} gap="md">
      <StatCard icon={Users} label="Peserta terpantau" value={String(overview.studentCount)} />
      <StatCard icon={GraduationCap} label="Ujian tercatat" value={String(overview.examCount)} />
      <StatCard
        icon={Award}
        label="Rata-rata nilai"
        value={formatPercent(overview.averageScore)}
        tone={overview.averageScore >= 70 ? "success" : "warning"}
      />
      <StatCard
        icon={Percent}
        label="Tingkat kelulusan"
        value={formatPercent(overview.passRate)}
        tone={overview.passRate >= 70 ? "success" : "danger"}
      />
      <StatCard
        icon={Percent}
        label="Penyelesaian materi"
        value={formatPercent(lessonRate)}
        hint="Unit belajar berstatus selesai"
      />
      <StatCard
        icon={Timer}
        label="Rata-rata durasi ujian"
        value={formatDuration(overview.averageTimeSeconds)}
      />
    </Grid>
  );
}

export function ChartRow({
  overview,
}: {
  readonly overview: DashboardContext["views"]["overview"];
}) {
  return (
    <>
      <Grid cols={1} smCols={1} lgCols={2} gap="md">
        <ScoreDistributionChart data={overview.scoreDistribution} />
        <GradeDistributionChart data={overview.gradeDistribution} />
      </Grid>
      <TrendChart data={overview.trend} />
    </>
  );
}
