/**
 * Analytics Domain — permission catalogue.
 * Permission strings only; direct role checks are forbidden in this domain.
 */

import type { Permission } from "@/modules/identity";

export const ANALYTICS_PERMISSIONS = {
  /** Read dashboards. Students only ever see their own aggregate. */
  read: "analytics.read",
  /** Export the currently filtered dataset (Excel / PDF / CSV). */
  export: "analytics.export",
  /** Cross-institution insights, limited to institutions the user owns. */
  platform: "analytics.platform",
} as const satisfies Record<string, Permission>;

export type AnalyticsPermissionKey = keyof typeof ANALYTICS_PERMISSIONS;
