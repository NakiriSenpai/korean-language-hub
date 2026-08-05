import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { LayoutTemplate, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PermissionGate, usePermissions } from "@/modules/identity";
import {
  PLATFORM_PERMISSIONS,
  StatusPill,
  cmsBlockInputSchema,
  platformLabel,
  slugify,
  useCmsBlocks,
  useDeleteCmsBlock,
  useSaveCmsBlock,
} from "@/modules/platform";
import type { CmsBlockKind, ContentStatus } from "@/modules/platform";
import {
  Field,
  SelectInput,
  TextArea,
  TextInput,
  buttonClass,
  ghostButtonClass,
} from "@/shared/components/form";
import { AppCard, AppSection, Grid, Stack } from "@/shared/components/layout";
import { EmptyState } from "@/shared/components/shell";
import { toUserMessage } from "@/shared/platform";

export const Route = createFileRoute("/_shell/platform/cms")({
  head: () => ({
    meta: [
      { title: "CMS Ringan — Hangeul LPK Platform" },
      {
        name: "description",
        content: "Kelola banner, carousel, halaman statis, dan FAQ yang tampil di aplikasi.",
      },
      { property: "og:title", content: "CMS Ringan — Hangeul LPK Platform" },
      {
        property: "og:description",
        content: "Blok konten dapat diterbitkan, diurutkan, dan diarsipkan per lembaga.",
      },
    ],
  }),
  component: CmsPage,
});

interface BlockForm {
  kind: CmsBlockKind;
  title: string;
  slug: string;
  body: string;
  imageUrl: string;
  linkUrl: string;
  position: number;
  status: ContentStatus;
}

const emptyForm: BlockForm = {
  kind: "banner",
  title: "",
  slug: "",
  body: "",
  imageUrl: "",
  linkUrl: "",
  position: 0,
  status: "draft",
};

const KINDS: readonly CmsBlockKind[] = ["banner", "carousel", "static_page", "faq"];
const STATUSES: readonly ContentStatus[] = ["draft", "published", "archived"];

function CmsPage() {
  const { can } = usePermissions();
  const canWrite = can(PLATFORM_PERMISSIONS.cmsWrite);
  const blocks = useCmsBlocks();
  const saveBlock = useSaveCmsBlock();
  const removeBlock = useDeleteCmsBlock();

  const [form, setForm] = useState<BlockForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const parsed = cmsBlockInputSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Data tidak valid");
      return;
    }
    try {
      await saveBlock.mutateAsync({
        ...(editingId ? { blockId: editingId } : {}),
        input: parsed.data,
      });
      setForm(emptyForm);
      setEditingId(null);
      toast.success("Blok CMS tersimpan.");
    } catch (cause) {
      setError(toUserMessage(cause));
    }
  };

  return (
    <PermissionGate required={[PLATFORM_PERMISSIONS.cmsRead]}>
      <Stack gap="xl">
        {canWrite && (
          <AppSection
            title={editingId ? "Ubah blok konten" : "Blok konten baru"}
            description="Slug menjadi pengenal unik blok di dalam lembaga."
          >
            <AppCard>
              <form onSubmit={onSubmit} className="flex flex-col gap-md" noValidate>
                <Grid cols={1} smCols={2} gap="md">
                  <Field label="Jenis" htmlFor="kind">
                    <SelectInput
                      id="kind"
                      value={form.kind}
                      onChange={(event) =>
                        setForm({ ...form, kind: event.target.value as CmsBlockKind })
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
                      onChange={(event) =>
                        setForm({
                          ...form,
                          title: event.target.value,
                          slug: form.slug || slugify(event.target.value),
                        })
                      }
                      placeholder="Selamat datang di kelas Hangeul"
                    />
                  </Field>
                  <Field label="Slug" htmlFor="slug">
                    <TextInput
                      id="slug"
                      required
                      value={form.slug}
                      onChange={(event) => setForm({ ...form, slug: slugify(event.target.value) })}
                      placeholder="banner-utama"
                    />
                  </Field>
                  <Field label="Urutan" htmlFor="position" hint="Angka kecil tampil lebih dulu.">
                    <TextInput
                      id="position"
                      type="number"
                      min={0}
                      value={String(form.position)}
                      onChange={(event) =>
                        setForm({ ...form, position: Number(event.target.value || 0) })
                      }
                    />
                  </Field>
                  <Field label="URL gambar" htmlFor="imageUrl" hint="Opsional">
                    <TextInput
                      id="imageUrl"
                      value={form.imageUrl}
                      onChange={(event) => setForm({ ...form, imageUrl: event.target.value })}
                      placeholder="https://res.cloudinary.com/..."
                    />
                  </Field>
                  <Field label="URL tautan" htmlFor="linkUrl" hint="Opsional">
                    <TextInput
                      id="linkUrl"
                      value={form.linkUrl}
                      onChange={(event) => setForm({ ...form, linkUrl: event.target.value })}
                      placeholder="https://lembaga.id/informasi"
                    />
                  </Field>
                  <Field label="Status" htmlFor="status">
                    <SelectInput
                      id="status"
                      value={form.status}
                      onChange={(event) =>
                        setForm({ ...form, status: event.target.value as ContentStatus })
                      }
                    >
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {platformLabel(status)}
                        </option>
                      ))}
                    </SelectInput>
                  </Field>
                </Grid>

                <Field label="Isi" htmlFor="body" hint="Opsional, mendukung teks panjang.">
                  <TextArea
                    id="body"
                    value={form.body}
                    onChange={(event) => setForm({ ...form, body: event.target.value })}
                  />
                </Field>

                {error && (
                  <p role="alert" className="text-caption text-destructive">
                    {error}
                  </p>
                )}
                <div className="flex flex-wrap gap-xs">
                  <button type="submit" className={buttonClass} disabled={saveBlock.isPending}>
                    <LayoutTemplate className="size-4" aria-hidden="true" />
                    {editingId ? "Simpan perubahan" : "Tambah blok"}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      className={ghostButtonClass}
                      onClick={() => {
                        setEditingId(null);
                        setForm(emptyForm);
                      }}
                    >
                      Batal
                    </button>
                  )}
                </div>
              </form>
            </AppCard>
          </AppSection>
        )}

        <AppSection
          title="Blok konten"
          description="Diurutkan berdasarkan posisi lalu tanggal buat."
        >
          {blocks.data && blocks.data.length > 0 ? (
            <Grid cols={1} lgCols={2} gap="md">
              {blocks.data.map((block) => (
                <AppCard key={block.id}>
                  <Stack gap="sm">
                    <div className="flex items-start justify-between gap-md">
                      <div className="min-w-0">
                        <p className="text-body font-medium text-text-primary">{block.title}</p>
                        <p className="text-caption text-text-secondary">
                          {platformLabel(block.kind)} · /{block.slug} · Urutan {block.position}
                        </p>
                      </div>
                      <StatusPill status={block.status} />
                    </div>
                    {block.body && (
                      <p className="line-clamp-3 text-body-sm text-text-secondary">{block.body}</p>
                    )}

                    {canWrite && (
                      <div className="flex flex-wrap gap-xs">
                        <button
                          type="button"
                          className={ghostButtonClass}
                          onClick={() => {
                            setEditingId(block.id);
                            setForm({
                              kind: block.kind,
                              title: block.title,
                              slug: block.slug,
                              body: block.body ?? "",
                              imageUrl: block.imageUrl ?? "",
                              linkUrl: block.linkUrl ?? "",
                              position: block.position,
                              status: block.status,
                            });
                          }}
                        >
                          Ubah
                        </button>
                        <button
                          type="button"
                          className={ghostButtonClass}
                          onClick={() =>
                            void removeBlock
                              .mutateAsync(block.id)
                              .then(() => toast.success("Blok dihapus."))
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
              icon={LayoutTemplate}
              title="Belum ada blok konten"
              description="Tambahkan banner atau halaman statis pertama untuk lembaga ini."
            />
          )}
        </AppSection>
      </Stack>
    </PermissionGate>
  );
}
