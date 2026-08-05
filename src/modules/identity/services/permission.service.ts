/**
 * Permission foundation. Resolves role → permission strings from the database,
 * so new permissions can be added without shipping new code.
 */

import { supabase } from "@/integrations/supabase/client";
import { AppError, handleError } from "@/shared/platform";
import type { AppRole, Permission } from "@/modules/identity/types";

export type PermissionMatrix = Readonly<Partial<Record<AppRole, readonly Permission[]>>>;

export async function fetchPermissionMatrix(): Promise<PermissionMatrix> {
  const { data, error } = await supabase.from("role_permissions").select("role, permission");

  if (error) {
    handleError(
      new AppError(error.message, { kind: "network", context: { scope: "identity.permissions" } }),
    );
    return {};
  }

  const matrix: Record<string, Permission[]> = {};
  for (const row of data ?? []) {
    (matrix[row.role] ??= []).push(row.permission);
  }
  return matrix as PermissionMatrix;
}

export function permissionsForRole(
  matrix: PermissionMatrix,
  role: AppRole | null,
): readonly Permission[] {
  if (!role) return [];
  return matrix[role] ?? [];
}

export const hasPermission = (granted: readonly Permission[], permission: Permission): boolean =>
  granted.includes(permission);

export const hasAnyPermission = (
  granted: readonly Permission[],
  permissions: readonly Permission[],
): boolean => permissions.some((permission) => granted.includes(permission));

export const hasAllPermissions = (
  granted: readonly Permission[],
  permissions: readonly Permission[],
): boolean => permissions.every((permission) => granted.includes(permission));
