/**
 * Analytics Domain — shared service plumbing.
 * Re-uses the Assessment Domain plumbing so error mapping stays identical.
 */

export {
  assertTenant,
  assertUser,
  toAssessmentError as toAnalyticsError,
  unwrap,
  unwrapList,
} from "@/modules/assessment/services/assessment-client";

export interface AnalyticsScope {
  readonly tenantId: string;
  readonly userId: string;
}

/** Inclusive start of an ISO date, in ISO timestamp form. */
export function startOfDay(date: string): string {
  return new Date(`${date}T00:00:00.000Z`).toISOString();
}

/** Inclusive end of an ISO date, in ISO timestamp form. */
export function endOfDay(date: string): string {
  return new Date(`${date}T23:59:59.999Z`).toISOString();
}
