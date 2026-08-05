import type { ReactNode } from "react";

import { useIdentity } from "@/modules/identity/components/IdentityProvider";
import type { Permission } from "@/modules/identity/types";
import { RouteLoading } from "@/shared/components/shell";
import { ForbiddenPage, UnauthorizedPage } from "@/modules/identity/components/AccessPages";

export interface PermissionGateProps {
  readonly children: ReactNode;
  /** All of these permissions are required. */
  readonly required?: readonly Permission[];
  /** At least one of these permissions is required. */
  readonly anyOf?: readonly Permission[];
  readonly fallback?: ReactNode;
}

/**
 * Renders children only when the current membership grants the permissions.
 * UI-level gate — the database RLS remains the real boundary.
 */
export function PermissionGate({ children, required, anyOf, fallback }: PermissionGateProps) {
  const { isLoading, isAuthenticated, canAll, canAny } = useIdentity();

  if (isLoading) return <RouteLoading />;
  if (!isAuthenticated) return fallback ?? <UnauthorizedPage />;

  const allowed =
    (!required || required.length === 0 || canAll(required)) &&
    (!anyOf || anyOf.length === 0 || canAny(anyOf));

  if (!allowed) return fallback ?? <ForbiddenPage />;
  return <>{children}</>;
}

export interface AuthGateProps {
  readonly children: ReactNode;
  readonly fallback?: ReactNode;
}

/** Renders children only for an authenticated user with an active membership. */
export function AuthGate({ children, fallback }: AuthGateProps) {
  const { isLoading, isAuthenticated } = useIdentity();
  if (isLoading) return <RouteLoading />;
  if (!isAuthenticated) return fallback ?? <UnauthorizedPage />;
  return <>{children}</>;
}
