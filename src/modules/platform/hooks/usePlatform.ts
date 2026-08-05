/**
 * Platform Administration — React Query bindings.
 * Everything is tenant scoped through Identity; mutations invalidate the
 * domain root key so console counters stay consistent.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { Json } from "@/integrations/supabase/types";
import { useAuth, useTenant } from "@/modules/identity";
import type { AppRole, MembershipStatus, TenantStatus } from "@/modules/identity";
import * as AuditService from "@/modules/platform/services/audit.service";
import * as BrandingService from "@/modules/platform/services/branding.service";
import * as CmsService from "@/modules/platform/services/cms.service";
import * as ConsoleService from "@/modules/platform/services/console.service";
import * as MediaService from "@/modules/platform/services/media.service";
import * as SettingsService from "@/modules/platform/services/settings.service";
import * as TenantAdminService from "@/modules/platform/services/tenant-admin.service";
import type { AnnouncementStatus, MediaKind, SettingCategory } from "@/modules/platform/types";
import type {
  AnnouncementInput,
  BrandingInput,
  CmsBlockInput,
  MediaAssetInput,
  TenantInput,
  TenantUpdateInput,
} from "@/modules/platform/validation/schemas";
import { getNetworkState } from "@/shared/platform";

export const platformKeys = {
  all: (tenantId: string) => ["platform", tenantId] as const,
  tenants: (userId: string) => ["platform", "tenants", userId] as const,
  stats: (tenantId: string) => ["platform", tenantId, "stats"] as const,
  users: (tenantId: string) => ["platform", tenantId, "users"] as const,
  branding: (tenantId: string) => ["platform", tenantId, "branding"] as const,
  settings: (tenantId: string) => ["platform", tenantId, "settings"] as const,
  audit: (tenantId: string, filter: AuditService.AuditFilter) =>
    ["platform", tenantId, "audit", filter] as const,
  announcements: (tenantId: string) => ["platform", tenantId, "announcements"] as const,
  media: (tenantId: string, filter: MediaService.MediaFilter) =>
    ["platform", tenantId, "media", filter] as const,
  cms: (tenantId: string) => ["platform", tenantId, "cms"] as const,
};

export function usePlatformScope(): { tenantId: string; userId: string; ready: boolean } {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const tenantId = tenant?.id ?? "";
  const userId = user?.id ?? "";
  return { tenantId, userId, ready: Boolean(tenantId && userId) };
}

function useInvalidatePlatform(tenantId: string) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: platformKeys.all(tenantId) });
}

/** Audit context bound to the current session; every mutation hook uses it. */
function useAuditContext(): AuditService.AuditContext {
  const { tenant } = useTenant();
  const { user, profile } = useAuth();
  return {
    tenantId: tenant?.id ?? null,
    userId: user?.id ?? null,
    actorLabel: profile?.fullName ?? user?.email ?? null,
  };
}

/* ------------------------------------------------------------------ */
/* Console                                                             */
/* ------------------------------------------------------------------ */

export function useMyTenants() {
  const { userId } = usePlatformScope();
  return useQuery({
    queryKey: platformKeys.tenants(userId),
    queryFn: () => TenantAdminService.listMyTenants(userId),
    enabled: Boolean(userId),
  });
}

export function usePlatformStats() {
  const { tenantId } = usePlatformScope();
  const tenants = useMyTenants();
  return useQuery({
    queryKey: platformKeys.stats(tenantId),
    queryFn: () => ConsoleService.getPlatformStats(tenantId, tenants.data ?? []),
    enabled: Boolean(tenantId) && tenants.isSuccess,
  });
}

export function useHealthChecks(lastAuditAt: string | null) {
  const stats = usePlatformStats();
  const { online } = getNetworkState();
  if (!stats.data) return [];
  return ConsoleService.buildHealthChecks(stats.data, online, lastAuditAt);
}

/* ------------------------------------------------------------------ */
/* Tenant management                                                   */
/* ------------------------------------------------------------------ */

export function useCreateTenant() {
  const queryClient = useQueryClient();
  const { userId } = usePlatformScope();
  return useMutation({
    mutationFn: (input: TenantInput) => TenantAdminService.createTenant(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: platformKeys.tenants(userId) }),
  });
}

export function useUpdateTenant() {
  const { tenantId } = usePlatformScope();
  const invalidate = useInvalidatePlatform(tenantId);
  const queryClient = useQueryClient();
  const { userId } = usePlatformScope();
  return useMutation({
    mutationFn: (vars: { tenantId: string; input: TenantUpdateInput }) =>
      TenantAdminService.updateTenant(vars.tenantId, vars.input),
    onSuccess: () => {
      invalidate();
      void queryClient.invalidateQueries({ queryKey: platformKeys.tenants(userId) });
    },
  });
}

export function useSetTenantStatus() {
  const queryClient = useQueryClient();
  const { userId } = usePlatformScope();
  const context = useAuditContext();
  return useMutation({
    mutationFn: async (vars: { tenantId: string; status: TenantStatus }) => {
      await TenantAdminService.setTenantStatus(vars.tenantId, vars.status);
      await AuditService.recordAudit(context, {
        action: AuditService.AUDIT_ACTIONS.tenantStatus,
        entityType: "tenant",
        entityId: vars.tenantId,
        summary: `Status lembaga diubah menjadi ${vars.status}`,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: platformKeys.tenants(userId) }),
  });
}

export function useDirectoryUsers() {
  const { tenantId } = usePlatformScope();
  return useQuery({
    queryKey: platformKeys.users(tenantId),
    queryFn: () => TenantAdminService.listDirectoryUsers(tenantId),
    enabled: Boolean(tenantId),
  });
}

export function useUpdateMembershipRole() {
  const { tenantId } = usePlatformScope();
  const invalidate = useInvalidatePlatform(tenantId);
  return useMutation({
    mutationFn: (vars: { membershipId: string; role: AppRole }) =>
      TenantAdminService.updateMembershipRole(vars.membershipId, vars.role),
    onSuccess: invalidate,
  });
}

export function useUpdateMembershipStatus() {
  const { tenantId } = usePlatformScope();
  const invalidate = useInvalidatePlatform(tenantId);
  return useMutation({
    mutationFn: (vars: { membershipId: string; status: MembershipStatus }) =>
      TenantAdminService.updateMembershipStatus(vars.membershipId, vars.status),
    onSuccess: invalidate,
  });
}

/* ------------------------------------------------------------------ */
/* Branding                                                            */
/* ------------------------------------------------------------------ */

export function useBranding() {
  const { tenantId } = usePlatformScope();
  return useQuery({
    queryKey: platformKeys.branding(tenantId),
    queryFn: () => BrandingService.getBranding(tenantId),
    enabled: Boolean(tenantId),
  });
}

export function useSaveBranding() {
  const { tenantId, userId } = usePlatformScope();
  const invalidate = useInvalidatePlatform(tenantId);
  const context = useAuditContext();
  return useMutation({
    mutationFn: async (input: BrandingInput) => {
      const branding = await BrandingService.saveBranding(tenantId, userId, input);
      await AuditService.recordAudit(context, {
        action: AuditService.AUDIT_ACTIONS.brandingUpdate,
        entityType: "tenant_branding",
        entityId: branding.id,
        summary: "Branding lembaga diperbarui",
      });
      return branding;
    },
    onSuccess: invalidate,
  });
}

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

export function useSystemSettings() {
  const { tenantId } = usePlatformScope();
  return useQuery({
    queryKey: platformKeys.settings(tenantId),
    queryFn: () => SettingsService.listSettings(tenantId),
    enabled: Boolean(tenantId),
  });
}

export function useSaveSettings() {
  const { tenantId, userId } = usePlatformScope();
  const invalidate = useInvalidatePlatform(tenantId);
  const context = useAuditContext();
  return useMutation({
    mutationFn: async (vars: { category: SettingCategory; settings: Record<string, Json> }) => {
      const saved = await SettingsService.saveSettings(
        tenantId,
        userId,
        vars.category,
        vars.settings,
      );
      await AuditService.recordAudit(context, {
        action: AuditService.AUDIT_ACTIONS.settingsUpdate,
        entityType: "system_settings",
        entityId: saved.id,
        summary: `Pengaturan ${vars.category} diperbarui`,
      });
      return saved;
    },
    onSuccess: invalidate,
  });
}

/* ------------------------------------------------------------------ */
/* Audit                                                               */
/* ------------------------------------------------------------------ */

export function useAuditEntries(filter: AuditService.AuditFilter = {}) {
  const { tenantId } = usePlatformScope();
  return useQuery({
    queryKey: platformKeys.audit(tenantId, filter),
    queryFn: () => AuditService.listAuditEntries(tenantId, filter),
    enabled: Boolean(tenantId),
  });
}

/* ------------------------------------------------------------------ */
/* Announcements                                                       */
/* ------------------------------------------------------------------ */

export function useAnnouncements() {
  const { tenantId } = usePlatformScope();
  return useQuery({
    queryKey: platformKeys.announcements(tenantId),
    queryFn: () => CmsService.listAnnouncements(tenantId),
    enabled: Boolean(tenantId),
  });
}

export function useSaveAnnouncement() {
  const { tenantId, userId } = usePlatformScope();
  const invalidate = useInvalidatePlatform(tenantId);
  return useMutation({
    mutationFn: (vars: { announcementId?: string; input: AnnouncementInput }) =>
      vars.announcementId
        ? CmsService.updateAnnouncement(tenantId, vars.announcementId, vars.input)
        : CmsService.createAnnouncement(tenantId, userId, vars.input),
    onSuccess: invalidate,
  });
}

export function useSetAnnouncementStatus() {
  const { tenantId } = usePlatformScope();
  const invalidate = useInvalidatePlatform(tenantId);
  const context = useAuditContext();
  return useMutation({
    mutationFn: async (vars: { announcementId: string; status: AnnouncementStatus }) => {
      const result = await CmsService.setAnnouncementStatus(
        tenantId,
        vars.announcementId,
        vars.status,
      );
      await AuditService.recordAudit(context, {
        action:
          vars.status === "published"
            ? AuditService.AUDIT_ACTIONS.announcementPublish
            : AuditService.AUDIT_ACTIONS.announcementArchive,
        entityType: "announcement",
        entityId: vars.announcementId,
        summary: `Pengumuman "${result.title}" berstatus ${vars.status}`,
      });
      return result;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteAnnouncement() {
  const { tenantId } = usePlatformScope();
  const invalidate = useInvalidatePlatform(tenantId);
  return useMutation({
    mutationFn: (announcementId: string) => CmsService.deleteAnnouncement(tenantId, announcementId),
    onSuccess: invalidate,
  });
}

/* ------------------------------------------------------------------ */
/* Media                                                               */
/* ------------------------------------------------------------------ */

export function useMediaAssets(filter: MediaService.MediaFilter = {}) {
  const { tenantId } = usePlatformScope();
  return useQuery({
    queryKey: platformKeys.media(tenantId, filter),
    queryFn: () => MediaService.listMediaAssets(tenantId, filter),
    enabled: Boolean(tenantId),
  });
}

export function useRegisterMediaAsset() {
  const { tenantId, userId } = usePlatformScope();
  const invalidate = useInvalidatePlatform(tenantId);
  const context = useAuditContext();
  return useMutation({
    mutationFn: async (input: MediaAssetInput) => {
      const asset = await MediaService.registerMediaAsset(tenantId, userId, input);
      await AuditService.recordAudit(context, {
        action: AuditService.AUDIT_ACTIONS.mediaUpload,
        entityType: "media_asset",
        entityId: asset.id,
        summary: `Media "${asset.title}" ditambahkan`,
      });
      return asset;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteMediaAsset() {
  const { tenantId } = usePlatformScope();
  const invalidate = useInvalidatePlatform(tenantId);
  const context = useAuditContext();
  return useMutation({
    mutationFn: async (vars: { assetId: string; title: string }) => {
      await MediaService.deleteMediaAsset(tenantId, vars.assetId);
      await AuditService.recordAudit(context, {
        action: AuditService.AUDIT_ACTIONS.mediaDelete,
        entityType: "media_asset",
        entityId: vars.assetId,
        summary: `Media "${vars.title}" dihapus`,
      });
    },
    onSuccess: invalidate,
  });
}

export type { MediaKind };

/* ------------------------------------------------------------------ */
/* CMS                                                                 */
/* ------------------------------------------------------------------ */

export function useCmsBlocks() {
  const { tenantId } = usePlatformScope();
  return useQuery({
    queryKey: platformKeys.cms(tenantId),
    queryFn: () => CmsService.listCmsBlocks(tenantId),
    enabled: Boolean(tenantId),
  });
}

export function useSaveCmsBlock() {
  const { tenantId, userId } = usePlatformScope();
  const invalidate = useInvalidatePlatform(tenantId);
  const context = useAuditContext();
  return useMutation({
    mutationFn: async (vars: { blockId?: string; input: CmsBlockInput }) => {
      const block = vars.blockId
        ? await CmsService.updateCmsBlock(tenantId, vars.blockId, vars.input)
        : await CmsService.createCmsBlock(tenantId, userId, vars.input);
      await AuditService.recordAudit(context, {
        action: AuditService.AUDIT_ACTIONS.cmsWrite,
        entityType: "cms_block",
        entityId: block.id,
        summary: `Blok CMS "${block.title}" disimpan`,
      });
      return block;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteCmsBlock() {
  const { tenantId } = usePlatformScope();
  const invalidate = useInvalidatePlatform(tenantId);
  return useMutation({
    mutationFn: (blockId: string) => CmsService.deleteCmsBlock(tenantId, blockId),
    onSuccess: invalidate,
  });
}
