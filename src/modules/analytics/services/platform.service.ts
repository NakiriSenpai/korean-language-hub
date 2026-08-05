/**
 * Engine 4 — Platform insights.
 *
 * Cross-institution view, limited to the institutions the current user owns.
 * Row Level Security remains the real boundary: an owner can only ever read
 * tenants they are an active member of.
 */

import { supabase } from "@/integrations/supabase/client";
import { assertUser, unwrapList } from "@/modules/analytics/services/analytics-client";
import { buildOverview, lessonCompletionRate } from "@/modules/analytics/services/aggregate";
import { loadAnalyticsDataset } from "@/modules/analytics/services/dataset.service";
import { EMPTY_ANALYTICS_FILTER } from "@/modules/analytics/types";
import type { AnalyticsFilter, PlatformSummary, TenantSummary } from "@/modules/analytics/types";

interface OwnedTenantRow {
  tenant_id: string;
  role: string;
  tenants: { id: string; name: string } | null;
}

export async function loadPlatformSummary(
  userId: string,
  filter: AnalyticsFilter = EMPTY_ANALYTICS_FILTER,
): Promise<PlatformSummary> {
  assertUser(userId, "analytics.platform");

  const rows = unwrapList(
    await supabase
      .from("memberships")
      .select("tenant_id, role, tenants!inner(id, name)")
      .eq("user_id", userId)
      .eq("status", "active")
      .in("role", ["owner", "admin"]),
    "analytics.platform.tenants",
  ) as unknown as readonly OwnedTenantRow[];

  const tenants: TenantSummary[] = [];
  for (const row of rows) {
    const dataset = await loadAnalyticsDataset(row.tenant_id, { filter });
    const overview = buildOverview(dataset);
    tenants.push({
      tenantId: row.tenant_id,
      tenantName: row.tenants?.name ?? "Lembaga",
      studentCount: dataset.students.length,
      studyGroupCount: new Set(
        dataset.students.map((student) => student.studyGroupId).filter(Boolean),
      ).size,
      examCount: overview.examCount,
      averageScore: overview.averageScore,
      passRate: overview.passRate,
      lessonCompletionRate: lessonCompletionRate(dataset),
    });
  }

  const totalExams = tenants.reduce((sum, tenant) => sum + tenant.examCount, 0);
  const weighted = tenants.reduce((sum, tenant) => sum + tenant.averageScore * tenant.examCount, 0);
  const weightedPass = tenants.reduce((sum, tenant) => sum + tenant.passRate * tenant.examCount, 0);

  return {
    tenants: tenants.sort((a, b) => b.examCount - a.examCount),
    totalStudents: tenants.reduce((sum, tenant) => sum + tenant.studentCount, 0),
    totalExams,
    averageScore: totalExams > 0 ? Math.round((weighted / totalExams) * 10) / 10 : 0,
    passRate: totalExams > 0 ? Math.round((weightedPass / totalExams) * 10) / 10 : 0,
  };
}
