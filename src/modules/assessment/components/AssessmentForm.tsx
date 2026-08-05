import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { ASSESSMENT_TYPES } from "@/modules/assessment/config/registry";
import type {
  Assessment,
  AssessmentType,
  ContentStatus,
  KnowledgeDifficulty,
} from "@/modules/assessment/types";
import type { AssessmentInput } from "@/modules/assessment/validation/schemas";
import { DIFFICULTY_OPTIONS } from "@/modules/knowledge/config/kinds";
import {
  Field,
  SelectInput,
  TextArea,
  TextInput,
  buttonClass,
} from "@/shared/components/form";
import { AppCard, Grid, Stack } from "@/shared/components/layout";
import { toUserMessage } from "@/shared/platform";

interface FormState {
  title: string;
  slug: string;
  description: string;
  type: AssessmentType;
  status: ContentStatus;
  difficulty: KnowledgeDifficulty;
  durationMinutes: string;
  passingScore: string;
  randomizeQuestions: boolean;
  randomizeChoices: boolean;
}

function initialState(assessment?: Assessment): FormState {
  return {
    title: assessment?.title ?? "",
    slug: assessment?.slug ?? "",
    description: assessment?.description ?? "",
    type: assessment?.type ?? "quiz",
    status: assessment?.status ?? "draft",
    difficulty: assessment?.difficulty ?? "beginner",
    durationMinutes: String(assessment?.durationMinutes ?? 0),
    passingScore: String(assessment?.passingScore ?? 0),
    randomizeQuestions: assessment?.randomizeQuestions ?? false,
    randomizeChoices: assessment?.randomizeChoices ?? false,
  };
}

export interface AssessmentFormProps {
  readonly assessment?: Assessment;
  readonly submitLabel: string;
  readonly pending: boolean;
  readonly successMessage: string;
  readonly onSubmit: (input: AssessmentInput) => Promise<unknown>;
}

/** Assessment Studio form: exam, quiz, practice, or try out (Work Package 5 & 7). */
export function AssessmentForm({
  assessment,
  submitLabel,
  pending,
  successMessage,
  onSubmit,
}: AssessmentFormProps) {
  const [form, setForm] = useState<FormState>(() => initialState(assessment));
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      await onSubmit({
        title: form.title,
        slug: form.slug,
        description: form.description,
        type: form.type,
        status: form.status,
        difficulty: form.difficulty,
        durationMinutes: Number(form.durationMinutes) || 0,
        passingScore: Number(form.passingScore) || 0,
        randomizeQuestions: form.randomizeQuestions,
        randomizeChoices: form.randomizeChoices,
      });
      toast.success(successMessage);
      if (!assessment) setForm(initialState());
    } catch (cause) {
      const message = toUserMessage(cause);
      setError(message);
      toast.error(message);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <AppCard>
        <Stack gap="md">
          <Grid cols={1} smCols={2} lgCols={3} gap="md">
            <Field label="Judul" htmlFor="assessment-title">
              <TextInput
                id="assessment-title"
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                required
              />
            </Field>

            <Field label="Slug" htmlFor="assessment-slug" hint="huruf kecil, angka, tanda minus">
              <TextInput
                id="assessment-slug"
                value={form.slug}
                onChange={(event) => setForm({ ...form, slug: event.target.value })}
                required
              />
            </Field>

            <Field label="Jenis" htmlFor="assessment-type">
              <SelectInput
                id="assessment-type"
                value={form.type}
                onChange={(event) =>
                  setForm({ ...form, type: event.target.value as AssessmentType })
                }
              >
                {ASSESSMENT_TYPES.map((item) => (
                  <option key={item.type} value={item.type}>
                    {item.label}
                  </option>
                ))}
              </SelectInput>
            </Field>

            <Field label="Tingkat" htmlFor="assessment-difficulty">
              <SelectInput
                id="assessment-difficulty"
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

            <Field label="Durasi (menit)" htmlFor="assessment-duration">
              <TextInput
                id="assessment-duration"
                type="number"
                min={0}
                max={600}
                value={form.durationMinutes}
                onChange={(event) => setForm({ ...form, durationMinutes: event.target.value })}
              />
            </Field>

            <Field label="Nilai lulus" htmlFor="assessment-passing">
              <TextInput
                id="assessment-passing"
                type="number"
                min={0}
                max={100}
                value={form.passingScore}
                onChange={(event) => setForm({ ...form, passingScore: event.target.value })}
              />
            </Field>
          </Grid>

          <Field label="Deskripsi" htmlFor="assessment-description">
            <TextArea
              id="assessment-description"
              rows={3}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </Field>

          <fieldset className="flex flex-wrap gap-lg">
            <legend className="text-body-sm text-text-secondary">Pengacakan</legend>
            <label className="inline-flex min-h-11 items-center gap-xs text-body-sm text-text-primary">
              <input
                type="checkbox"
                className="size-4 accent-[var(--color-primary)]"
                checked={form.randomizeQuestions}
                onChange={(event) =>
                  setForm({ ...form, randomizeQuestions: event.target.checked })
                }
              />
              Acak urutan soal
            </label>
            <label className="inline-flex min-h-11 items-center gap-xs text-body-sm text-text-primary">
              <input
                type="checkbox"
                className="size-4 accent-[var(--color-primary)]"
                checked={form.randomizeChoices}
                onChange={(event) => setForm({ ...form, randomizeChoices: event.target.checked })}
              />
              Acak urutan pilihan
            </label>
          </fieldset>

          {error ? (
            <p role="alert" className="text-body-sm text-danger">
              {error}
            </p>
          ) : null}

          <div>
            <button type="submit" className={buttonClass} disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              {submitLabel}
            </button>
          </div>
        </Stack>
      </AppCard>
    </form>
  );
}
