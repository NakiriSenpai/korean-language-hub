import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Building2, Plus } from "lucide-react";
import { toast } from "sonner";

import { PermissionGate, usePermissions } from "@/modules/identity";
import type { TenantStatus } from "@/modules/identity";
import {
  PLATFORM_PERMISSIONS,
  StatusPill,
  platformLabel,
  slugify,
  useCreateTenant,
  useMyTenants,
  useSetTenantStatus,
  useUpdateTenant,
} from "@/modules/platform";
import { tenantInputSchema, tenantUpdateSchema } from "@/modules/platform";
import {
  Field,
  SelectInput,
  TextInput,
  buttonClass,
  ghostButtonClass,
} from "@/shared/components/form";
import { AppCard, AppSection, Grid, Stack } from "@/shared/components/layout";
import { EmptyState } from "@/shared/components/shell";
import { toUserMessage } from "@/shared/platform";

export const Route = createFileRoute("/_shell/platform/tenants")({
  head: () => ({
    meta: [
      { title: "Manajemen Lembaga — Hangeul LPK Platform" },
      {
        name: "description",
        content:
          "Buat lembaga baru, ubah identitas, dan atur status aktif, tangguhkan, atau arsip.",
      },
      { property: "og:title", content: "Manajemen Lembaga — Hangeul LPK Platform" },
      {
        property: "og:description",
        content: "Setiap lembaga terisolasi; data tidak pernah tercampur antar lembaga.",
      },
    ],
  }),
  component: TenantsPage,
});

const STATUSES: readonly TenantStatus[] = ["active", "suspended", "archived"];

function TenantsPage() {
  const { can } = usePermissions();
  const canManage = can(PLATFORM_PERMISSIONS.tenantManage);
  const tenants = useMyTenants();
  const createTenant = useCreateTenant();
  const updateTenant = useUpdateTenant();
  const setStatus = useSetTenantStatus();

  const [form, setForm] = useState({ name: "", slug: "" });
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string; name: string; logoUrl: string } | null>(
    null,
  );

  const onCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const parsed = tenantInputSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Data tidak valid");
      return;
    }
    try {
      await createTenant.mutateAsync(parsed.data);
      setForm({ name: "", slug: "" });
      toast.success("Lembaga dibuat.");
    } catch (cause) {
      setError(toUserMessage(cause));
    }
  };

  const onUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing) return;
    const parsed = tenantUpdateSchema.safeParse({
      name: editing.name,
      logoUrl: editing.logoUrl,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Data tidak valid");
      return;
    }
    try {
      await updateTenant.mutateAsync({ tenantId: editing.id, input: parsed.data });
      setEditing(null);
      toast.success("Lembaga diperbarui.");
    } catch (cause) {
      toast.error(toUserMessage(cause));
    }
  };

  const onStatus = async (tenantId: string, status: TenantStatus) => {
    try {
      await setStatus.mutateAsync({ tenantId, status });
      toast.success("Status lembaga diperbarui.");
    } catch (cause) {
      toast.error(toUserMessage(cause));
    }
  };

  return (
    <PermissionGate required={[PLATFORM_PERMISSIONS.tenantManage]}>
      <Stack gap="xl">
        {canManage && (
          <AppSection
            title="Lembaga baru"
            description="Pembuat lembaga otomatis menjadi pemilik dengan akses penuh."
          >
            <AppCard>
              <form onSubmit={onCreate} className="flex flex-col gap-md" noValidate>
                <Grid cols={1} smCols={2} gap="md">
                  <Field label="Nama lembaga" htmlFor="tenantName">
                    <TextInput
                      id="tenantName"
                      required
                      value={form.name}
                      onChange={(event) =>
                        setForm({
                          name: event.target.value,
                          slug: form.slug || slugify(event.target.value),
                        })
                      }
                      placeholder="LPK Hangeul Nusantara"
                    />
                  </Field>
                  <Field
                    label="Slug"
                    htmlFor="tenantSlug"
                    hint="Huruf kecil, angka, dan tanda minus."
                  >
                    <TextInput
                      id="tenantSlug"
                      required
                      value={form.slug}
                      onChange={(event) => setForm({ ...form, slug: slugify(event.target.value) })}
                      placeholder="hangeul-nusantara"
                    />
                  </Field>
                </Grid>
                {error && (
                  <p role="alert" className="text-caption text-destructive">
                    {error}
                  </p>
                )}
                <div>
                  <button type="submit" className={buttonClass} disabled={createTenant.isPending}>
                    <Plus className="size-4" aria-hidden="true" />
                    Buat lembaga
                  </button>
                </div>
              </form>
            </AppCard>
          </AppSection>
        )}

        <AppSection
          title="Daftar lembaga"
          description="Lembaga tempat Anda memiliki keanggotaan aktif."
        >
          {tenants.data && tenants.data.length > 0 ? (
            <Grid cols={1} lgCols={2} gap="md">
              {tenants.data.map((tenant) => (
                <AppCard key={tenant.id}>
                  <Stack gap="sm">
                    <div className="flex items-start justify-between gap-md">
                      <div className="min-w-0">
                        <p className="text-body font-medium text-text-primary">{tenant.name}</p>
                        <p className="text-caption text-text-secondary">
                          /{tenant.slug} · {tenant.memberCount} anggota · Peran{" "}
                          {platformLabel(tenant.role)}
                        </p>
                      </div>
                      <StatusPill status={tenant.status} />
                    </div>

                    {canManage && (
                      <div className="flex flex-wrap gap-xs">
                        <button
                          type="button"
                          className={ghostButtonClass}
                          onClick={() =>
                            setEditing({
                              id: tenant.id,
                              name: tenant.name,
                              logoUrl: tenant.logoUrl ?? "",
                            })
                          }
                        >
                          Ubah
                        </button>
                        <SelectInput
                          aria-label={`Status ${tenant.name}`}
                          className="max-w-44"
                          value={tenant.status}
                          onChange={(event) =>
                            void onStatus(tenant.id, event.target.value as TenantStatus)
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

                    {editing?.id === tenant.id && (
                      <form onSubmit={onUpdate} className="flex flex-col gap-md" noValidate>
                        <Field label="Nama lembaga" htmlFor={`name-${tenant.id}`}>
                          <TextInput
                            id={`name-${tenant.id}`}
                            value={editing.name}
                            onChange={(event) =>
                              setEditing({ ...editing, name: event.target.value })
                            }
                          />
                        </Field>
                        <Field label="URL logo" htmlFor={`logo-${tenant.id}`} hint="Opsional">
                          <TextInput
                            id={`logo-${tenant.id}`}
                            value={editing.logoUrl}
                            onChange={(event) =>
                              setEditing({ ...editing, logoUrl: event.target.value })
                            }
                            placeholder="https://res.cloudinary.com/..."
                          />
                        </Field>
                        <div className="flex gap-xs">
                          <button type="submit" className={buttonClass}>
                            Simpan
                          </button>
                          <button
                            type="button"
                            className={ghostButtonClass}
                            onClick={() => setEditing(null)}
                          >
                            Batal
                          </button>
                        </div>
                      </form>
                    )}
                  </Stack>
                </AppCard>
              ))}
            </Grid>
          ) : (
            <EmptyState
              icon={Building2}
              title="Belum ada lembaga"
              description="Buat lembaga pertama untuk mulai mengelola kelas dan peserta."
            />
          )}
        </AppSection>
      </Stack>
    </PermissionGate>
  );
}
