/**
 * Platform Administration Domain — types.
 * Mirrors the database rows in camelCase so UI code never touches snake_case.
 */

import type { Database, Json } from "@/integrations/supabase/types";
import type { AppRole, MembershipStatus, TenantStatus } from "@/modules/identity";

export type AnnouncementStatus = Database["public"]["Enums"]["announcement_status"];
export type AnnouncementAudience = Database["public"]["Enums"]["announcement_audience"];
export type MediaKind = Database["public"]["Enums"]["media_kind"];
export type CmsBlockKind = Database["public"]["Enums"]["cms_block_kind"];
export type SettingCategory = Database["public"]["Enums"]["setting_category"];
export type ContentStatus = Database["public"]["Enums"]["content_status"];

/* --------------------------------- console -------------------------------- */

export interface TenantSummary {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly logoUrl: string | null;
  readonly status: TenantStatus;
  readonly role: AppRole;
  readonly memberCount: number;
  readonly createdAt: string;
}

export interface PlatformStats {
  readonly tenantCount: number;
  readonly activeTenantCount: number;
  readonly memberCount: number;
  readonly studentCount: number;
  readonly courseCount: number;
  readonly assessmentCount: number;
  readonly examAttemptCount: number;
  readonly mediaCount: number;
}

export type HealthLevel = "ok" | "warn" | "down";

export interface HealthCheck {
  readonly id: string;
  readonly label: string;
  readonly level: HealthLevel;
  readonly detail: string;
}

export interface DirectoryUser {
  readonly membershipId: string;
  readonly userId: string;
  readonly tenantId: string;
  readonly fullName: string;
  readonly avatarUrl: string | null;
  readonly phone: string | null;
  readonly role: AppRole;
  readonly status: MembershipStatus;
  readonly joinedAt: string;
}

/* --------------------------------- branding -------------------------------- */

export interface TenantBranding {
  readonly id: string;
  readonly tenantId: string;
  readonly logoUrl: string | null;
  readonly coverUrl: string | null;
  readonly primaryColor: string | null;
  readonly secondaryColor: string | null;
  readonly contactEmail: string | null;
  readonly contactPhone: string | null;
  readonly address: string | null;
  readonly updatedAt: string;
}

/* --------------------------------- settings -------------------------------- */

export interface SystemSetting {
  readonly id: string;
  readonly tenantId: string;
  readonly category: SettingCategory;
  readonly settings: Record<string, Json>;
  readonly updatedAt: string;
}

/* ---------------------------------- audit ---------------------------------- */

export interface AuditEntry {
  readonly id: string;
  readonly tenantId: string | null;
  readonly actorUserId: string | null;
  readonly actorLabel: string | null;
  readonly action: string;
  readonly entityType: string | null;
  readonly entityId: string | null;
  readonly summary: string | null;
  readonly metadata: Json;
  readonly createdAt: string;
}

export interface AuditInput {
  readonly action: string;
  readonly entityType?: string;
  readonly entityId?: string;
  readonly summary?: string;
  readonly metadata?: Record<string, Json>;
}

/* ------------------------------- announcement ------------------------------ */

export interface Announcement {
  readonly id: string;
  readonly tenantId: string;
  readonly title: string;
  readonly body: string;
  readonly audience: AnnouncementAudience;
  readonly studyGroupId: string | null;
  readonly status: AnnouncementStatus;
  readonly pinned: boolean;
  readonly publishedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/* ---------------------------------- media ---------------------------------- */

export interface MediaAsset {
  readonly id: string;
  readonly tenantId: string;
  readonly kind: MediaKind;
  readonly title: string;
  readonly publicId: string;
  readonly url: string;
  readonly format: string | null;
  readonly bytes: number | null;
  readonly width: number | null;
  readonly height: number | null;
  readonly folder: string | null;
  readonly createdAt: string;
}

/* ----------------------------------- cms ----------------------------------- */

export interface CmsBlock {
  readonly id: string;
  readonly tenantId: string;
  readonly kind: CmsBlockKind;
  readonly title: string;
  readonly slug: string;
  readonly body: string | null;
  readonly imageUrl: string | null;
  readonly linkUrl: string | null;
  readonly status: ContentStatus;
  readonly position: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}
