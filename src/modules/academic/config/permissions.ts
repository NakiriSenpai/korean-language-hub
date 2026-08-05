/**
 * Academic Domain — permission catalogue.
 * String based, mirrored by `public.role_permissions` in the database.
 */

import type { Permission } from "@/modules/identity";

export const ACADEMIC_PERMISSIONS = {
  read: "academic.read",
  write: "academic.write",
  enrollmentRead: "enrollment.read",
  enrollmentWrite: "enrollment.write",
} as const satisfies Record<string, Permission>;

export type AcademicPermissionKey = keyof typeof ACADEMIC_PERMISSIONS;
