import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouterState } from "@tanstack/react-router";
import type { Session, User } from "@supabase/supabase-js";

import { handleError, logger } from "@/shared/platform";
import * as authService from "@/modules/identity/services/auth.service";
import { sessionManager } from "@/modules/identity/services/session.service";
import { fetchMemberships, fetchProfile } from "@/modules/identity/services/membership.service";
import {
  fetchPermissionMatrix,
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  permissionsForRole,
  type PermissionMatrix,
} from "@/modules/identity/services/permission.service";
import {
  resolveActiveMembership,
  writeStoredTenantId,
} from "@/modules/identity/services/tenant.service";
import type {
  AuthStatus,
  IdentityContextValue,
  Membership,
  Permission,
  Profile,
  SignInInput,
} from "@/modules/identity/types";

const IdentityContext = createContext<IdentityContextValue | null>(null);

interface IdentityState {
  readonly status: AuthStatus;
  readonly user: User | null;
  readonly session: Session | null;
  readonly profile: Profile | null;
  readonly memberships: readonly Membership[];
  readonly matrix: PermissionMatrix;
  readonly error: string | null;
}

const INITIAL: IdentityState = {
  status: "loading",
  user: null,
  session: null,
  profile: null,
  memberships: [],
  matrix: {},
  error: null,
};

export interface IdentityProviderProps {
  readonly children: ReactNode;
}

/**
 * Single source of truth for authentication, membership, tenant, role and
 * permission state. Mounted once, below the PlatformProvider.
 */
export function IdentityProvider({ children }: IdentityProviderProps) {
  const [state, setState] = useState<IdentityState>(INITIAL);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const loadIdentity = useCallback(async (session: Session | null): Promise<void> => {
    if (!session?.user) {
      setState({ ...INITIAL, status: "unauthenticated" });
      return;
    }

    const [profile, memberships, matrix] = await Promise.all([
      fetchProfile(session.user.id),
      fetchMemberships(session.user.id),
      fetchPermissionMatrix(),
    ]);

    setState({
      status: "authenticated",
      user: session.user,
      session,
      profile,
      memberships,
      matrix,
      error: null,
    });
  }, []);

  // Session restore + session listener.
  useEffect(() => {
    let cancelled = false;

    const unsubscribe = authService.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === "SIGNED_OUT") {
        sessionManager.cleanup();
        setState({ ...INITIAL, status: "unauthenticated" });
        setSelectedTenantId(null);
        return;
      }
      if (event === "TOKEN_REFRESHED") {
        sessionManager.set(session, "refreshed");
        return;
      }
      if (event === "SIGNED_IN" || event === "USER_UPDATED" || event === "INITIAL_SESSION") {
        sessionManager.set(session);
        void loadIdentity(session);
      }
    });

    void (async () => {
      const session = await sessionManager.start();
      if (cancelled) return;
      await loadIdentity(session);
    })();

    const unsubscribeSession = sessionManager.subscribe((event) => {
      if (event === "expired") {
        logger.warn("Session expired");
        setState({ ...INITIAL, status: "unauthenticated" });
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
      unsubscribeSession();
    };
  }, [loadIdentity]);

  const membership = useMemo(
    () => resolveActiveMembership({ memberships: state.memberships, pathname, selectedTenantId }),
    [state.memberships, pathname, selectedTenantId],
  );

  useEffect(() => {
    writeStoredTenantId(membership?.tenantId ?? null);
  }, [membership]);

  const permissions = useMemo(
    () => permissionsForRole(state.matrix, membership?.role ?? null),
    [state.matrix, membership],
  );

  const signIn = useCallback(
    async (input: SignInInput) => {
      setState((prev) => ({ ...prev, status: "loading", error: null }));
      try {
        const session = await authService.signIn(input);
        sessionManager.set(session, "updated");
        await loadIdentity(session);
      } catch (error) {
        const appError = handleError(error, { scope: "identity.signIn" });
        setState((prev) => ({ ...prev, status: "unauthenticated", error: appError.message }));
        throw appError;
      }
    },
    [loadIdentity],
  );

  const signOut = useCallback(async () => {
    await authService.signOut();
    sessionManager.cleanup();
    setSelectedTenantId(null);
    setState({ ...INITIAL, status: "unauthenticated" });
  }, []);

  const refresh = useCallback(async () => {
    const session = await sessionManager.refresh();
    await loadIdentity(session);
  }, [loadIdentity]);

  const value = useMemo<IdentityContextValue>(
    () => ({
      status: state.status,
      user: state.user,
      session: state.session,
      profile: state.profile,
      memberships: state.memberships,
      tenant: membership?.tenant ?? null,
      membership,
      role: membership?.role ?? null,
      permissions,
      isAuthenticated: state.status === "authenticated",
      isLoading: state.status === "loading" || state.status === "idle",
      error: state.error,
      signIn,
      signOut,
      refresh,
      selectTenant: setSelectedTenantId,
      can: (permission: Permission) => hasPermission(permissions, permission),
      canAny: (list: readonly Permission[]) => hasAnyPermission(permissions, list),
      canAll: (list: readonly Permission[]) => hasAllPermissions(permissions, list),
    }),
    [state, membership, permissions, signIn, signOut, refresh],
  );

  return <IdentityContext.Provider value={value}>{children}</IdentityContext.Provider>;
}

export function useIdentity(): IdentityContextValue {
  const context = useContext(IdentityContext);
  if (!context) throw new Error("useIdentity must be used within an IdentityProvider.");
  return context;
}
