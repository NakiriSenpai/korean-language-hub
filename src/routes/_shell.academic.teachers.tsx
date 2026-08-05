import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { GraduationCap, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  ACADEMIC_PERMISSIONS,
  StatusBadge,
  statusLabel,
  useAssignTeacher,
  useAssignableTeachers,
  useRemoveTeacherAssignment,
  useStudyGroups,
  useTeacherAssignments,
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

export const Route = createFileRoute("/_shell/academic/teachers")({
  head: () => ({
    meta: [
      { title: "Penugasan Pengajar — Hangeul LPK Platform" },
      {
        name: "description",
        content: "Tugaskan pengajar utama dan asisten pada setiap kelas periode akademik.",
      },
      { property: "og:title", content: "Penugasan Pengajar — Hangeul LPK Platform" },
      {
        property: "og:description",
        content: "Hanya anggota lembaga dengan peran pengajar yang dapat ditugaskan.",
      },
    ],
  }),
  component: TeacherAssignmentsPage,
});

function TeacherAssignmentsPage() {
  const { can } = usePermissions();
  const canWrite = can(ACADEMIC_PERMISSIONS.write);
  const groups = useStudyGroups();
  const teachers = useAssignableTeachers();
  const assignments = useTeacherAssignments();
  const assign = useAssignTeacher();
  const removeAssignment = useRemoveTeacherAssignment();

  const [form, setForm] = useState({
    studyGroupId: "",
    teacherUserId: "",
    assignmentRole: "lead" as "lead" | "assistant",
  });
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      await assign.mutateAsync(form);
      setForm({ ...form, teacherUserId: "" });
      toast.success("Pengajar ditugaskan.");
    } catch (cause) {
      setError(toUserMessage(cause));
    }
  };

  return (
    <Stack gap="xl">
      {canWrite && (
        <AppSection title="Tugaskan pengajar" description="Satu kelas dapat memiliki pengajar utama dan asisten.">
          <AppCard>
            <form onSubmit={onSubmit} className="flex flex-col gap-md" noValidate>
              <Grid cols={1} smCols={2} lgCols={3} gap="md">
                <Field label="Kelas" htmlFor="assignGroup">
                  <SelectInput
                    id="assignGroup"
                    required
                    value={form.studyGroupId}
                    onChange={(event) => setForm({ ...form, studyGroupId: event.target.value })}
                  >
                    <option value="">Pilih kelas</option>
                    {(groups.data ?? []).map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
                <Field label="Pengajar" htmlFor="assignTeacher">
                  <SelectInput
                    id="assignTeacher"
                    required
                    value={form.teacherUserId}
                    onChange={(event) => setForm({ ...form, teacherUserId: event.target.value })}
                  >
                    <option value="">Pilih pengajar</option>
                    {(teachers.data ?? []).map((teacher) => (
                      <option key={teacher.userId} value={teacher.userId}>
                        {teacher.name}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
                <Field label="Peran" htmlFor="assignRole">
                  <SelectInput
                    id="assignRole"
                    value={form.assignmentRole}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        assignmentRole: event.target.value as "lead" | "assistant",
                      })
                    }
                  >
                    <option value="lead">Pengajar Utama</option>
                    <option value="assistant">Asisten</option>
                  </SelectInput>
                </Field>
              </Grid>

              {error && (
                <p role="alert" className="text-body-sm text-destructive">
                  {error}
                </p>
              )}

              <div>
                <button type="submit" className={buttonClass} disabled={assign.isPending}>
                  {assign.isPending ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Plus className="size-4" aria-hidden="true" />
                  )}
                  Tugaskan
                </button>
              </div>
            </form>
          </AppCard>
        </AppSection>
      )}

      <AppSection title="Daftar penugasan" description="Penugasan aktif pada seluruh kelas lembaga.">
        {assignments.isLoading ? (
          <p className="text-body-sm text-text-secondary">Memuat penugasan…</p>
        ) : assignments.data && assignments.data.length > 0 ? (
          <Stack gap="sm">
            {assignments.data.map((assignment) => (
              <AppCard key={assignment.id} padding="md">
                <div className="flex flex-wrap items-center justify-between gap-md">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-sm">
                      <h3 className="text-title text-text-primary">
                        {assignment.teacherName ?? "Pengajar"}
                      </h3>
                      <StatusBadge tone={assignment.assignmentRole === "lead" ? "info" : "neutral"}>
                        {statusLabel(assignment.assignmentRole)}
                      </StatusBadge>
                    </div>
                    <p className="mt-xs text-body-sm text-text-secondary">
                      {assignment.studyGroupName} · sejak {assignment.assignedOn}
                    </p>
                  </div>
                  {canWrite && (
                    <button
                      type="button"
                      className={ghostButtonClass}
                      aria-label="Hapus penugasan"
                      onClick={() =>
                        removeAssignment
                          .mutateAsync(assignment.id)
                          .then(() => toast.success("Penugasan dihapus."))
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
            icon={GraduationCap}
            title="Belum ada penugasan"
            description="Tugaskan pengajar agar kelas siap dijalankan pada periode berjalan."
          />
        )}
      </AppSection>
    </Stack>
  );
}
