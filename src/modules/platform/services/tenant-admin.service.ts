/**
 * Engine 2 — Tenant Management.
 * Creating a tenant goes through the guarded `create_tenant` routine so the
 * creator always receives an owner membership. Deletion is not exposed: tenants
 * are archived instead, and no tenant can touch another tenant's row (RLS).
 */

import { supabase } from "@/integrations/supabase/client";
import type { AppRole, MembershipStatus, TenantStatus } from "@/modules/identity";
import {
  assertTenant,
  toPlatformError,
  unwrap,
  unwrapList,
} from "@/modules/platform/services/platform-client";
import type { DirectoryUser, TenantSummary } from "@/modules/platform/types";
import type { TenantInput, TenantUpdateInput } from "@/modules/platform/validation/schemas";

interface MembershipTenantRow {
  role: AppRole;
  status: MembershipStatus;
  tenant: {
    id: string;
    slug: string;
    name: string;
    logo_url: string | null;
    status: TenantStatus;
    created_at: string;
  } | null;
}

/** Tenant directory: every tenant the signed-in user holds a membership in. */
export async function listMyTenants(userId: string): Promise<readonly TenantSummary[]> {
  const rows = unwrapList(
    await supabase
      .from("memberships")
      .select("role, status, tenant:tenants(id, slug, name, logo_url, status, created_at)")
      .eq("user_id", userId)
      .eq("status", "active"),
    "platform.tenant.list",
  ) as readonly MembershipTenantRow[];

  const tenants = rows.filter((row) => row.tenant !== null);
  const counts = await memberCounts(tenants.map((row) => row.tenant!.id));

  return tenants
    .map((row) => ({
      id: row.tenant!.id,
      slug: row.tenant!.slug,
      name: row.tenant!.name,
      logoUrl: row.tenant!.logo_url,
      status: row.tenant!.status,
      role: row.role,
      memberCount: counts.get(row.tenant!.id) ?? 0,
      createdAt: row.tenant!.created_at,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "id-ID"));
}

async function memberCounts(tenantIds: readonly string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (tenantIds.length === 0) return counts;
  const rows = unwrapList(
    await supabase
      .from("memberships")
      .select("tenant_id")
      .in("tenant_id", [...tenantIds])
      .eq("status", "active"),
    "platform.tenant.memberCounts",
  ) as readonly { tenant_id: string }[];
  for (const row of rows) counts.set(row.tenant_id, (counts.get(row.tenant_id) ?? 0) + 1);
  return counts;
}

export async function createTenant(input: TenantInput): Promise<string> {
  const { data, error } = await supabase.rpc("create_tenant", {
    _slug: input.slug,
    _name: input.name,
  });
  if (error) throw toPlatformError(error, "platform.tenant.create");
  return data as string;
}

export async function updateTenant(tenantId: string, input: TenantUpdateInput): Promise<void> {
  assertTenant(tenantId, "platform.tenant.update");
  unwrap(
    await supabase
      .from("tenants")
      .update({ name: input.name, logo_url: input.logoUrl })
      .eq("id", tenantId)
      .select("id")
      .single(),
    "platform.tenant.update",
  );
}

/** Suspend, activate, or archive. Deleting a tenant is deliberately unsupported. */
export async function setTenantStatus(tenantId: string, status: TenantStatus): Promise<void> {
  assertTenant(tenantId, "platform.tenant.status");
  unwrap(
    await supabase.from("tenants").update({ status }).eq("id", tenantId).select("id").single(),
    "platform.tenant.status",
  );
}

/* ------------------------------ user directory ----------------------------- */

interface DirectoryRow {
  id: string;
  user_id: string;
  tenant_id: string;
  role: AppRole;
  status: MembershipStatus;
  created_at: string;
}

interface ProfileRow {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
}

/**
 * Memberships and profiles have no direct foreign key (profiles point at
 * auth.users), so the directory joins them in two tenant-scoped reads.
 */
export async function listDirectoryUsers(tenantId: string): Promise<readonly DirectoryUser[]> {
  assertTenant(tenantId, "platform.users.list");
  const rows = unwrapList(
    await supabase
      .from("memberships")
      .select("id, user_id, tenant_id, role, status, created_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: true }),
    "platform.users.list",
  ) as readonly DirectoryRow[];

  const userIds = [...new Set(rows.map((row) => row.user_id))];
  const profiles = userIds.length
    ? ((unwrapList(
        await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, phone")
          .in("id", userIds),
        "platform.users.profiles",
      ) as readonly ProfileRow[]) ?? [])
    : [];
  const byId = new Map(profiles.map((profile) => [profile.id, profile]));

  return rows.map((row) => {
    const profile = byId.get(row.user_id);
    return {
      membershipId: row.id,
      userId: row.user_id,
      tenantId: row.tenant_id,
      fullName: profile?.full_name ?? "Tanpa nama",
      avatarUrl: profile?.avatar_url ?? null,
      phone: profile?.phone ?? null,
      role: row.role,
      status: row.status,
      joinedAt: row.created_at,
    };
  });
}

/** Role change. Audited automatically by the `memberships_audit` trigger. */
export async function updateMembershipRole(membershipId: string, role: AppRole): Promise<void> {
  unwrap(
    await supabase
      .from("memberships")
      .update({ role })
      .eq("id", membershipId)
      .select("id")
      .single(),
    "platform.users.role",
  );
}

export async function updateMembershipStatus(
  membershipId: string,
  status: MembershipStatus,
): Promise<void> {
  unwrap(
    await supabase
      .from("memberships")
      .update({ status })
      .eq("id", membershipId)
      .select("id")
      .single(),
    "platform.users.status",
  );
}
