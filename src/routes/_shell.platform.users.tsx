import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { toast } from "sonner";

import { PermissionGate, usePermissions } from "@/modules/identity";
import type { AppRole, MembershipStatus } from "@/modules/identity";
import {
  PLATFORM_PERMISSIONS,
  StatusPill,
  formatDateTime,
  platformLabel,
  useDirectoryUsers,
  useUpdateMembershipRole,
  useUpdateMembershipStatus,
} from "@/modules/platform";
import { SelectInput, TextInput } from "@/shared/components/form";
import { AppCard, AppSection, Grid, Stack } from "@/shared/components/layout";
import { EmptyState } from "@/shared/components/shell";
import { toUserMessage } from "@/shared/platform";

export const Route = createFileRoute("/_shell/platform/users")({
  head: () => ({
    meta: [
      { title: "Direktori Pengguna — Hangeul LPK Platform" },
      {
        name: "description",
        content: "Kelola peran dan status keanggotaan pengguna di dalam lembaga.",
      },
      { property: "og:title", content: "Direktori Pengguna — Hangeul LPK Platform" },
      {
        property: "og:description",
        content: "Perubahan peran dan status keanggotaan tercatat otomatis di jejak audit.",
      },
    ],
  }),
  component: DirectoryPage,
});

const ROLES: readonly AppRole[] = ["owner", "admin", "instructor", "staff", "student"];
const STATUSES: readonly MembershipStatus[] = ["invited", "active", "suspended", "revoked"];

function DirectoryPage() {
  const { can } = usePermissions();
  const canManage = can(PLATFORM_PERMISSIONS.tenantManage);
  const users = useDirectoryUsers();
  const updateRole = useUpdateMembershipRole();
  const updateStatus = useUpdateMembershipStatus();
  const [search, setSearch] = useState("");

  const filtered = (users.data ?? []).filter((user) =>
    user.fullName.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const onRole = async (membershipId: string, role: AppRole) => {
    try {
      await updateRole.mutateAsync({ membershipId, role });
      toast.success("Peran diperbarui.");
    } catch (cause) {
      toast.error(toUserMessage(cause));
    }
  };

  const onStatus = async (membershipId: string, status: MembershipStatus) => {
    try {
      await updateStatus.mutateAsync({ membershipId, status });
      toast.success("Status keanggotaan diperbarui.");
    } catch (cause) {
      toast.error(toUserMessage(cause));
    }
  };

  return (
    <PermissionGate required={[PLATFORM_PERMISSIONS.tenantManage]}>
      <Stack gap="xl">
        <AppSection
          title="Direktori pengguna"
          description="Peran menentukan izin; tidak ada izin yang diberikan berdasarkan nama peran di sisi klien."
        >
          <Stack gap="md">
            <TextInput
              aria-label="Cari pengguna"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama pengguna"
            />

            {filtered.length > 0 ? (
              <Grid cols={1} lgCols={2} gap="md">
                {filtered.map((user) => (
                  <AppCard key={user.membershipId}>
                    <Stack gap="sm">
                      <div className="flex items-start justify-between gap-md">
                        <div className="min-w-0">
                          <p className="text-body font-medium text-text-primary">{user.fullName}</p>
                          <p className="text-caption text-text-secondary">
                            {user.phone ?? "Tanpa nomor"} · Bergabung{" "}
                            {formatDateTime(user.joinedAt)}
                          </p>
                        </div>
                        <StatusPill status={user.status} />
                      </div>

                      {canManage && (
                        <div className="flex flex-wrap gap-sm">
                          <SelectInput
                            aria-label={`Peran ${user.fullName}`}
                            className="max-w-44"
                            value={user.role}
                            onChange={(event) =>
                              void onRole(user.membershipId, event.target.value as AppRole)
                            }
                          >
                            {ROLES.map((role) => (
                              <option key={role} value={role}>
                                {platformLabel(role)}
                              </option>
                            ))}
                          </SelectInput>
                          <SelectInput
                            aria-label={`Status ${user.fullName}`}
                            className="max-w-44"
                            value={user.status}
                            onChange={(event) =>
                              void onStatus(
                                user.membershipId,
                                event.target.value as MembershipStatus,
                              )
                            }
                          >
                            {STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {platformLabel(status)}
                              </option>
                            ))}
                          </SelectInput>
                        </div>
                      )}
                    </Stack>
                  </AppCard>
                ))}
              </Grid>
            ) : (
              <EmptyState
                icon={Users}
                title="Pengguna tidak ditemukan"
                description="Ubah kata kunci pencarian atau undang anggota baru ke lembaga ini."
              />
            )}
          </Stack>
        </AppSection>
      </Stack>
    </PermissionGate>
  );
}
