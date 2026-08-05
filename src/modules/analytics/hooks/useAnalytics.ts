/**
 * Analytics Domain — React Query bindings.
 *
 * Read-only, tenant scoped, permission aware. Students automatically fall back
 * to a self-only dataset; the cohort scope requires `enrollment.read`, which
 * only staff and above hold.
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { useAuth, usePermissions, useTenant } from "@/modules/identity";
import { ANALYTICS_PERMISSIONS } from "@/modules/analytics/config/permissions";
import {
  buildAssessmentAnalytics,
  buildOverview,
  buildStudentAnalytics,
  buildTeacherInsights,
  lessonCompletionRate,
} from "@/modules/analytics/services/aggregate";
import { loadAnalyticsDataset } from "@/modules/analytics/services/dataset.service";
import { loadFilterOptions } from "@/modules/analytics/services/filter.service";
import { loadPlatformSummary } from "@/modules/analytics/services/platform.service";
import type { AnalyticsDataset, AnalyticsFilter } from "@/modules/analytics/types";

/** Holding this permission means the user may look beyond their own results. */
const COHORT_SCOPE_PERMISSION = "enrollment.read";

export const analyticsKeys = {
  all: (tenantId: string) => ["analytics", tenantId] as const,
  options: (tenantId: string) => ["analytics", tenantId, "filter-options"] as const,
  dataset: (tenantId: string, scope: string, filter: AnalyticsFilter) =>
    ["analytics", tenantId, "dataset", scope, filter] as const,
  platform: (userId: string, filter: AnalyticsFilter) =>
    ["analytics", "platform", userId, filter] as const,
};

export function useAnalyticsTenantId(): string {
  const { tenant } = useTenant();
  return tenant?.id ?? "";
}

/** Which slice of the institution the current user is allowed to analyse. */
export function useAnalyticsScope() {
  const { can } = usePermissions();
  const { user } = useAuth();
  const cohort = can(COHORT_SCOPE_PERMISSION);
  return {
    canRead: can(ANALYTICS_PERMISSIONS.read),
    canExport: can(ANALYTICS_PERMISSIONS.export),
    canViewPlatform: can(ANALYTICS_PERMISSIONS.platform),
    isCohortScope: cohort,
    restrictToUserId: cohort ? null : (user?.id ?? null),
  } as const;
}

export function useAnalyticsFilterOptions() {
  const tenantId = useAnalyticsTenantId();
  const { isCohortScope } = useAnalyticsScope();
  return useQuery({
    queryKey: analyticsKeys.options(tenantId),
    queryFn: () => loadFilterOptions(tenantId),
    enabled: tenantId.length > 0 && isCohortScope,
    staleTime: 5 * 60_000,
  });
}

export function useAnalyticsDataset(filter: AnalyticsFilter) {
  const tenantId = useAnalyticsTenantId();
  const { restrictToUserId, canRead } = useAnalyticsScope();
  return useQuery({
    queryKey: analyticsKeys.dataset(tenantId, restrictToUserId ?? "cohort", filter),
    queryFn: () => loadAnalyticsDataset(tenantId, { filter, restrictToUserId }),
    enabled: tenantId.length > 0 && canRead,
    staleTime: 60_000,
  });
}

/** Derived views — memoised so charts do not recompute on every render. */
export function useAnalyticsViews(dataset: AnalyticsDataset | undefined) {
  return useMemo(() => {
    if (!dataset) return null;
    return {
      overview: buildOverview(dataset),
      students: buildStudentAnalytics(dataset),
      assessments: buildAssessmentAnalytics(dataset),
      teacher: buildTeacherInsights(dataset),
      lessonCompletionRate: lessonCompletionRate(dataset),
    };
  }, [dataset]);
}

export function usePlatformSummary(filter: AnalyticsFilter) {
  const { user } = useAuth();
  const { canViewPlatform } = useAnalyticsScope();
  const userId = user?.id ?? "";
  return useQuery({
    queryKey: analyticsKeys.platform(userId, filter),
    queryFn: () => loadPlatformSummary(userId, filter),
    enabled: userId.length > 0 && canViewPlatform,
    staleTime: 5 * 60_000,
  });
}
