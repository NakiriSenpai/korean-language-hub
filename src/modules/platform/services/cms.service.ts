/**
 * Engine 6 + 8 — Announcements and CMS blocks.
 * Both are tenant-scoped publishable content; announcements are time-based
 * messages while CMS blocks are reusable page fragments.
 */

import { supabase } from "@/integrations/supabase/client";
import { assertTenant, unwrap, unwrapList } from "@/modules/platform/services/platform-client";
import type {
  Announcement,
  AnnouncementAudience,
  AnnouncementStatus,
  CmsBlock,
  CmsBlockKind,
  ContentStatus,
} from "@/modules/platform/types";
import type { AnnouncementInput, CmsBlockInput } from "@/modules/platform/validation/schemas";

/* ------------------------------ announcements ------------------------------ */

const ANNOUNCEMENT_COLUMNS =
  "id, tenant_id, title, body, audience, study_group_id, status, pinned, published_at, created_at, updated_at";

interface AnnouncementRow {
  id: string;
  tenant_id: string;
  title: string;
  body: string;
  audience: AnnouncementAudience;
  study_group_id: string | null;
  status: AnnouncementStatus;
  pinned: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

function toAnnouncement(row: AnnouncementRow): Announcement {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    title: row.title,
    body: row.body,
    audience: row.audience,
    studyGroupId: row.study_group_id,
    status: row.status,
    pinned: row.pinned,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listAnnouncements(tenantId: string): Promise<readonly Announcement[]> {
  assertTenant(tenantId, "platform.announcement.list");
  const rows = unwrapList(
    await supabase
      .from("announcements")
      .select(ANNOUNCEMENT_COLUMNS)
      .eq("tenant_id", tenantId)
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false }),
    "platform.announcement.list",
  ) as readonly AnnouncementRow[];
  return rows.map(toAnnouncement);
}

export async function createAnnouncement(
  tenantId: string,
  userId: string,
  input: AnnouncementInput,
): Promise<Announcement> {
  assertTenant(tenantId, "platform.announcement.create");
  const row = unwrap(
    await supabase
      .from("announcements")
      .insert({
        tenant_id: tenantId,
        title: input.title,
        body: input.body,
        audience: input.audience,
        study_group_id: input.studyGroupId,
        pinned: input.pinned,
        created_by: userId,
      })
      .select(ANNOUNCEMENT_COLUMNS)
      .single(),
    "platform.announcement.create",
  ) as AnnouncementRow;
  return toAnnouncement(row);
}

export async function updateAnnouncement(
  tenantId: string,
  announcementId: string,
  input: AnnouncementInput,
): Promise<Announcement> {
  assertTenant(tenantId, "platform.announcement.update");
  const row = unwrap(
    await supabase
      .from("announcements")
      .update({
        title: input.title,
        body: input.body,
        audience: input.audience,
        study_group_id: input.studyGroupId,
        pinned: input.pinned,
      })
      .eq("id", announcementId)
      .eq("tenant_id", tenantId)
      .select(ANNOUNCEMENT_COLUMNS)
      .single(),
    "platform.announcement.update",
  ) as AnnouncementRow;
  return toAnnouncement(row);
}

/** Draft → published → archived. Publishing stamps `published_at` once. */
export async function setAnnouncementStatus(
  tenantId: string,
  announcementId: string,
  status: AnnouncementStatus,
): Promise<Announcement> {
  assertTenant(tenantId, "platform.announcement.status");
  const row = unwrap(
    await supabase
      .from("announcements")
      .update({
        status,
        published_at: status === "published" ? new Date().toISOString() : null,
      })
      .eq("id", announcementId)
      .eq("tenant_id", tenantId)
      .select(ANNOUNCEMENT_COLUMNS)
      .single(),
    "platform.announcement.status",
  ) as AnnouncementRow;
  return toAnnouncement(row);
}

export async function deleteAnnouncement(tenantId: string, announcementId: string): Promise<void> {
  assertTenant(tenantId, "platform.announcement.delete");
  const { error } = await supabase
    .from("announcements")
    .delete()
    .eq("id", announcementId)
    .eq("tenant_id", tenantId);
  if (error) throw error;
}

/* --------------------------------- cms blocks ------------------------------- */

const CMS_COLUMNS =
  "id, tenant_id, kind, title, slug, body, image_url, link_url, status, position, created_at, updated_at";

interface CmsRow {
  id: string;
  tenant_id: string;
  kind: CmsBlockKind;
  title: string;
  slug: string;
  body: string | null;
  image_url: string | null;
  link_url: string | null;
  status: ContentStatus;
  position: number;
  created_at: string;
  updated_at: string;
}

function toBlock(row: CmsRow): CmsBlock {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    kind: row.kind,
    title: row.title,
    slug: row.slug,
    body: row.body,
    imageUrl: row.image_url,
    linkUrl: row.link_url,
    status: row.status,
    position: row.position,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listCmsBlocks(tenantId: string): Promise<readonly CmsBlock[]> {
  assertTenant(tenantId, "platform.cms.list");
  const rows = unwrapList(
    await supabase
      .from("cms_blocks")
      .select(CMS_COLUMNS)
      .eq("tenant_id", tenantId)
      .order("position", { ascending: true })
      .order("created_at", { ascending: false }),
    "platform.cms.list",
  ) as readonly CmsRow[];
  return rows.map(toBlock);
}

export async function createCmsBlock(
  tenantId: string,
  userId: string,
  input: CmsBlockInput,
): Promise<CmsBlock> {
  assertTenant(tenantId, "platform.cms.create");
  const row = unwrap(
    await supabase
      .from("cms_blocks")
      .insert({
        tenant_id: tenantId,
        kind: input.kind,
        title: input.title,
        slug: input.slug,
        body: input.body,
        image_url: input.imageUrl,
        link_url: input.linkUrl,
        position: input.position,
        status: input.status,
        created_by: userId,
      })
      .select(CMS_COLUMNS)
      .single(),
    "platform.cms.create",
  ) as CmsRow;
  return toBlock(row);
}

export async function updateCmsBlock(
  tenantId: string,
  blockId: string,
  input: CmsBlockInput,
): Promise<CmsBlock> {
  assertTenant(tenantId, "platform.cms.update");
  const row = unwrap(
    await supabase
      .from("cms_blocks")
      .update({
        kind: input.kind,
        title: input.title,
        slug: input.slug,
        body: input.body,
        image_url: input.imageUrl,
        link_url: input.linkUrl,
        position: input.position,
        status: input.status,
      })
      .eq("id", blockId)
      .eq("tenant_id", tenantId)
      .select(CMS_COLUMNS)
      .single(),
    "platform.cms.update",
  ) as CmsRow;
  return toBlock(row);
}

export async function deleteCmsBlock(tenantId: string, blockId: string): Promise<void> {
  assertTenant(tenantId, "platform.cms.delete");
  const { error } = await supabase
    .from("cms_blocks")
    .delete()
    .eq("id", blockId)
    .eq("tenant_id", tenantId);
  if (error) throw error;
}
