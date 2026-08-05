import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Megaphone, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PermissionGate, usePermissions } from "@/modules/identity";
import {
  PLATFORM_PERMISSIONS,
  StatusPill,
  announcementInputSchema,
  formatDateTime,
  platformLabel,
  useAnnouncements,
  useDeleteAnnouncement,
  useSaveAnnouncement,
  useSetAnnouncementStatus,
} from "@/modules/platform";
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

export const Route = createFileRoute("/_shell/platform/announcements")({
  head: () => ({
    meta: [
      { title: "Pengumuman — Hangeul LPK Platform" },
      {
        name: "description",
        content: "Susun, terbitkan, dan arsipkan pengumuman untuk lembaga atau kelompok belajar.",
      },
      { property: "og:title", content: "Pengumuman — Hangeul LPK Platform" },
      {
        property: "og:description",
        content: "Pengumuman mendukung target platform, lembaga, atau kelompok belajar tertentu.",
      },
    ],
  }),
  component: AnnouncementsPage,
});

interface AnnouncementForm {
  title: string;
  body: string;
  audience: "platform" | "tenant" | "study_group";
  studyGroupId: string;
  pinned: boolean;
}

const emptyForm: AnnouncementForm = {
  title: "",
  body: "",
  audience: "tenant",
  studyGroupId: "",
  pinned: false,
};

function AnnouncementsPage() {
  const { can } = usePermissions();
  const canWrite = can(PLATFORM_PERMISSIONS.announcementWrite);
  const announcements = useAnnouncements();
  const saveAnnouncement = useSaveAnnouncement();
  const setStatus = useSetAnnouncementStatus();
  const removeAnnouncement = useDeleteAnnouncement();

  const [form, setForm] = useState<AnnouncementForm>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const parsed = announcementInputSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Data tidak valid");
      return;
    }
    try {
      await saveAnnouncement.mutateAsync({ input: parsed.data });
      setForm(emptyForm);
      toast.success("Pengumuman tersimpan sebagai draf.");
    } catch (cause) {
      setError(toUserMessage(cause));
    }
  };

  return (
    <PermissionGate required={[PLATFORM_PERMISSIONS.announcementRead]}>
      <Stack gap="xl">
        {canWrite && (
          <AppSection
            title="Pengumuman baru"
            description="Pengumuman dibuat sebagai draf, lalu diterbitkan saat siap."
          >
            <AppCard>
              <form onSubmit={onSubmit} className="flex flex-col gap-md" noValidate>
                <Field label="Judul" htmlFor="title">
                  <TextInput
                    id="title"
                    required
                    value={form.title}
                    onChange={(event) => setForm({ ...form, title: event.target.value })}
                    placeholder="Jadwal ujian EPS-TOPIK gelombang 1"
                  />
                </Field>
                <Field label="Isi" htmlFor="body">
                  <TextArea
                    id="body"
                    required
                    value={form.body}
                    onChange={(event) => setForm({ ...form, body: event.target.value })}
                    placeholder="Tuliskan informasi lengkap untuk peserta."
                  />
                </Field>
                <Grid cols={1} smCols={2} gap="md">
                  <Field label="Target" htmlFor="audience">
                    <SelectInput
                      id="audience"
                      value={form.audience}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          audience: event.target.value as AnnouncementForm["audience"],
                        })
                      }
                    >
                      <option value="tenant">Lembaga</option>
                      <option value="platform">Seluruh platform</option>
                      <option value="study_group">Kelompok belajar</option>
                    </SelectInput>
                  </Field>
                  {form.audience === "study_group" && (
                    <Field
                      label="ID kelompok belajar"
                      htmlFor="studyGroupId"
                      hint="Salin dari halaman Akademik."
                    >
                      <TextInput
                        id="studyGroupId"
                        value={form.studyGroupId}
                        onChange={(event) => setForm({ ...form, studyGroupId: event.target.value })}
                      />
                    </Field>
                  )}
                </Grid>
                <label
                  htmlFor="pinned"
                  className="flex min-h-11 items-center gap-sm text-body-sm text-text-primary"
                >
                  <input
                    id="pinned"
                    type="checkbox"
                    className="size-5 rounded border-border accent-primary"
                    checked={form.pinned}
                    onChange={(event) => setForm({ ...form, pinned: event.target.checked })}
                  />
                  Sematkan di bagian atas
                </label>

                {error && (
                  <p role="alert" className="text-caption text-destructive">
                    {error}
                  </p>
                )}
                <div>
                  <button
                    type="submit"
                    className={buttonClass}
                    disabled={saveAnnouncement.isPending}
                  >
                    <Megaphone className="size-4" aria-hidden="true" />
                    Simpan draf
                  </button>
                </div>
              </form>
            </AppCard>
          </AppSection>
        )}

        <AppSection title="Daftar pengumuman" description="Pengumuman tersemat tampil paling atas.">
          {announcements.data && announcements.data.length > 0 ? (
            <Stack gap="md">
              {announcements.data.map((item) => (
                <AppCard key={item.id}>
                  <Stack gap="sm">
                    <div className="flex flex-wrap items-start justify-between gap-md">
                      <div className="min-w-0">
                        <p className="text-body font-medium text-text-primary">{item.title}</p>
                        <p className="text-caption text-text-secondary">
                          {platformLabel(item.audience)} · {formatDateTime(item.createdAt)}
                          {item.pinned ? " · Tersemat" : ""}
                        </p>
                      </div>
                      <StatusPill status={item.status} />
                    </div>
                    <p className="whitespace-pre-line text-body-sm text-text-secondary">
                      {item.body}
                    </p>

                    {canWrite && (
                      <div className="flex flex-wrap gap-xs">
                        {item.status !== "published" && (
                          <button
                            type="button"
                            className={buttonClass}
                            onClick={() =>
                              void setStatus
                                .mutateAsync({ announcementId: item.id, status: "published" })
                                .then(() => toast.success("Pengumuman diterbitkan."))
                                .catch((cause: unknown) => toast.error(toUserMessage(cause)))
                            }
                          >
                            Terbitkan
                          </button>
                        )}
                        {item.status === "published" && (
                          <button
                            type="button"
                            className={ghostButtonClass}
                            onClick={() =>
                              void setStatus
                                .mutateAsync({ announcementId: item.id, status: "archived" })
                                .then(() => toast.success("Pengumuman diarsipkan."))
                                .catch((cause: unknown) => toast.error(toUserMessage(cause)))
                            }
                          >
                            Arsipkan
                          </button>
                        )}
                        <button
                          type="button"
                          className={ghostButtonClass}
                          onClick={() =>
                            void removeAnnouncement
                              .mutateAsync(item.id)
                              .then(() => toast.success("Pengumuman dihapus."))
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
            </Stack>
          ) : (
            <EmptyState
              icon={Megaphone}
              title="Belum ada pengumuman"
              description="Buat pengumuman pertama untuk menyampaikan informasi kepada peserta."
            />
          )}
        </AppSection>
      </Stack>
    </PermissionGate>
  );
}
