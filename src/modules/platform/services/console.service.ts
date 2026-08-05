/**
 * Engine 1 — Platform Console.
 * Read-only aggregate over existing domains plus lightweight health probes.
 */

import { supabase } from "@/integrations/supabase/client";
import { assertTenant } from "@/modules/platform/services/platform-client";
import type { HealthCheck, PlatformStats, TenantSummary } from "@/modules/platform/types";

async function countRows(table: string, tenantId: string): Promise<number> {
  const { count, error } = await supabase
    .from(table as never)
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId);
  if (error) return 0;
  return count ?? 0;
}

export async function getPlatformStats(
  tenantId: string,
  tenants: readonly TenantSummary[],
): Promise<PlatformStats> {
  assertTenant(tenantId, "platform.console.stats");
  const [memberCount, studentCount, courseCount, assessmentCount, examAttemptCount, mediaCount] =
    await Promise.all([
      countRows("memberships", tenantId),
      countRows("student_profiles", tenantId),
      countRows("courses", tenantId),
      countRows("assessments", tenantId),
      countRows("exam_attempts", tenantId),
      countRows("media_assets", tenantId),
    ]);

  return {
    tenantCount: tenants.length,
    activeTenantCount: tenants.filter((tenant) => tenant.status === "active").length,
    memberCount,
    studentCount,
    courseCount,
    assessmentCount,
    examAttemptCount,
    mediaCount,
  };
}

/**
 * Health probes are derived from data the console already loaded, so the panel
 * costs no extra round trip and degrades gracefully.
 */
export function buildHealthChecks(
  stats: PlatformStats,
  online: boolean,
  lastAuditAt: string | null,
): readonly HealthCheck[] {
  const auditAgeHours = lastAuditAt
    ? (Date.now() - new Date(lastAuditAt).getTime()) / 3_600_000
    : null;

  return [
    {
      id: "connectivity",
      label: "Konektivitas",
      level: online ? "ok" : "down",
      detail: online ? "Perangkat terhubung ke jaringan." : "Perangkat sedang offline.",
    },
    {
      id: "database",
      label: "Basis data",
      level: stats.memberCount > 0 ? "ok" : "warn",
      detail:
        stats.memberCount > 0
          ? `${stats.memberCount} keanggotaan aktif terbaca.`
          : "Belum ada keanggotaan terbaca untuk lembaga ini.",
    },
    {
      id: "content",
      label: "Konten",
      level: stats.courseCount + stats.assessmentCount > 0 ? "ok" : "warn",
      detail: `${stats.courseCount} kursus dan ${stats.assessmentCount} asesmen tersedia.`,
    },
    {
      id: "audit",
      label: "Jejak audit",
      level: auditAgeHours === null ? "warn" : auditAgeHours < 720 ? "ok" : "warn",
      detail:
        auditAgeHours === null
          ? "Belum ada entri audit tercatat."
          : `Entri terakhir ${Math.round(auditAgeHours)} jam lalu.`,
    },
  ];
}
