import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import {
  ACADEMIC_PERMISSIONS,
  LifecycleBadge,
  useAcademicPeriods,
  useCreateStudyGroup,
  useDeleteStudyGroup,
  useStudyGroups,
  useUpdateStudyGroupStatus,
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

export const Route = createFileRoute("/_shell/academic/groups")({
  head: () => ({
    meta: [
      { title: "Kelas — Hangeul LPK Platform" },
      {
        name: "description",
        content: "Kelola kelas belajar beserta kapasitas, level, dan ruang pada setiap periode.",
      },
      { property: "og:title", content: "Kelas — Hangeul LPK Platform" },
      {
        property: "og:description",
        content: "Kapasitas kelas dijaga otomatis agar pendaftaran tidak melebihi kuota.",
      },
    ],
  }),
  component: StudyGroupsPage,
});

const emptyForm = {
  periodId: "",
  name: "",
  code: "",
  level: "",
  room: "",
  capacity: "20",
  status: "draft" as const,
};

function StudyGroupsPage() {
  const { can } = usePermissions();
  const canWrite = can(ACADEMIC_PERMISSIONS.write);
  const periods = useAcademicPeriods();
  const [periodFilter, setPeriodFilter] = useState("");
  const groups = useStudyGroups(periodFilter ? { periodId: periodFilter } : {});
  const createGroup = useCreateStudyGroup();
  const updateStatus = useUpdateStudyGroupStatus();
  const removeGroup = useDeleteStudyGroup();

  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      await createGroup.mutateAsync({ ...form, capacity: Number(form.capacity) });
      setForm({ ...emptyForm, periodId: form.periodId });
      toast.success("Kelas dibuat.");
    } catch (cause) {
      setError(toUserMessage(cause));
    }
  };

  return (
    <Stack gap="xl">
      {canWrite && (
        <AppSection title="Buat kelas" description="Kelas selalu terikat pada satu periode akademik.">
          <AppCard>
            <form onSubmit={onSubmit} className="flex flex-col gap-md" noValidate>
              <Grid cols={1} smCols={2} lgCols={2} gap="md">
                <Field label="Periode akademik" htmlFor="periodId">
                  <SelectInput
                    id="periodId"
                    required
                    value={form.periodId}
                    onChange={(event) => setForm({ ...form, periodId: event.target.value })}
                  >
                    <option value="">Pilih periode</option>
                    {(periods.data ?? []).map((period) => (
                      <option key={period.id} value={period.id}>
                        {period.name}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
                <Field label="Nama kelas" htmlFor="groupName">
                  <TextInput
                    id="groupName"
                    required
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    placeholder="Kelas Pagi A"
                  />
                </Field>
                <Field label="Kode kelas" htmlFor="groupCode">
                  <TextInput
                    id="groupCode"
                    required
                    value={form.code}
                    onChange={(event) => setForm({ ...form, code: event.target.value })}
                    placeholder="PAGI-A"
                  />
                </Field>
                <Field label="Kapasitas" htmlFor="capacity">
                  <TextInput
                    id="capacity"
                    type="number"
                    min={1}
                    max={500}
                    required
                    value={form.capacity}
                    onChange={(event) => setForm({ ...form, capacity: event.target.value })}
                  />
                </Field>
                <Field label="Level" htmlFor="level" hint="Opsional">
                  <TextInput
                    id="level"
                    value={form.level}
                    onChange={(event) => setForm({ ...form, level: event.target.value })}
                    placeholder="Dasar"
                  />
                </Field>
                <Field label="Ruang" htmlFor="room" hint="Opsional">
                  <TextInput
                    id="room"
                    value={form.room}
                    onChange={(event) => setForm({ ...form, room: event.target.value })}
                    placeholder="Ruang 1"
                  />
                </Field>
              </Grid>

              {error && (
                <p role="alert" className="text-body-sm text-destructive">
                  {error}
                </p>
              )}

              <div>
                <button type="submit" className={buttonClass} disabled={createGroup.isPending}>
                  {createGroup.isPending ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Plus className="size-4" aria-hidden="true" />
                  )}
                  Simpan kelas
                </button>
              </div>
            </form>
          </AppCard>
        </AppSection>
      )}

      <AppSection
        title="Daftar kelas"
        description="Jumlah kursi terisi dihitung dari pendaftaran berstatus aktif."
        actions={
          <SelectInput
            aria-label="Filter periode"
            className="w-auto"
            value={periodFilter}
            onChange={(event) => setPeriodFilter(event.target.value)}
          >
            <option value="">Semua periode</option>
            {(periods.data ?? []).map((period) => (
              <option key={period.id} value={period.id}>
                {period.name}
              </option>
            ))}
          </SelectInput>
        }
      >
        {groups.isLoading ? (
          <p className="text-body-sm text-text-secondary">Memuat kelas…</p>
        ) : groups.data && groups.data.length > 0 ? (
          <Stack gap="sm">
            {groups.data.map((group) => (
              <AppCard key={group.id} padding="md">
                <div className="flex flex-wrap items-center justify-between gap-md">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-sm">
                      <h3 className="text-title text-text-primary">{group.name}</h3>
                      <LifecycleBadge status={group.status} />
                    </div>
                    <p className="mt-xs text-body-sm text-text-secondary">
                      {group.code}
                      {group.level ? ` · ${group.level}` : ""}
                      {group.room ? ` · ${group.room}` : ""} · {group.enrolledCount}/{group.capacity} kursi
                    </p>
                  </div>

                  {canWrite && (
                    <div className="flex items-center gap-xs">
                      <SelectInput
                        aria-label={`Status ${group.name}`}
                        className="w-auto"
                        value={group.status}
                        onChange={(event) =>
                          updateStatus
                            .mutateAsync({
                              id: group.id,
                              status: event.target.value as typeof group.status,
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
                        aria-label={`Hapus ${group.name}`}
                        onClick={() =>
                          removeGroup
                            .mutateAsync(group.id)
                            .then(() => toast.success("Kelas dihapus."))
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
            icon={Users}
            title="Belum ada kelas"
            description="Buat kelas pada periode aktif agar peserta dapat didaftarkan."
          />
        )}
      </AppSection>
    </Stack>
  );
}
