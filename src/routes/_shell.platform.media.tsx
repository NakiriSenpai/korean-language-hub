import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PermissionGate, usePermissions } from "@/modules/identity";
import {
  PLATFORM_PERMISSIONS,
  PlatformBadge,
  formatBytes,
  formatDateTime,
  mediaAssetInputSchema,
  platformLabel,
  useDeleteMediaAsset,
  useMediaAssets,
  useRegisterMediaAsset,
} from "@/modules/platform";
import type { MediaKind } from "@/modules/platform";
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

export const Route = createFileRoute("/_shell/platform/media")({
  head: () => ({
    meta: [
      { title: "Manajer Media — Hangeul LPK Platform" },
      {
        name: "description",
        content: "Katalog aset Cloudinary: gambar, audio, video, dan dokumen milik lembaga.",
      },
      { property: "og:title", content: "Manajer Media — Hangeul LPK Platform" },
      {
        property: "og:description",
        content: "Daftarkan aset Cloudinary agar dapat dipakai ulang di seluruh konten.",
      },
    ],
  }),
  component: MediaPage,
});

interface MediaForm {
  kind: MediaKind;
  title: string;
  publicId: string;
  url: string;
  format: string;
  folder: string;
}

const emptyForm: MediaForm = {
  kind: "image",
  title: "",
  publicId: "",
  url: "",
  format: "",
  folder: "",
};

const KINDS: readonly MediaKind[] = ["image", "audio", "video", "document"];

function MediaPage() {
  const { can } = usePermissions();
  const canWrite = can(PLATFORM_PERMISSIONS.mediaWrite);
  const [kind, setKind] = useState<MediaKind | "">("");
  const [search, setSearch] = useState("");
  const assets = useMediaAssets({ ...(kind ? { kind } : {}), ...(search ? { search } : {}) });
  const registerAsset = useRegisterMediaAsset();
  const removeAsset = useDeleteMediaAsset();

  const [form, setForm] = useState<MediaForm>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const parsed = mediaAssetInputSchema.safeParse({
      ...form,
      bytes: null,
      width: null,
      height: null,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Data tidak valid");
      return;
    }
    try {
      await registerAsset.mutateAsync(parsed.data);
      setForm(emptyForm);
      toast.success("Aset media terdaftar.");
    } catch (cause) {
      setError(toUserMessage(cause));
    }
  };

  return (
    <PermissionGate required={[PLATFORM_PERMISSIONS.mediaRead]}>
      <Stack gap="xl">
        {canWrite && (
          <AppSection
            title="Daftarkan aset"
            description="Unggah berkas ke Cloudinary, lalu catat public id dan URL-nya di sini."
          >
            <AppCard>
              <form onSubmit={onSubmit} className="flex flex-col gap-md" noValidate>
                <Grid cols={1} smCols={2} gap="md">
                  <Field label="Jenis" htmlFor="kind">
                    <SelectInput
                      id="kind"
                      value={form.kind}
                      onChange={(event) =>
                        setForm({ ...form, kind: event.target.value as MediaKind })
                      }
                    >
                      {KINDS.map((item) => (
                        <option key={item} value={item}>
                          {platformLabel(item)}
                        </option>
                      ))}
                    </SelectInput>
                  </Field>
                  <Field label="Judul" htmlFor="title">
                    <TextInput
                      id="title"
                      required
                      value={form.title}
                      onChange={(event) => setForm({ ...form, title: event.target.value })}
                      placeholder="Audio latihan mendengar bab 1"
                    />
                  </Field>
                  <Field label="Public ID" htmlFor="publicId">
                    <TextInput
                      id="publicId"
                      required
                      value={form.publicId}
                      onChange={(event) => setForm({ ...form, publicId: event.target.value })}
                      placeholder="hangeul/audio/bab-1"
                    />
                  </Field>
                  <Field label="URL" htmlFor="url">
                    <TextInput
                      id="url"
                      required
                      value={form.url}
                      onChange={(event) => setForm({ ...form, url: event.target.value })}
                      placeholder="https://res.cloudinary.com/..."
                    />
                  </Field>
                  <Field label="Format" htmlFor="format" hint="Opsional, contoh mp3">
                    <TextInput
                      id="format"
                      value={form.format}
                      onChange={(event) => setForm({ ...form, format: event.target.value })}
                    />
                  </Field>
                  <Field label="Folder" htmlFor="folder" hint="Opsional">
                    <TextInput
                      id="folder"
                      value={form.folder}
                      onChange={(event) => setForm({ ...form, folder: event.target.value })}
                      placeholder="hangeul/audio"
                    />
                  </Field>
                </Grid>

                {error && (
                  <p role="alert" className="text-caption text-destructive">
                    {error}
                  </p>
                )}
                <div>
                  <button type="submit" className={buttonClass} disabled={registerAsset.isPending}>
                    <ImagePlus className="size-4" aria-hidden="true" />
                    Daftarkan aset
                  </button>
                </div>
              </form>
            </AppCard>
          </AppSection>
        )}

        <AppSection title="Katalog media" description="Aset dapat dipakai ulang di seluruh konten.">
          <Stack gap="md">
            <div className="grid gap-md sm:grid-cols-2">
              <TextInput
                aria-label="Cari media"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari judul aset"
              />
              <SelectInput
                aria-label="Saring jenis media"
                value={kind}
                onChange={(event) => setKind(event.target.value as MediaKind | "")}
              >
                <option value="">Semua jenis</option>
                {KINDS.map((item) => (
                  <option key={item} value={item}>
                    {platformLabel(item)}
                  </option>
                ))}
              </SelectInput>
            </div>

            {assets.data && assets.data.length > 0 ? (
              <Grid cols={1} smCols={2} lgCols={3} gap="md">
                {assets.data.map((asset) => (
                  <AppCard key={asset.id}>
                    <Stack gap="sm">
                      {asset.kind === "image" && (
                        <img
                          src={asset.url}
                          alt={asset.title}
                          loading="lazy"
                          className="aspect-video w-full rounded-md object-cover"
                        />
                      )}
                      <div className="flex items-start justify-between gap-sm">
                        <p className="min-w-0 text-body-sm font-medium text-text-primary">
                          {asset.title}
                        </p>
                        <PlatformBadge tone="info">{platformLabel(asset.kind)}</PlatformBadge>
                      </div>
                      <p className="text-caption text-text-secondary">
                        {formatBytes(asset.bytes)} · {formatDateTime(asset.createdAt)}
                      </p>
                      {canWrite && (
                        <div>
                          <button
                            type="button"
                            className={ghostButtonClass}
                            onClick={() =>
                              void removeAsset
                                .mutateAsync({ assetId: asset.id, title: asset.title })
                                .then(() => toast.success("Aset dihapus."))
                                .catch((cause: unknown) => toast.error(toUserMessage(cause)))
                            }
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                            Hapus
                          </button>
                        </div>
                      )}
                    </Stack>
                  </AppCard>
                ))}
              </Grid>
            ) : (
              <EmptyState
                icon={ImagePlus}
                title="Belum ada aset"
                description="Daftarkan aset Cloudinary pertama untuk mulai membangun katalog media."
              />
            )}
          </Stack>
        </AppSection>
      </Stack>
    </PermissionGate>
  );
}
