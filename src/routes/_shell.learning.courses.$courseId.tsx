import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Layers, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { usePermissions } from "@/modules/identity";
import {
  ContentStatusBadge,
  LEARNING_PERMISSIONS,
  useCourse,
  useCreateModule,
  useDeleteModule,
  useModules,
  useUpdateModuleStatus,
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

export const Route = createFileRoute("/_shell/learning/courses/$courseId")({
  head: () => ({
    meta: [
      { title: "Module — Learning | Hangeul LPK Platform" },
      {
        name: "description",
        content: "Module di dalam sebuah course, sebagai pengelompokan lesson pembelajaran.",
      },
      { property: "og:title", content: "Module — Learning" },
      {
        property: "og:description",
        content: "Kelompokkan lesson ke dalam module agar alur belajar tetap terstruktur.",
      },
    ],
  }),
  component: ModulesPage,
});

function ModulesPage() {
  const { courseId } = Route.useParams();
  const { can } = usePermissions();
  const canWrite = can(LEARNING_PERMISSIONS.write);
  const course = useCourse(courseId);
  const modules = useModules(courseId);
  const createModule = useCreateModule();
  const updateStatus = useUpdateModuleStatus();
  const removeModule = useDeleteModule();

  const [form, setForm] = useState({ title: "", summary: "", status: "draft" as const });
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      await createModule.mutateAsync({ ...form, courseId });
      setForm({ title: "", summary: "", status: "draft" });
      toast.success("Module dibuat.");
    } catch (cause) {
      setError(toUserMessage(cause));
    }
  };

  return (
    <Stack gap="xl">
      <AppSection
        title={course.data?.title ?? "Course"}
        description={course.data?.summary ?? "Module yang tersedia pada course ini."}
        actions={
          <Link to="/learning" className={ghostButtonClass}>
            Kembali ke course
          </Link>
        }
      >
        {canWrite && (
          <AppCard>
            <form onSubmit={onSubmit} className="flex flex-col gap-md" noValidate>
              <Grid cols={1} smCols={2} lgCols={2} gap="md">
                <Field label="Judul module" htmlFor="moduleTitle">
                  <TextInput
                    id="moduleTitle"
                    required
                    value={form.title}
                    onChange={(event) => setForm({ ...form, title: event.target.value })}
                    placeholder="Hangeul dan Pelafalan"
                  />
                </Field>
                <Field label="Status" htmlFor="moduleStatus">
                  <SelectInput
                    id="moduleStatus"
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
              <Field label="Ringkasan" htmlFor="moduleSummary">
                <TextInput
                  id="moduleSummary"
                  value={form.summary}
                  onChange={(event) => setForm({ ...form, summary: event.target.value })}
                  placeholder="Pengenalan huruf Korea"
                />
              </Field>
              {error && (
                <p role="alert" className="text-caption text-destructive">
                  {error}
                </p>
              )}
              <div>
                <button type="submit" className={buttonClass} disabled={createModule.isPending}>
                  {createModule.isPending ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Plus className="size-4" aria-hidden="true" />
                  )}
                  Simpan module
                </button>
              </div>
            </form>
          </AppCard>
        )}
      </AppSection>

      <AppSection title="Daftar module">
        {modules.isLoading ? (
          <p className="text-body-sm text-text-secondary">Memuat module…</p>
        ) : (modules.data ?? []).length === 0 ? (
          <EmptyState
            icon={Layers}
            title="Belum ada module"
            description="Tambahkan module untuk mulai menyusun lesson pada course ini."
          />
        ) : (
          <Grid cols={1} smCols={2} lgCols={3} gap="md">
            {(modules.data ?? []).map((item) => (
              <AppCard key={item.id} interactive>
                <Stack gap="sm">
                  <div className="flex items-start justify-between gap-sm">
                    <Link
                      to="/learning/modules/$moduleId"
                      params={{ moduleId: item.id }}
                      className="min-w-0 text-title text-text-primary hover:underline"
                    >
                      {item.title}
                    </Link>
                    <ContentStatusBadge status={item.status} />
                  </div>
                  <p className="text-body-sm text-text-secondary">
                    {item.summary ?? "Tanpa ringkasan."}
                  </p>
                  <p className="text-caption text-text-secondary">{item.lessonCount} lesson</p>
                  {canWrite && (
                    <div className="flex flex-wrap gap-xs">
                      <SelectInput
                        aria-label={`Status ${item.title}`}
                        value={item.status}
                        onChange={(event) =>
                          updateStatus.mutate({
                            moduleId: item.id,
                            status: event.target.value as typeof item.status,
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
                        onClick={() => removeModule.mutate(item.id)}
                        aria-label={`Hapus ${item.title}`}
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
