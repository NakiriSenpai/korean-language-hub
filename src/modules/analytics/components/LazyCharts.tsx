/**
 * Recharts is the heaviest dependency in the analytics bundle. The chart
 * components are therefore loaded on demand: dashboards paint their KPI cards
 * and tables immediately while the charting runtime streams in behind a
 * lightweight placeholder.
 *
 * Public names and props are identical to `AnalyticsCharts`, so callers do not
 * change.
 */

import { lazy, Suspense, type ComponentType } from "react";

import { AppCard } from "@/shared/components/layout";
import type { GradeBucket, ScoreBucket, TrendPoint } from "@/modules/analytics/types";

const charts = () => import("@/modules/analytics/components/AnalyticsCharts");

function ChartSkeleton() {
  return (
    <AppCard>
      <div aria-hidden="true" className="h-4 w-40 animate-pulse rounded bg-muted" />
      <div
        role="status"
        aria-label="Memuat grafik"
        className="mt-md h-64 w-full animate-pulse rounded-lg bg-muted"
      />
    </AppCard>
  );
}

function withChartSuspense<P extends object>(Component: ComponentType<P>) {
  return function LazyChart(props: P) {
    return (
      <Suspense fallback={<ChartSkeleton />}>
        <Component {...props} />
      </Suspense>
    );
  };
}

const ScoreDistributionChartLazy = lazy(async () => ({
  default: (await charts()).ScoreDistributionChart,
}));
const GradeDistributionChartLazy = lazy(async () => ({
  default: (await charts()).GradeDistributionChart,
}));
const TrendChartLazy = lazy(async () => ({ default: (await charts()).TrendChart }));

export const ScoreDistributionChart = withChartSuspense<{ data: readonly ScoreBucket[] }>(
  ScoreDistributionChartLazy,
);
export const GradeDistributionChart = withChartSuspense<{ data: readonly GradeBucket[] }>(
  GradeDistributionChartLazy,
);
export const TrendChart = withChartSuspense<{ data: readonly TrendPoint[] }>(TrendChartLazy);
