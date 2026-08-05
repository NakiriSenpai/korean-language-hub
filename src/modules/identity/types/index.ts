/**
 * Identity Domain — types.
 * Mirrors the database contract (profiles, tenants, memberships, role_permissions).
 */

import type { Session, User } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];
export type MembershipStatus = Database["public"]["Enums"]["membership_status"];
export type TenantStatus = Database["public"]["Enums"]["tenant_status"];

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type TenantRow = Database["public"]["Tables"]["tenants"]["Row"];
export type MembershipRow = Database["public"]["Tables"]["memberships"]["Row"];

export interface Tenant {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly logoUrl: string | null;
  readonly status: TenantStatus;
}

export interface Profile {
  readonly id: string;
  readonly fullName: string | null;
  readonly avatarUrl: string | null;
  readonly phone: string | null;
}

export interface Membership {
  readonly id: string;
  readonly userId: string;
  readonly tenantId: string;
  readonly role: AppRole;
  readonly status: MembershipStatus;
  readonly tenant: Tenant;
}

/** Everything the app needs to know about "who is using it right now". */
export interface IdentityContextValue {
  readonly status: AuthStatus;
  readonly user: User | null;
  readonly session: Session | null;
  readonly profile: Profile | null;
  readonly memberships: readonly Membership[];
  readonly tenant: Tenant | null;
  readonly membership: Membership | null;
  readonly role: AppRole | null;
  readonly permissions: readonly Permission[];
  readonly isAuthenticated: boolean;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly signIn: (input: SignInInput) => Promise<void>;
  readonly signOut: () => Promise<void>;
  readonly refresh: () => Promise<void>;
  readonly selectTenant: (tenantId: string) => void;
  readonly can: (permission: Permission) => boolean;
  readonly canAny: (permissions: readonly Permission[]) => boolean;
  readonly canAll: (permissions: readonly Permission[]) => boolean;
}

export type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

export interface SignInInput {
  readonly email: string;
  readonly password: string;
}

/** Permissions are plain strings so new modules can extend them without a migration. */
export type Permission = string;
