/**
 * Tenant context resolution. Blueprint: tenant is resolved from the URL path
 * (`/t/<slug>/...`), with the last used tenant as fallback.
 */

import { storage } from "@/shared/platform";
import type { Membership, Tenant } from "@/modules/identity/types";

const ACTIVE_TENANT_KEY = "identity.activeTenantId";

/** Extracts the tenant slug from a pathname such as `/t/hangeul-jakarta/learning`. */
export function resolveTenantSlugFromPath(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length >= 2 && segments[0] === "t") return segments[1] ?? null;
  return null;
}

export function readStoredTenantId(): string | null {
  return storage.local.get<string>(ACTIVE_TENANT_KEY) ?? null;
}

export function writeStoredTenantId(tenantId: string | null): void {
  if (tenantId) storage.local.set(ACTIVE_TENANT_KEY, tenantId);
  else storage.local.remove(ACTIVE_TENANT_KEY);
}

export interface TenantResolutionInput {
  readonly memberships: readonly Membership[];
  readonly pathname: string;
  readonly selectedTenantId: string | null;
}

/**
 * Resolution order: explicit selection → URL slug → last used → first membership.
 */
export function resolveActiveMembership({
  memberships,
  pathname,
  selectedTenantId,
}: TenantResolutionInput): Membership | null {
  if (memberships.length === 0) return null;

  const bySelection = selectedTenantId
    ? memberships.find((m) => m.tenantId === selectedTenantId)
    : undefined;
  if (bySelection) return bySelection;

  const slug = resolveTenantSlugFromPath(pathname);
  const bySlug = slug ? memberships.find((m) => m.tenant.slug === slug) : undefined;
  if (bySlug) return bySlug;

  const storedId = readStoredTenantId();
  const byStorage = storedId ? memberships.find((m) => m.tenantId === storedId) : undefined;
  if (byStorage) return byStorage;

  return memberships[0] ?? null;
}

export const toTenantPath = (tenant: Tenant, path = ""): string =>
  `/t/${tenant.slug}${path.startsWith("/") ? path : path ? `/${path}` : ""}`;
