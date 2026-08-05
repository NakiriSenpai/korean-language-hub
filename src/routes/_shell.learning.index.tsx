import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { usePermissions } from "@/modules/identity";
import {
  ContentStatusBadge,
  ContinueLearningCard,
  LEARNING_PERMISSIONS,
  useCourses,
  useCreateCourse,
  useDeleteCourse,
  useUpdateCourseStatus,
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

export const Route = createFileRoute("/_shell/learning/")({
  head: () => ({
    meta: [
      { title: "Course — Learning | Hangeul LPK Platform" },
      {
        name: "description",
        content: "Daftar course bahasa Korea beserta jumlah module dan status penerbitannya.",
      },
      { property: "og:title", content: "Course — Learning" },
      {
        property: "og:description",
        content: "Kelola course sebagai akar struktur materi pembelajaran.",
      },
    ],
  }),
  component: CoursesPage,
});

const emptyForm = { title: "", slug: "", summary: "", level: "", status: "draft" as const };

function CoursesPage() {
  const { can } = usePermissions();
  const canWrite = can(LEARNING_PERMISSIONS.write);
  const courses = useCourses();
  const createCourse = useCreateCourse();
  const updateStatus = useUpdateCourseStatus();
  const removeCourse = useDeleteCourse();

  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      await createCourse.mutateAsync(form);
      setForm(emptyForm);
      toast.success("Course dibuat.");
    } catch (cause) {
      setError(toUserMessage(cause));
    }
  };

  return (
    <Stack gap="xl">
      <ContinueLearningCard />

      {canWrite && (
        <AppSection title="Buat course" description="Course adalah akar dari seluruh materi.">
          <AppCard>
            <form onSubmit={onSubmit} className="flex flex-col gap-md" noValidate>
              <Grid cols={1} smCols={2} lgCols={2} gap="md">
                <Field label="Judul course" htmlFor="courseTitle">
                  <TextInput
                    id="courseTitle"
                    required
                    value={form.title}
                    onChange={(event) => setForm({ ...form, title: event.target.value })}
                    placeholder="Bahasa Korea Dasar"
                  />
                </Field>
                <Field label="Slug" htmlFor="courseSlug" hint="Huruf kecil, angka, dan minus.">
                  <TextInput
                    id="courseSlug"
                    required
                    value={form.slug}
                    onChange={(event) => setForm({ ...form, slug: event.target.value })}
                    placeholder="bahasa-korea-dasar"
                  />
                </Field>
                <Field label="Level" htmlFor="courseLevel">
                  <TextInput
                    id="courseLevel"
                    value={form.level}
                    onChange={(event) => setForm({ ...form, level: event.target.value })}
                    placeholder="Pemula"
                  />
                </Field>
                <Field label="Status" htmlFor="courseStatus">
                  <SelectInput
                    id="courseStatus"
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
              <Field label="Ringkasan" htmlFor="courseSummary">
                <TextInput
                  id="courseSummary"
                  value={form.summary}
                  onChange={(event) => setForm({ ...form, summary: event.target.value })}
                  placeholder="Materi dasar untuk peserta baru"
                />
              </Field>
              {error && (
                <p role="alert" className="text-caption text-destructive">
                  {error}
                </p>
              )}
              <div>
                <button type="submit" className={buttonClass} disabled={createCourse.isPending}>
                  {createCourse.isPending ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Plus className="size-4" aria-hidden="true" />
                  )}
                  Simpan course
                </button>
              </div>
            </form>
          </AppCard>
        </AppSection>
      )}

      <AppSection
        title="Daftar course"
        description="Pilih course untuk melihat module di dalamnya."
      >
        {courses.isLoading ? (
          <p className="text-body-sm text-text-secondary">Memuat course…</p>
        ) : (courses.data ?? []).length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Belum ada course"
            description="Course pertama akan menjadi akar seluruh materi pembelajaran."
          />
        ) : (
          <Grid cols={1} smCols={2} lgCols={3} gap="md">
            {(courses.data ?? []).map((course) => (
              <AppCard key={course.id} interactive>
                <Stack gap="sm">
                  <div className="flex items-start justify-between gap-sm">
                    <Link
                      to="/learning/courses/$courseId"
                      params={{ courseId: course.id }}
                      className="min-w-0 text-title text-text-primary hover:underline"
                    >
                      {course.title}
                    </Link>
                    <ContentStatusBadge status={course.status} />
                  </div>
                  <p className="text-body-sm text-text-secondary">
                    {course.summary ?? "Tanpa ringkasan."}
                  </p>
                  <p className="text-caption text-text-secondary">
                    {course.moduleCount} module · {course.level ?? "Semua level"}
                  </p>
                  {canWrite && (
                    <div className="flex flex-wrap gap-xs">
                      <SelectInput
                        aria-label={`Status ${course.title}`}
                        value={course.status}
                        onChange={(event) =>
                          updateStatus.mutate({
                            courseId: course.id,
                            status: event.target.value as typeof course.status,
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
                        onClick={() => removeCourse.mutate(course.id)}
                        aria-label={`Hapus ${course.title}`}
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
