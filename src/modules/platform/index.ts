/**
 * Platform Administration — public surface.
 * Routes and other domains import from here, never from internal file paths.
 */

export { PLATFORM_PERMISSIONS } from "@/modules/platform/config/permissions";
export type { PlatformPermissionKey } from "@/modules/platform/config/permissions";

export * from "@/modules/platform/types";
export * from "@/modules/platform/hooks/usePlatform";

export {
  AUDIT_ACTIONS,
  auditActionOptions,
  recordAudit,
} from "@/modules/platform/services/audit.service";
export type { AuditContext, AuditFilter } from "@/modules/platform/services/audit.service";
export { brandingCssVariables } from "@/modules/platform/services/branding.service";
export {
  SETTING_SECTIONS,
  resolveSection,
} from "@/modules/platform/services/settings.service";
export type {
  SettingField,
  SettingFieldType,
  SettingSection,
} from "@/modules/platform/services/settings.service";
export type { MediaFilter } from "@/modules/platform/services/media.service";
export { formatBytes, formatDateTime, slugify } from "@/modules/platform/services/platform-client";

export {
  HealthPill,
  PlatformBadge,
  StatusPill,
  platformLabel,
} from "@/modules/platform/components/PlatformBadges";
export type { PlatformTone } from "@/modules/platform/components/PlatformBadges";

export * from "@/modules/platform/validation/schemas";
