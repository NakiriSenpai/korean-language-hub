/**
 * Engine 7 — Media Manager.
 * Cloudinary holds the binary; this table is the tenant-scoped catalogue used
 * by every content picker in the app.
 */

import { supabase } from "@/integrations/supabase/client";
import { assertTenant, unwrap, unwrapList } from "@/modules/platform/services/platform-client";
import type { MediaAsset, MediaKind } from "@/modules/platform/types";
import type { MediaAssetInput } from "@/modules/platform/validation/schemas";

const MEDIA_COLUMNS =
  "id, tenant_id, kind, title, public_id, url, format, bytes, width, height, folder, created_by, created_at";

interface MediaRow {
  id: string;
  tenant_id: string;
  kind: MediaKind;
  title: string;
  public_id: string;
  url: string;
  format: string | null;
  bytes: number | null;
  width: number | null;
  height: number | null;
  folder: string | null;
  created_by: string | null;
  created_at: string;
}

function toAsset(row: MediaRow): MediaAsset {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    kind: row.kind,
    title: row.title,
    publicId: row.public_id,
    url: row.url,
    format: row.format,
    bytes: row.bytes,
    width: row.width,
    height: row.height,
    folder: row.folder,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

export interface MediaFilter {
  readonly kind?: MediaKind;
  readonly search?: string;
}

export async function listMediaAssets(
  tenantId: string,
  filter: MediaFilter = {},
): Promise<readonly MediaAsset[]> {
  assertTenant(tenantId, "platform.media.list");
  let query = supabase
    .from("media_assets")
    .select(MEDIA_COLUMNS)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (filter.kind) query = query.eq("kind", filter.kind);
  if (filter.search) query = query.ilike("title", `%${filter.search}%`);

  const rows = unwrapList(await query, "platform.media.list") as readonly MediaRow[];
  return rows.map(toAsset);
}

export async function registerMediaAsset(
  tenantId: string,
  userId: string,
  input: MediaAssetInput,
): Promise<MediaAsset> {
  assertTenant(tenantId, "platform.media.create");
  const row = unwrap(
    await supabase
      .from("media_assets")
      .insert({
        tenant_id: tenantId,
        kind: input.kind,
        title: input.title,
        public_id: input.publicId,
        url: input.url,
        format: input.format,
        bytes: input.bytes,
        width: input.width,
        height: input.height,
        folder: input.folder,
        created_by: userId,
      })
      .select(MEDIA_COLUMNS)
      .single(),
    "platform.media.create",
  ) as MediaRow;
  return toAsset(row);
}

export async function deleteMediaAsset(tenantId: string, assetId: string): Promise<void> {
  assertTenant(tenantId, "platform.media.delete");
  const { error } = await supabase
    .from("media_assets")
    .delete()
    .eq("id", assetId)
    .eq("tenant_id", tenantId);
  if (error) throw error;
}
