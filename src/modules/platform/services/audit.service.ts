/**
 * Engine 5 — Audit Log.
 * Append only: the table has no UPDATE/DELETE grant, so no UI path can mutate
 * an entry. Database triggers cover tenant, membership, and assessment events;
 * this service covers the events that only exist in the browser session.
 */

import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { logger } from "@/shared/platform";
import { assertTenant, unwrapList } from "@/modules/platform/services/platform-client";
import type { AuditEntry, AuditInput } from "@/modules/platform/types";

export const AUDIT_ACTIONS = {
  login: "auth.login",
  logout: "auth.logout",
  tenantCreate: "tenant.create",
  tenantUpdate: "tenant.update",
  tenantStatus: "tenant.status",
  assessmentPublish: "assessment.publish",
  roleChange: "role.change",
  membershipStatus: "membership.status",
  permissionChange: "permission.change",
  brandingUpdate: "branding.update",
  settingsUpdate: "settings.update",
  announcementPublish: "announcement.publish",
  announcementArchive: "announcement.archive",
  mediaUpload: "media.upload",
  mediaDelete: "media.delete",
  cmsWrite: "cms.write",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

const AUDIT_COLUMNS =
  "id, tenant_id, actor_user_id, actor_label, action, entity_type, entity_id, summary, metadata, created_at";

interface AuditRow {
  id: string;
  tenant_id: string | null;
  actor_user_id: string | null;
  actor_label: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  summary: string | null;
  metadata: Json;
  created_at: string;
}

function toEntry(row: AuditRow): AuditEntry {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    actorUserId: row.actor_user_id,
    actorLabel: row.actor_label,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    summary: row.summary,
    metadata: row.metadata,
    createdAt: row.created_at,
  };
}

export interface AuditContext {
  readonly tenantId: string | null;
  readonly userId: string | null;
  readonly actorLabel?: string | null;
}

/**
 * Records one entry. Auditing must never break the user flow, so failures are
 * logged and swallowed instead of thrown.
 */
export async function recordAudit(context: AuditContext, input: AuditInput): Promise<void> {
  if (!context.userId) return;
  const { error } = await supabase.from("audit_logs").insert({
    tenant_id: context.tenantId,
    actor_user_id: context.userId,
    actor_label: context.actorLabel ?? null,
    action: input.action,
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
    summary: input.summary ?? null,
    metadata: (input.metadata ?? {}) as Json,
  });
  if (error) logger.warn("Audit entry failed", { action: input.action, message: error.message });
}

export interface AuditFilter {
  readonly action?: string;
  readonly search?: string;
  readonly limit?: number;
}

export async function listAuditEntries(
  tenantId: string,
  filter: AuditFilter = {},
): Promise<readonly AuditEntry[]> {
  assertTenant(tenantId, "platform.audit.list");
  let query = supabase
    .from("audit_logs")
    .select(AUDIT_COLUMNS)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(filter.limit ?? 200);

  if (filter.action) query = query.eq("action", filter.action);
  if (filter.search) query = query.ilike("summary", `%${filter.search}%`);

  const rows = unwrapList(await query, "platform.audit.list") as readonly AuditRow[];
  return rows.map(toEntry);
}

/** Distinct action list for the audit filter, derived from the loaded page. */
export function auditActionOptions(entries: readonly AuditEntry[]): readonly string[] {
  return [...new Set(entries.map((entry) => entry.action))].sort();
}
