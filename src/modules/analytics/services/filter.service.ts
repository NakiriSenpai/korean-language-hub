/**
 * Engine 6 — Filter Engine.
 * Loads the option lists used by the analytics filter bar and normalises the
 * filter itself. Everything is tenant scoped and read-only.
 */

import { supabase } from "@/integrations/supabase/client";
import { assertTenant, unwrapList } from "@/modules/analytics/services/analytics-client";
import type { AnalyticsFilter, AnalyticsFilterOptions } from "@/modules/analytics/types";

interface PeriodRow {
  id: string;
  name: string;
  code: string;
  starts_on: string;
}
interface GroupRow {
  id: string;
  name: string;
  code: string;
  period_id: string;
}
interface AssessmentRow {
  id: string;
  title: string;
  type: string;
}
interface StudentRow {
  id: string;
  user_id: string | null;
  full_name: string;
  student_number: string;
}

export async function loadFilterOptions(tenantId: string): Promise<AnalyticsFilterOptions> {
  assertTenant(tenantId, "analytics.filter.options");

  const [periods, groups, assessments, students] = await Promise.all([
    supabase
      .from("academic_periods")
      .select("id, name, code, starts_on")
      .eq("tenant_id", tenantId)
      .order("starts_on", { ascending: false }),
    supabase
      .from("study_groups")
      .select("id, name, code, period_id")
      .eq("tenant_id", tenantId)
      .order("name", { ascending: true }),
    supabase
      .from("assessments")
      .select("id, title, type")
      .eq("tenant_id", tenantId)
      .order("title", { ascending: true }),
    supabase
      .from("student_profiles")
      .select("id, user_id, full_name, student_number")
      .eq("tenant_id", tenantId)
      .order("full_name", { ascending: true }),
  ]);

  const periodRows = unwrapList(periods, "analytics.filter.periods") as readonly PeriodRow[];
  const groupRows = unwrapList(groups, "analytics.filter.groups") as readonly GroupRow[];
  const assessmentRows = unwrapList(
    assessments,
    "analytics.filter.assessments",
  ) as readonly AssessmentRow[];
  const studentRows = unwrapList(students, "analytics.filter.students") as readonly StudentRow[];

  return {
    periods: periodRows.map((row) => ({ id: row.id, label: row.name, hint: row.code })),
    studyGroups: groupRows.map((row) => ({
      id: row.id,
      label: row.name,
      hint: row.code,
      periodId: row.period_id,
    })),
    assessments: assessmentRows.map((row) => ({ id: row.id, label: row.title, hint: row.type })),
    students: studentRows
      .filter((row): row is StudentRow & { user_id: string } => Boolean(row.user_id))
      .map((row) => ({ id: row.user_id, label: row.full_name, hint: row.student_number })),
  };
}

/** True when no dimension is constrained. */
export function isEmptyFilter(filter: AnalyticsFilter): boolean {
  return (
    filter.periodIds.length === 0 &&
    filter.studyGroupIds.length === 0 &&
    filter.assessmentIds.length === 0 &&
    filter.studentUserIds.length === 0 &&
    !filter.dateFrom &&
    !filter.dateTo
  );
}

/** Short human readable summary of the active filter, used in export headers. */
export function describeFilter(
  filter: AnalyticsFilter,
  options: AnalyticsFilterOptions | undefined,
): string {
  if (!options || isEmptyFilter(filter)) return "Semua data";

  const label = (list: readonly { id: string; label: string }[], ids: readonly string[]) =>
    ids
      .map((id) => list.find((item) => item.id === id)?.label ?? id)
      .filter(Boolean)
      .join(", ");

  const parts: string[] = [];
  if (filter.periodIds.length) parts.push(`Gelombang: ${label(options.periods, filter.periodIds)}`);
  if (filter.studyGroupIds.length)
    parts.push(`Kelas: ${label(options.studyGroups, filter.studyGroupIds)}`);
  if (filter.assessmentIds.length)
    parts.push(`Asesmen: ${label(options.assessments, filter.assessmentIds)}`);
  if (filter.studentUserIds.length)
    parts.push(`Peserta: ${label(options.students, filter.studentUserIds)}`);
  if (filter.dateFrom || filter.dateTo)
    parts.push(`Tanggal: ${filter.dateFrom ?? "awal"} s/d ${filter.dateTo ?? "kini"}`);
  return parts.join(" • ");
}
