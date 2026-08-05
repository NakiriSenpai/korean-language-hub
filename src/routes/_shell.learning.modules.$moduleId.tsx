import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BookText, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { usePermissions } from "@/modules/identity";
import {
  ContentStatusBadge,
  LEARNING_PERMISSIONS,
  useCreateLesson,
  useDeleteLesson,
  useLessons,
  useModule,
  useUpdateLessonStatus,
} from "@/modules/learning";
import { AppCard, AppSection, Grid, Stack } from "@/shared/components/layout";
import { EmptyState } from "@/shared/components/shell";
import {
  Field,
  SelectInput,
  TextInput,
  buttonClass,
  ghostButtonClass,
} from "@/shared/components/form";
import { toUserMessage } from "@/shared/platform";

export const Route = createFileRoute("/_shell/learning/modules/$moduleId")({
  head: () => ({
    meta: [
      { title: "Lesson — Learning | Hangeul LPK Platform" },
      {
        name: "description",
        content: "Lesson di dalam module, lengkap dengan estimasi waktu dan status penerbitan.",
      },
      { property: "og:title", content: "Lesson — Learning" },
      {
        property: "og:description",
        content: "Susun lesson sebagai satuan belajar yang dibaca peserta di reader.",
      },
    ],
  }),
  component: LessonsPage,
});

function LessonsPage() {
  const { moduleId } = Route.useParams();
  const { can } = usePermissions();
  const canWrite = can(LEARNING_PERMISSIONS.write);
  const parentModule = useModule(moduleId);
  const lessons = useLessons(moduleId);
  const createLesson = useCreateLesson();
  const updateStatus = useUpdateLessonStatus();
  const removeLesson = useDeleteLesson();

  const [form, setForm] = useState({
    title: "",
    summary: "",
    estimatedMinutes: "10",
    status: "draft" as const,
  });
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      await createLesson.mutateAsync({
        ...form,
        moduleId,
        estimatedMinutes: Number(form.estimatedMinutes) || 10,
      });
      setForm({ title: "", summary: "", estimatedMinutes: "10", status: "draft" });
      toast.success("Lesson dibuat.");
    } catch (cause) {
      setError(toUserMessage(cause));
    }
  };

  return (
    <Stack gap="xl">
      <AppSection
        title={parentModule.data?.title ?? "Module"}
        description={parentModule.data?.summary ?? "Lesson yang tersedia pada module ini."}
        actions={
          parentModule.data ? (
            <Link
              to="/learning/courses/$courseId"
              params={{ courseId: parentModule.data.courseId }}
              className={ghostButtonClass}
            >
              Kembali ke module
            </Link>
          ) : null
        }
      >
        {canWrite && (
          <AppCard>
            <form onSubmit={onSubmit} className="flex flex-col gap-md" noValidate>
              <Grid cols={1} smCols={2} lgCols={3} gap="md">
                <Field label="Judul lesson" htmlFor="lessonTitle">
                  <TextInput
                    id="lessonTitle"
                    required
                    value={form.title}
                    onChange={(event) => setForm({ ...form, title: event.target.value })}
                    placeholder="Vokal Dasar"
                  />
                </Field>
                <Field label="Estimasi (menit)" htmlFor="lessonMinutes">
                  <TextInput
                    id="lessonMinutes"
                    type="number"
                    min={1}
                    max={600}
                    value={form.estimatedMinutes}
                    onChange={(event) => setForm({ ...form, estimatedMinutes: event.target.value })}
                  />
                </Field>
                <Field label="Status" htmlFor="lessonStatus">
                  <SelectInput
                    id="lessonStatus"
                    value={form.status}
                    onChange={(event) =>
                      setForm({ ...form, status: event.target.value as typeof form.status })
                    }
                  >
                    <option value="draft">Draf</option>
                    <option value="published">Terbit</option>
                    <option value="archived">Arsip</option>
                  </SelectInput>
                </Field>
              </Grid>
              <Field label="Ringkasan" htmlFor="lessonSummary">
                <TextInput
                  id="lessonSummary"
                  value={form.summary}
                  onChange={(event) => setForm({ ...form, summary: event.target.value })}
                  placeholder="Mengenal sepuluh vokal dasar Hangeul"
                />
              </Field>
              {error && (
                <p role="alert" className="text-caption text-destructive">
                  {error}
                </p>
              )}
              <div>
                <button type="submit" className={buttonClass} disabled={createLesson.isPending}>
                  {createLesson.isPending ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Plus className="size-4" aria-hidden="true" />
                  )}
                  Simpan lesson
                </button>
              </div>
            </form>
          </AppCard>
        )}
      </AppSection>

      <AppSection title="Daftar lesson">
        {lessons.isLoading ? (
          <p className="text-body-sm text-text-secondary">Memuat lesson…</p>
        ) : (lessons.data ?? []).length === 0 ? (
          <EmptyState
            icon={BookText}
            title="Belum ada lesson"
            description="Tambahkan lesson agar peserta bisa mulai membaca materi."
          />
        ) : (
          <Grid cols={1} smCols={2} lgCols={3} gap="md">
            {(lessons.data ?? []).map((lesson) => (
              <AppCard key={lesson.id} interactive>
                <Stack gap="sm">
                  <div className="flex items-start justify-between gap-sm">
                    <Link
                      to="/learning/lessons/$lessonId"
                      params={{ lessonId: lesson.id }}
                      className="min-w-0 text-title text-text-primary hover:underline"
                    >
                      {lesson.title}
                    </Link>
                    <ContentStatusBadge status={lesson.status} />
                  </div>
                  <p className="text-body-sm text-text-secondary">
                    {lesson.summary ?? "Tanpa ringkasan."}
                  </p>
                  <p className="text-caption text-text-secondary">
                    ± {lesson.estimatedMinutes} menit
                  </p>
                  {canWrite && (
                    <div className="flex flex-wrap gap-xs">
                      <SelectInput
                        aria-label={`Status ${lesson.title}`}
                        value={lesson.status}
                        onChange={(event) =>
                          updateStatus.mutate({
                            lessonId: lesson.id,
                            status: event.target.value as typeof lesson.status,
                          })
                        }
                        className="max-w-40"
                      >
                        <option value="draft">Draf</option>
                        <option value="published">Terbit</option>
                        <option value="archived">Arsip</option>
                      </SelectInput>
                      <button
                        type="button"
                        className={ghostButtonClass}
                        onClick={() => removeLesson.mutate(lesson.id)}
                        aria-label={`Hapus ${lesson.title}`}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </Stack>
              </AppCard>
            ))}
          </Grid>
        )}
      </AppSection>
    </Stack>
  );
}
