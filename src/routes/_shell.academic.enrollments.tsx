import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ClipboardList, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  ACADEMIC_PERMISSIONS,
  EnrollmentBadge,
  summarizeEnrollments,
  useAcademicPeriods,
  useDeleteEnrollment,
  useEnrollStudent,
  useEnrollments,
  useStudentProfiles,
  useStudyGroups,
  useUpdateEnrollmentStatus,
} from "@/modules/academic";
import {
  Field,
  SelectInput,
  buttonClass,
  ghostButtonClass,
} from "@/modules/academic/components/Form";
import { usePermissions } from "@/modules/identity";
import { AppCard, AppSection, Grid, Stack } from "@/shared/components/layout";
import { EmptyState } from "@/shared/components/shell";
import { toUserMessage } from "@/shared/platform";

export const Route = createFileRoute("/_shell/academic/enrollments")({
  head: () => ({
    meta: [
      { title: "Pendaftaran — Hangeul LPK Platform" },
      {
        name: "description",
        content: "Daftarkan peserta ke kelas dan kelola status pendaftaran sepanjang periode.",
      },
      { property: "og:title", content: "Pendaftaran — Hangeul LPK Platform" },
      {
        property: "og:description",
        content: "Kapasitas kelas divalidasi otomatis saat peserta didaftarkan.",
      },
    ],
  }),
  component: EnrollmentsPage,
});

function EnrollmentsPage() {
  const { can } = usePermissions();
  const canWrite = can(ACADEMIC_PERMISSIONS.enrollmentWrite);
  const periods = useAcademicPeriods();
  const [periodFilter, setPeriodFilter] = useState("");
  const groups = useStudyGroups(periodFilter ? { periodId: periodFilter } : {});
  const students = useStudentProfiles();
  const enrollments = useEnrollments(periodFilter ? { periodId: periodFilter } : {});
  const enroll = useEnrollStudent();
  const updateStatus = useUpdateEnrollmentStatus();
  const removeEnrollment = useDeleteEnrollment();

  const [form, setForm] = useState({ studyGroupId: "", studentProfileId: "" });
  const [error, setError] = useState<string | null>(null);
  const summary = summarizeEnrollments(enrollments.data ?? []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      await enroll.mutateAsync(form);
      setForm({ studyGroupId: form.studyGroupId, studentProfileId: "" });
      toast.success("Peserta didaftarkan.");
    } catch (cause) {
      setError(toUserMessage(cause));
    }
  };

  return (
    <Stack gap="xl">
      {canWrite && (
        <AppSection title="Daftarkan peserta" description="Kelas yang penuh atau diarsipkan akan ditolak.">
          <AppCard>
            <form onSubmit={onSubmit} className="flex flex-col gap-md" noValidate>
              <Grid cols={1} smCols={2} lgCols={2} gap="md">
                <Field label="Kelas" htmlFor="studyGroupId">
                  <SelectInput
                    id="studyGroupId"
                    required
                    value={form.studyGroupId}
                    onChange={(event) => setForm({ ...form, studyGroupId: event.target.value })}
                  >
                    <option value="">Pilih kelas</option>
                    {(groups.data ?? []).map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name} ({group.enrolledCount}/{group.capacity})
                      </option>
                    ))}
                  </SelectInput>
                </Field>
                <Field label="Peserta" htmlFor="studentProfileId">
                  <SelectInput
                    id="studentProfileId"
                    required
                    value={form.studentProfileId}
                    onChange={(event) => setForm({ ...form, studentProfileId: event.target.value })}
                  >
                    <option value="">Pilih peserta</option>
                    {(students.data ?? []).map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.fullName} · {student.studentNumber}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
              </Grid>

              {error && (
                <p role="alert" className="text-body-sm text-destructive">
                  {error}
                </p>
              )}

              <div>
                <button type="submit" className={buttonClass} disabled={enroll.isPending}>
                  {enroll.isPending ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Plus className="size-4" aria-hidden="true" />
                  )}
                  Daftarkan
                </button>
              </div>
            </form>
          </AppCard>
        </AppSection>
      )}

      <AppSection
        title="Pendaftaran"
        description={`${summary.total} pendaftaran · ${summary.active} aktif · ${summary.completed} selesai · ${summary.suspended} ditangguhkan · ${summary.dropped} keluar`}
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
        {enrollments.isLoading ? (
          <p className="text-body-sm text-text-secondary">Memuat pendaftaran…</p>
        ) : enrollments.data && enrollments.data.length > 0 ? (
          <Stack gap="sm">
            {enrollments.data.map((enrollment) => (
              <AppCard key={enrollment.id} padding="md">
                <div className="flex flex-wrap items-center justify-between gap-md">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-sm">
                      <h3 className="text-title text-text-primary">{enrollment.studentName}</h3>
                      <EnrollmentBadge status={enrollment.status} />
                    </div>
                    <p className="mt-xs text-body-sm text-text-secondary">
                      {enrollment.studentNumber} · {enrollment.studyGroupName} · masuk{" "}
                      {enrollment.enrolledOn}
                    </p>
                  </div>

                  {canWrite && (
                    <div className="flex items-center gap-xs">
                      <SelectInput
                        aria-label={`Status pendaftaran ${enrollment.studentName}`}
                        className="w-auto"
                        value={enrollment.status}
                        onChange={(event) =>
                          updateStatus
                            .mutateAsync({
                              id: enrollment.id,
                              status: event.target.value as typeof enrollment.status,
                            })
                            .catch((cause: unknown) => toast.error(toUserMessage(cause)))
                        }
                      >
                        <option value="active">Aktif</option>
                        <option value="completed">Selesai</option>
                        <option value="suspended">Ditangguhkan</option>
                        <option value="dropped">Keluar</option>
                      </SelectInput>
                      <button
                        type="button"
                        className={ghostButtonClass}
                        aria-label={`Hapus pendaftaran ${enrollment.studentName}`}
                        onClick={() =>
                          removeEnrollment
                            .mutateAsync(enrollment.id)
                            .then(() => toast.success("Pendaftaran dihapus."))
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
            icon={ClipboardList}
            title="Belum ada pendaftaran"
            description="Pilih kelas dan peserta untuk membuat pendaftaran pertama."
          />
        )}
      </AppSection>
    </Stack>
  );
}
