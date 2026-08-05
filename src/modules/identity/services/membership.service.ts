/**
 * Membership engine — reads the User / Tenant / Membership / Status / Role graph.
 */

import { supabase } from "@/integrations/supabase/client";
import { AppError, handleError } from "@/shared/platform";
import type { Membership, Profile, Tenant } from "@/modules/identity/types";

interface MembershipQueryRow {
  id: string;
  user_id: string;
  tenant_id: string;
  role: Membership["role"];
  status: Membership["status"];
  tenants: {
    id: string;
    slug: string;
    name: string;
    logo_url: string | null;
    status: Tenant["status"];
  } | null;
}

const toTenant = (row: NonNullable<MembershipQueryRow["tenants"]>): Tenant => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  logoUrl: row.logo_url,
  status: row.status,
});

/** Active memberships of the signed-in user, tenant included. */
export async function fetchMemberships(userId: string): Promise<readonly Membership[]> {
  const { data, error } = await supabase
    .from("memberships")
    .select("id, user_id, tenant_id, role, status, tenants(id, slug, name, logo_url, status)")
    .eq("user_id", userId)
    .eq("status", "active");

  if (error) {
    handleError(
      new AppError(error.message, { kind: "network", context: { scope: "identity.memberships" } }),
    );
    return [];
  }

  return ((data ?? []) as MembershipQueryRow[])
    .filter(
      (row): row is MembershipQueryRow & { tenants: NonNullable<MembershipQueryRow["tenants"]> } =>
        row.tenants !== null,
    )
    .map((row) => ({
      id: row.id,
      userId: row.user_id,
      tenantId: row.tenant_id,
      role: row.role,
      status: row.status,
      tenant: toTenant(row.tenants),
    }));
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, phone")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    handleError(
      new AppError(error.message, { kind: "network", context: { scope: "identity.profile" } }),
    );
    return null;
  }
  if (!data) return null;

  return {
    id: data.id,
    fullName: data.full_name,
    avatarUrl: data.avatar_url,
    phone: data.phone,
  };
}
