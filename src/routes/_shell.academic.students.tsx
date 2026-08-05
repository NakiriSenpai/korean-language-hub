import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Plus, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";

import {
  ACADEMIC_PERMISSIONS,
  useCreateStudentProfile,
  useDeleteStudentProfile,
  useStudentProfiles,
} from "@/modules/academic";
import {
  Field,
  TextInput,
  buttonClass,
  ghostButtonClass,
} from "@/modules/academic/components/Form";
import { usePermissions } from "@/modules/identity";
import { AppCard, AppSection, Grid, Stack } from "@/shared/components/layout";
import { EmptyState } from "@/shared/components/shell";
import { toUserMessage } from "@/shared/platform";

export const Route = createFileRoute("/_shell/academic/students")({
  head: () => ({
    meta: [
      { title: "Peserta — Hangeul LPK Platform" },
      {
        name: "description",
        content: "Data peserta pelatihan bahasa Korea: nomor induk, kontak, dan catatan.",
      },
      { property: "og:title", content: "Peserta — Hangeul LPK Platform" },
      {
        property: "og:description",
        content: "Profil peserta tersimpan per lembaga dan menjadi dasar pendaftaran kelas.",
      },
    ],
  }),
  component: StudentsPage,
});

const emptyForm = {
  studentNumber: "",
  fullName: "",
  birthDate: "",
  phone: "",
  email: "",
  notes: "",
};

function StudentsPage() {
  const { can } = usePermissions();
  const canWrite = can(ACADEMIC_PERMISSIONS.write);
  const [search, setSearch] = useState("");
  const students = useStudentProfiles(search);
  const createStudent = useCreateStudentProfile();
  const removeStudent = useDeleteStudentProfile();

  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      await createStudent.mutateAsync(form);
      setForm(emptyForm);
      toast.success("Peserta ditambahkan.");
    } catch (cause) {
      setError(toUserMessage(cause));
    }
  };

  return (
    <Stack gap="xl">
      {canWrite && (
        <AppSection title="Tambah peserta" description="Nomor induk harus unik di dalam lembaga.">
          <AppCard>
            <form onSubmit={onSubmit} className="flex flex-col gap-md" noValidate>
              <Grid cols={1} smCols={2} lgCols={2} gap="md">
                <Field label="Nomor induk" htmlFor="studentNumber">
                  <TextInput
                    id="studentNumber"
                    required
                    value={form.studentNumber}
                    onChange={(event) => setForm({ ...form, studentNumber: event.target.value })}
                    placeholder="2026-0001"
                  />
                </Field>
                <Field label="Nama lengkap" htmlFor="fullName">
                  <TextInput
                    id="fullName"
                    required
                    value={form.fullName}
                    onChange={(event) => setForm({ ...form, fullName: event.target.value })}
                    placeholder="Nama peserta"
                  />
                </Field>
                <Field label="Tanggal lahir" htmlFor="birthDate" hint="Opsional">
                  <TextInput
                    id="birthDate"
                    type="date"
                    value={form.birthDate}
                    onChange={(event) => setForm({ ...form, birthDate: event.target.value })}
                  />
                </Field>
                <Field label="Telepon" htmlFor="phone" hint="Opsional">
                  <TextInput
                    id="phone"
                    value={form.phone}
                    onChange={(event) => setForm({ ...form, phone: event.target.value })}
                    placeholder="08xxxxxxxxxx"
                  />
                </Field>
                <Field label="Email" htmlFor="email" hint="Opsional">
                  <TextInput
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm({ ...form, email: event.target.value })}
                    placeholder="nama@email.com"
                  />
                </Field>
                <Field label="Catatan" htmlFor="notes" hint="Opsional">
                  <TextInput
                    id="notes"
                    value={form.notes}
                    onChange={(event) => setForm({ ...form, notes: event.target.value })}
                    placeholder="Catatan singkat"
                  />
                </Field>
              </Grid>

              {error && (
                <p role="alert" className="text-body-sm text-destructive">
                  {error}
                </p>
              )}

              <div>
                <button type="submit" className={buttonClass} disabled={createStudent.isPending}>
                  {createStudent.isPending ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Plus className="size-4" aria-hidden="true" />
                  )}
                  Simpan peserta
                </button>
              </div>
            </form>
          </AppCard>
        </AppSection>
      )}

      <AppSection
        title="Daftar peserta"
        description="Cari berdasarkan nama atau nomor induk."
        actions={
          <TextInput
            aria-label="Cari peserta"
            className="w-auto"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari peserta…"
          />
        }
      >
        {students.isLoading ? (
          <p className="text-body-sm text-text-secondary">Memuat peserta…</p>
        ) : students.data && students.data.length > 0 ? (
          <Stack gap="sm">
            {students.data.map((student) => (
              <AppCard key={student.id} padding="md">
                <div className="flex flex-wrap items-center justify-between gap-md">
                  <div className="min-w-0">
                    <h3 className="text-title text-text-primary">{student.fullName}</h3>
                    <p className="mt-xs text-body-sm text-text-secondary">
                      {student.studentNumber}
                      {student.phone ? ` · ${student.phone}` : ""}
                      {student.email ? ` · ${student.email}` : ""}
                    </p>
                  </div>
                  {canWrite && (
                    <button
                      type="button"
                      className={ghostButtonClass}
                      aria-label={`Hapus ${student.fullName}`}
                      onClick={() =>
                        removeStudent
                          .mutateAsync(student.id)
                          .then(() => toast.success("Peserta dihapus."))
                          .catch((cause: unknown) => toast.error(toUserMessage(cause)))
                      }
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </AppCard>
            ))}
          </Stack>
        ) : (
          <EmptyState
            icon={UserRound}
            title="Belum ada peserta"
            description="Tambahkan peserta terlebih dahulu sebelum melakukan pendaftaran kelas."
          />
        )}
      </AppSection>
    </Stack>
  );
}
