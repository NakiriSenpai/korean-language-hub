/**
 * Identity Domain — public entry point.
 * Other modules must import from `@/modules/identity`, never from internals.
 */

export type {
  AppRole,
  AuthStatus,
  IdentityContextValue,
  Membership,
  MembershipStatus,
  Permission,
  Profile,
  SignInInput,
  Tenant,
  TenantStatus,
} from "@/modules/identity/types";

export { PERMISSIONS } from "@/modules/identity/config/permissions";
export type { PermissionKey } from "@/modules/identity/config/permissions";
export { ROLES, ROLE_LIST, getRole } from "@/modules/identity/config/roles";
export type { RoleDefinition } from "@/modules/identity/config/roles";

export { IdentityProvider, useIdentity } from "@/modules/identity/components/IdentityProvider";
export { AuthGate, PermissionGate } from "@/modules/identity/components/PermissionGate";
export { SignInForm } from "@/modules/identity/components/SignInForm";
export { ForbiddenPage, UnauthorizedPage } from "@/modules/identity/components/AccessPages";

export { useAuth, useTenant, usePermissions } from "@/modules/identity/hooks/useAuth";

export { sessionManager } from "@/modules/identity/services/session.service";
export {
  resolveTenantSlugFromPath,
  resolveActiveMembership,
  toTenantPath,
} from "@/modules/identity/services/tenant.service";
