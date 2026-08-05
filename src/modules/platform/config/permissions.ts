/**
 * Platform Administration — permission catalogue.
 * Every gate in this domain checks a permission string, never a role name.
 */

import type { Permission } from "@/modules/identity";

export const PLATFORM_PERMISSIONS = {
  read: "platform.read",
  write: "platform.write",
  tenantManage: "tenant.manage",
  auditRead: "audit.read",
  settingsRead: "settings.read",
  settingsWrite: "settings.write",
  brandingWrite: "branding.write",
  announcementRead: "announcement.read",
  announcementWrite: "announcement.write",
  mediaRead: "media.read",
  mediaWrite: "media.write",
  cmsRead: "cms.read",
  cmsWrite: "cms.write",
} as const satisfies Record<string, Permission>;

export type PlatformPermissionKey = keyof typeof PLATFORM_PERMISSIONS;
