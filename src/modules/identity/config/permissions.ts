/**
 * Permission catalogue — string based, never role based.
 * Components must check permissions, not role names.
 */

import type { Permission } from "@/modules/identity/types";

export const PERMISSIONS = {
  identityRead: "identity.read",
  identityWrite: "identity.write",
  learningRead: "learning.read",
  learningWrite: "learning.write",
  assessmentRead: "assessment.read",
  assessmentWrite: "assessment.write",
  analyticsRead: "analytics.read",
  tenantManage: "tenant.manage",
} as const satisfies Record<string, Permission>;

export type PermissionKey = keyof typeof PERMISSIONS;
