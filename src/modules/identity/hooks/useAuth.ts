import { useIdentity } from "@/modules/identity/components/IdentityProvider";
import type { IdentityContextValue } from "@/modules/identity/types";

/** Auth-only slice of the identity context. */
export function useAuth() {
  const identity = useIdentity();
  return {
    user: identity.user,
    session: identity.session,
    profile: identity.profile,
    status: identity.status,
    isAuthenticated: identity.isAuthenticated,
    isLoading: identity.isLoading,
    error: identity.error,
    signIn: identity.signIn,
    signOut: identity.signOut,
    refresh: identity.refresh,
  } as const;
}

/** Tenant + membership slice. */
export function useTenant() {
  const identity = useIdentity();
  return {
    tenant: identity.tenant,
    membership: identity.membership,
    memberships: identity.memberships,
    selectTenant: identity.selectTenant,
  } as const;
}

/** Role + permission slice. Components should check permissions, never roles. */
export function usePermissions(): Pick<
  IdentityContextValue,
  "role" | "permissions" | "can" | "canAny" | "canAll"
> {
  const { role, permissions, can, canAny, canAll } = useIdentity();
  return { role, permissions, can, canAny, canAll };
}
