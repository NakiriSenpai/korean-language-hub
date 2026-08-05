import { useState, type FormEvent } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { DIFFICULTY_OPTIONS, type KnowledgeKindDefinition } from "@/modules/knowledge/config/kinds";
import { useCreateKnowledgeEntry } from "@/modules/knowledge/hooks/useKnowledge";
import type { KnowledgeDifficulty } from "@/modules/knowledge/types";
import type { KnowledgeEntryInput } from "@/modules/knowledge/validation/schemas";
import { AppCard, AppSection, Grid } from "@/shared/components/layout";
import { Field, SelectInput, TextArea, TextInput, buttonClass } from "@/shared/components/form";
import { toUserMessage } from "@/shared/platform";

interface FormState {
  title: string;
  slug: string;
  description: string;
  difficulty: KnowledgeDifficulty;
  category: string;
  tags: string;
  thumbnailUrl: string;
  coverUrl: string;
  status: "draft" | "published" | "archived";
  body: string;
  extras: Record<string, string>;
}

function initialState(definition: KnowledgeKindDefinition): FormState {
  return {
    title: "",
    slug: "",
    description: "",
    difficulty: "beginner",
    category: "",
    tags: "",
    thumbnailUrl: "",
    coverUrl: "",
    status: "draft",
    body: "",
    extras: Object.fromEntries(definition.extras.map((extra) => [extra.key, ""])),
  };
}

/**
 * Create form for any knowledge entity.
 * The block editor is out of scope this sprint: the body is stored as a single
 * text block using the Sprint 3 block shape so the Universal Reader can render it.
 */
export function KnowledgeEntryForm({ definition }: { definition: KnowledgeKindDefinition }) {
  const create = useCreateKnowledgeEntry(definition.kind);
  const [form, setForm] = useState<FormState>(() => initialState(definition));
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const input: KnowledgeEntryInput = {
      title: form.title,
      slug: form.slug,
      description: form.description,
      difficulty: form.difficulty,
      category: form.category,
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean),
      thumbnailUrl: form.thumbnailUrl,
      coverUrl: form.coverUrl,
      status: form.status,
      blocks: form.body.trim()
        ? [{ id: crypto.randomUUID(), type: "text", position: 0, content: { text: form.body } }]
        : [],
      extras: form.extras,
    };

    try {
      await create.mutateAsync(input);
      setForm(initialState(definition));
      toast.success(`${definition.label} tersimpan.`);
    } catch (cause) {
      setError(toUserMessage(cause));
    }
  };

  return (
    <AppSection title={`Tambah ${definition.label}`} description={definition.description}>
      <AppCard>
        <form onSubmit={onSubmit} className="flex flex-col gap-md" noValidate>
          <Grid cols={1} smCols={2} lgCols={2} gap="md">
            <Field label="Judul" htmlFor="knowledgeTitle">
              <TextInput
                id="knowledgeTitle"
                required
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
              />
            </Field>
            <Field label="Slug" htmlFor="knowledgeSlug" hint="Unik dalam satu lembaga.">
              <TextInput
                id="knowledgeSlug"
                required
                value={form.slug}
                onChange={(event) => setForm({ ...form, slug: event.target.value })}
                placeholder="contoh-slug-materi"
              />
            </Field>
            <Field label="Kategori" htmlFor="knowledgeCategory">
              <TextInput
                id="knowledgeCategory"
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
              />
            </Field>
            <Field label="Tag" htmlFor="knowledgeTags" hint="Pisahkan dengan koma.">
              <TextInput
                id="knowledgeTags"
                value={form.tags}
                onChange={(event) => setForm({ ...form, tags: event.target.value })}
                placeholder="eps-topik, dasar"
              />
            </Field>
            <Field label="Tingkat" htmlFor="knowledgeDifficulty">
              <SelectInput
                id="knowledgeDifficulty"
                value={form.difficulty}
                onChange={(event) =>
                  setForm({ ...form, difficulty: event.target.value as KnowledgeDifficulty })
                }
              >
                {DIFFICULTY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Status" htmlFor="knowledgeStatus">
              <SelectInput
                id="knowledgeStatus"
                value={form.status}
                onChange={(event) =>
                  setForm({ ...form, status: event.target.value as FormState["status"] })
                }
              >
                <option value="draft">Draf</option>
                <option value="published">Terbit</option>
                <option value="archived">Arsip</option>
              </SelectInput>
            </Field>
            <Field label="Thumbnail (URL)" htmlFor="knowledgeThumbnail">
              <TextInput
                id="knowledgeThumbnail"
                value={form.thumbnailUrl}
                onChange={(event) => setForm({ ...form, thumbnailUrl: event.target.value })}
              />
            </Field>
            <Field label="Cover (URL)" htmlFor="knowledgeCover">
              <TextInput
                id="knowledgeCover"
                value={form.coverUrl}
                onChange={(event) => setForm({ ...form, coverUrl: event.target.value })}
              />
            </Field>

            {definition.extras.map((extra) => (
              <Field key={extra.key} label={extra.label} htmlFor={`knowledge-${extra.key}`}>
                <TextInput
                  id={`knowledge-${extra.key}`}
                  type={extra.type === "number" ? "number" : "text"}
                  value={form.extras[extra.key] ?? ""}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      extras: { ...form.extras, [extra.key]: event.target.value },
                    })
                  }
                />
              </Field>
            ))}
          </Grid>

          <Field label="Deskripsi" htmlFor="knowledgeDescription">
            <TextInput
              id="knowledgeDescription"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </Field>

          <Field
            label="Isi materi"
            htmlFor="knowledgeBody"
            hint="Disimpan sebagai blok teks dan dibaca melalui Universal Reader."
          >
            <TextArea
              id="knowledgeBody"
              value={form.body}
              onChange={(event) => setForm({ ...form, body: event.target.value })}
            />
          </Field>

          {error && (
            <p role="alert" className="text-caption text-destructive">
              {error}
            </p>
          )}

          <div>
            <button type="submit" className={buttonClass} disabled={create.isPending}>
              {create.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Plus className="size-4" aria-hidden="true" />
              )}
              Simpan {definition.label}
            </button>
          </div>
        </form>
      </AppCard>
    </AppSection>
  );
}
