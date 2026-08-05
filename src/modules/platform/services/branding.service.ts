/**
 * Engine 3 — Tenant Branding.
 * Branding only feeds design tokens and contact details; it never changes the
 * structure of the UI.
 */

import { supabase } from "@/integrations/supabase/client";
import { assertTenant, unwrap, unwrapList } from "@/modules/platform/services/platform-client";
import type { TenantBranding } from "@/modules/platform/types";
import type { BrandingInput } from "@/modules/platform/validation/schemas";

const BRANDING_COLUMNS =
  "id, tenant_id, logo_url, cover_url, primary_color, secondary_color, contact_email, contact_phone, address, updated_at";

interface BrandingRow {
  id: string;
  tenant_id: string;
  logo_url: string | null;
  cover_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  updated_at: string;
}

function toBranding(row: BrandingRow): TenantBranding {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    logoUrl: row.logo_url,
    coverUrl: row.cover_url,
    primaryColor: row.primary_color,
    secondaryColor: row.secondary_color,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    address: row.address,
    updatedAt: row.updated_at,
  };
}

export async function getBranding(tenantId: string): Promise<TenantBranding | null> {
  assertTenant(tenantId, "platform.branding.get");
  const rows = unwrapList(
    await supabase
      .from("tenant_branding")
      .select(BRANDING_COLUMNS)
      .eq("tenant_id", tenantId)
      .limit(1),
    "platform.branding.get",
  ) as readonly BrandingRow[];
  const row = rows[0];
  return row ? toBranding(row) : null;
}

/** Upsert keyed on tenant_id — one branding record per tenant. */
export async function saveBranding(
  tenantId: string,
  userId: string,
  input: BrandingInput,
): Promise<TenantBranding> {
  assertTenant(tenantId, "platform.branding.save");
  const row = unwrap(
    await supabase
      .from("tenant_branding")
      .upsert(
        {
          tenant_id: tenantId,
          logo_url: input.logoUrl,
          cover_url: input.coverUrl,
          primary_color: input.primaryColor,
          secondary_color: input.secondaryColor,
          contact_email: input.contactEmail,
          contact_phone: input.contactPhone,
          address: input.address,
          updated_by: userId,
        },
        { onConflict: "tenant_id" },
      )
      .select(BRANDING_COLUMNS)
      .single(),
    "platform.branding.save",
  ) as BrandingRow;
  return toBranding(row);
}

/**
 * Maps branding colours onto the existing design tokens. Returns inline CSS
 * variables only — no structural styling is produced here.
 */
export function brandingCssVariables(
  branding: TenantBranding | null,
): Record<string, string> | undefined {
  if (!branding) return undefined;
  const vars: Record<string, string> = {};
  if (branding.primaryColor) vars["--brand-primary"] = branding.primaryColor;
  if (branding.secondaryColor) vars["--brand-secondary"] = branding.secondaryColor;
  return Object.keys(vars).length > 0 ? vars : undefined;
}
