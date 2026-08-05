/**
 * Learning Domain — permission catalogue.
 * String based and mirrored by `public.role_permissions`.
 */

import type { Permission } from "@/modules/identity";

export const LEARNING_PERMISSIONS = {
  read: "learning.read",
  write: "learning.write",
} as const satisfies Record<string, Permission>;

export type LearningPermissionKey = keyof typeof LEARNING_PERMISSIONS;
