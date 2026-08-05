import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarRange, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  ACADEMIC_PERMISSIONS,
  LifecycleBadge,
  useAcademicPeriods,
  useCreateAcademicPeriod,
  useDeleteAcademicPeriod,
  useUpdateAcademicPeriodStatus,
} from "@/modules/academic";
import {
  Field,
  SelectInput,
  TextInput,
  buttonClass,
  ghostButtonClass,
} from "@/modules/academic/components/Form";
import { usePermissions } from "@/modules/identity";
import { AppCard, AppSection, Grid, Stack } from "@/shared/components/layout";
import { EmptyState } from "@/shared/components/shell";
import { toUserMessage } from "@/shared/platform";

export const Route = createFileRoute("/_shell/academic/")({
  head: () => ({
    meta: [
      { title: "Periode Akademik — Hangeul LPK Platform" },
      {
        name: "description",
        content: "Kelola periode akademik lembaga: jadwal mulai, selesai, dan status aktif.",
      },
      { property: "og:title", content: "Periode Akademik — Hangeul LPK Platform" },
      {
        property: "og:description",
        content: "Satu periode aktif per lembaga menjadi dasar seluruh aktivitas akademik.",
      },
    ],
  }),
  component: AcademicPeriodsPage,
});

const emptyForm = { name: "", code: "", startsOn: "", endsOn: "", status: "draft" as const };

function AcademicPeriodsPage() {
  const { can } = usePermissions();
  const canWrite = can(ACADEMIC_PERMISSIONS.write);
  const periods = useAcademicPeriods();
  const createPeriod = useCreateAcademicPeriod();
  const updateStatus = useUpdateAcademicPeriodStatus();
  const removePeriod = useDeleteAcademicPeriod();

  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      await createPeriod.mutateAsync(form);
      setForm(emptyForm);
      toast.success("Periode akademik dibuat.");
    } catch (cause) {
      setError(toUserMessage(cause));
    }
  };

  return (
    <Stack gap="xl">
      {canWrite && (
        <AppSection title="Buat periode akademik" description="Satu lembaga hanya boleh punya satu periode aktif.">
          <AppCard>
            <form onSubmit={onSubmit} className="flex flex-col gap-md" noValidate>
              <Grid cols={1} smCols={2} lgCols={2} gap="md">
                <Field label="Nama periode" htmlFor="name">
                  <TextInput
                    id="name"
                    required
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    placeholder="Semester Ganjil 2026"
                  />
                </Field>
                <Field label="Kode" htmlFor="code" hint="Unik per lembaga, contoh 2026-GANJIL">
                  <TextInput
                    id="code"
                    required
                    value={form.code}
                    onChange={(event) => setForm({ ...form, code: event.target.value })}
                    placeholder="2026-GANJIL"
                  />
                </Field>
                <Field label="Mulai" htmlFor="startsOn">
                  <TextInput
                    id="startsOn"
                    type="date"
                    required
                    value={form.startsOn}
                    onChange={(event) => setForm({ ...form, startsOn: event.target.value })}
                  />
                </Field>
                <Field label="Selesai" htmlFor="endsOn">
                  <TextInput
                    id="endsOn"
                    type="date"
                    required
                    value={form.endsOn}
                    onChange={(event) => setForm({ ...form, endsOn: event.target.value })}
                  />
                </Field>
              </Grid>

              {error && (
                <p role="alert" className="text-body-sm text-destructive">
                  {error}
                </p>
              )}

              <div>
                <button type="submit" className={buttonClass} disabled={createPeriod.isPending}>
                  {createPeriod.isPending ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Plus className="size-4" aria-hidden="true" />
                  )}
                  Simpan periode
                </button>
              </div>
            </form>
          </AppCard>
        </AppSection>
      )}

      <AppSection title="Daftar periode" description="Diurutkan dari periode terbaru.">
        {periods.isLoading ? (
          <p className="text-body-sm text-text-secondary">Memuat periode…</p>
        ) : periods.data && periods.data.length > 0 ? (
          <Stack gap="sm">
            {periods.data.map((period) => (
              <AppCard key={period.id} padding="md">
                <div className="flex flex-wrap items-center justify-between gap-md">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-sm">
                      <h3 className="text-title text-text-primary">{period.name}</h3>
                      <LifecycleBadge status={period.status} />
                    </div>
                    <p className="mt-xs text-body-sm text-text-secondary">
                      {period.code} · {period.startsOn} — {period.endsOn}
                    </p>
                  </div>

                  {canWrite && (
                    <div className="flex items-center gap-xs">
                      <SelectInput
                        aria-label={`Status ${period.name}`}
                        className="w-auto"
                        value={period.status}
                        onChange={(event) =>
                          updateStatus
                            .mutateAsync({
                              id: period.id,
                              status: event.target.value as typeof period.status,
                            })
                            .catch((cause: unknown) => toast.error(toUserMessage(cause)))
                        }
                      >
                        <option value="draft">Draf</option>
                        <option value="active">Aktif</option>
                        <option value="archived">Arsip</option>
                      </SelectInput>
                      <button
                        type="button"
                        className={ghostButtonClass}
                        aria-label={`Hapus ${period.name}`}
                        onClick={() =>
                          removePeriod
                            .mutateAsync(period.id)
                            .then(() => toast.success("Periode dihapus."))
                            .catch((cause: unknown) => toast.error(toUserMessage(cause)))
                        }
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </div>
              </AppCard>
            ))}
          </Stack>
        ) : (
          <EmptyState
            icon={CalendarRange}
            title="Belum ada periode akademik"
            description="Buat periode pertama untuk mulai menyusun kelas dan pendaftaran peserta."
          />
        )}
      </AppSection>
    </Stack>
  );
}
