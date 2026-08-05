/**
 * Analytics & Insights Domain — public surface.
 * Read-only reporting on top of Academic, Learning, Assessment, and Exam data.
 */

export { ANALYTICS_PERMISSIONS } from "@/modules/analytics/config/permissions";
export type { AnalyticsPermissionKey } from "@/modules/analytics/config/permissions";

export * from "@/modules/analytics/types";

export { loadAnalyticsDataset } from "@/modules/analytics/services/dataset.service";
export type { DatasetOptions } from "@/modules/analytics/services/dataset.service";
export {
  describeFilter,
  isEmptyFilter,
  loadFilterOptions,
} from "@/modules/analytics/services/filter.service";
export {
  buildAssessmentAnalytics,
  buildGradeDistribution,
  buildGroupPerformance,
  buildOverview,
  buildScoreDistribution,
  buildStudentAnalytics,
  buildTeacherInsights,
  buildTrend,
  lessonCompletionRate,
  round,
} from "@/modules/analytics/services/aggregate";
export { loadPlatformSummary } from "@/modules/analytics/services/platform.service";
export {
  EXPORT_FORMATS,
  exportAnalytics,
  exportFileName,
} from "@/modules/analytics/services/export.service";

export {
  analyticsKeys,
  useAnalyticsDataset,
  useAnalyticsFilterOptions,
  useAnalyticsScope,
  useAnalyticsTenantId,
  useAnalyticsViews,
  usePlatformSummary,
} from "@/modules/analytics/hooks/useAnalytics";

export { StatCard } from "@/modules/analytics/components/StatCard";
export { formatDate, formatDuration, formatPercent } from "@/modules/analytics/utils/format";
export { DataTable } from "@/modules/analytics/components/DataTable";
export { FilterBar } from "@/modules/analytics/components/FilterBar";
export { ExportMenu } from "@/modules/analytics/components/ExportMenu";
export {
  GradeDistributionChart,
  ScoreDistributionChart,
  TrendChart,
} from "@/modules/analytics/components/LazyCharts";
