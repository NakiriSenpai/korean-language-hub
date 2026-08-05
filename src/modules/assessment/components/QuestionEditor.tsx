import { useMemo, useState, type FormEvent } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { getQuestionType, LANGUAGE_OPTIONS, QUESTION_SKILLS, QUESTION_TYPES } from "@/modules/assessment/config/registry";
import type {
  ContentStatus,
  KnowledgeDifficulty,
  QuestionSkill,
  QuestionType,
  QuestionVersion,
} from "@/modules/assessment/types";
import type { QuestionChoiceInput, QuestionInput } from "@/modules/assessment/validation/schemas";
import { DIFFICULTY_OPTIONS } from "@/modules/knowledge/config/kinds";
import {
  Field,
  SelectInput,
  TextArea,
  TextInput,
  buttonClass,
  ghostButtonClass,
} from "@/shared/components/form";
import { AppCard, AppSection, Grid, Stack } from "@/shared/components/layout";
import { toUserMessage } from "@/shared/platform";

interface ChoiceState {
  readonly key: string;
  label: string;
  content: string;
  isCorrect: boolean;
}

interface FormState {
  publicId: string;
  type: QuestionType;
  skill: QuestionSkill;
  difficulty: KnowledgeDifficulty;
  status: ContentStatus;
  prompt: string;
  passage: string;
  audioUrl: string;
  explanation: string;
  answerKey: string;
  category: string;
  tags: string;
  source: string;
  language: string;
  choices: ChoiceState[];
}

let choiceSeed = 0;
function newChoice(content = "", isCorrect = false, label = ""): ChoiceState {
  choiceSeed += 1;
  return { key: `choice-${choiceSeed}`, content, isCorrect, label };
}

function emptyState(): FormState {
  return {
    publicId: "",
    type: "multiple_choice",
    skill: "reading",
    difficulty: "beginner",
    status: "draft",
    prompt: "",
    passage: "",
    audioUrl: "",
    explanation: "",
    answerKey: "",
    category: "",
    tags: "",
    source: "",
    language: "ko",
    choices: [newChoice(), newChoice(), newChoice(), newChoice()],
  };
}

function fromVersion(version: QuestionVersion, publicId: string, status: ContentStatus): FormState {
  return {
    publicId,
    type: version.type,
    skill: version.skill,
    difficulty: version.difficulty,
    status,
    prompt: version.prompt,
    passage: version.passage ?? "",
    audioUrl: version.audioUrl ?? "",
    explanation: version.explanation ?? "",
    answerKey: version.answerKey ?? "",
    category: version.category ?? "",
    tags: version.tags.join(", "),
    source: version.source ?? "",
    language: version.language,
    choices:
      version.choices.length > 0
        ? version.choices.map((choice) =>
            newChoice(choice.content, choice.isCorrect, choice.label ?? ""),
          )
        : [newChoice(), newChoice()],
  };
}

export interface QuestionEditorProps {
  /** Existing version to edit; omitted when authoring a new question. */
  readonly version?: QuestionVersion;
  readonly publicId?: string;
  readonly status?: ContentStatus;
  readonly submitLabel: string;
  readonly pending: boolean;
  readonly onSubmit: (input: QuestionInput) => Promise<unknown>;
  readonly successMessage: string;
}

/**
 * Question Studio editor (Work Package 1).
 * Saving an existing question never overwrites content — the service writes a
 * new immutable version and repoints the bank entry.
 */
export function QuestionEditor({
  version,
  publicId,
  status,
  submitLabel,
  pending,
  onSubmit,
  successMessage,
}: QuestionEditorProps) {
  const [form, setForm] = useState<FormState>(() =>
    version ? fromVersion(version, publicId ?? "", status ?? "draft") : emptyState(),
  );
  const [error, setError] = useState<string | null>(null);

  const definition = useMemo(() => getQuestionType(form.type), [form.type]);
  const fixed = definition.fixedChoices;

  const setChoice = (key: string, patch: Partial<ChoiceState>) => {
    setForm((current) => ({
      ...current,
      choices: current.choices.map((choice) =>
        choice.key === key
          ? { ...choice, ...patch }
          : patch.isCorrect && definition.singleAnswer
            ? { ...choice, isCorrect: false }
            : choice,
      ),
    }));
  };

  const handleType = (type: QuestionType) => {
    const next = getQuestionType(type);
    setForm((current) => ({
      ...current,
      type,
      choices: next.fixedChoices
        ? next.fixedChoices.map((content) => newChoice(content))
        : current.choices.length >= 2
          ? current.choices
          : [newChoice(), newChoice()],
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const input: QuestionInput = {
      publicId: form.publicId,
      type: form.type,
      skill: form.skill,
      difficulty: form.difficulty,
      status: form.status,
      prompt: form.prompt,
      passage: form.passage,
      audioUrl: form.audioUrl,
      explanation: form.explanation,
      answerKey: form.answerKey,
      category: form.category,
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      source: form.source,
      language: form.language,
      choices: definition.hasChoices
        ? form.choices
            .filter((choice) => choice.content.trim().length > 0)
            .map(
              (choice, index): QuestionChoiceInput => ({
                label: choice.label,
                content: choice.content,
                isCorrect: choice.isCorrect,
                position: index,
              }),
            )
        : [],
    };

    try {
      await onSubmit(input);
      toast.success(successMessage);
      if (!version) setForm(emptyState());
    } catch (cause) {
      const message = toUserMessage(cause);
      setError(message);
      toast.error(message);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Stack gap="lg">
        <AppSection title="Metadata soal" description="Identitas dan klasifikasi untuk Question Bank.">
          <AppCard>
            <Grid cols={1} smCols={2} lgCols={3} gap="md">
              <Field label="Kode soal" htmlFor="question-public-id" hint="Kosongkan untuk otomatis">
                <TextInput
                  id="question-public-id"
                  value={form.publicId}
                  onChange={(event) => setForm({ ...form, publicId: event.target.value })}
                  placeholder="QS-1A2B3C"
                />
              </Field>

              <Field label="Tipe soal" htmlFor="question-type">
                <SelectInput
                  id="question-type"
                  value={form.type}
                  onChange={(event) => handleType(event.target.value as QuestionType)}
                >
                  {QUESTION_TYPES.map((item) => (
                    <option key={item.type} value={item.type}>
                      {item.label}
                    </option>
                  ))}
                </SelectInput>
              </Field>

              <Field label="Keterampilan" htmlFor="question-skill">
                <SelectInput
                  id="question-skill"
                  value={form.skill}
                  onChange={(event) =>
                    setForm({ ...form, skill: event.target.value as QuestionSkill })
                  }
                >
                  {QUESTION_SKILLS.map((item) => (
                    <option key={item.skill} value={item.skill}>
                      {item.label}
                    </option>
                  ))}
                </SelectInput>
              </Field>

              <Field label="Tingkat" htmlFor="question-difficulty">
                <SelectInput
                  id="question-difficulty"
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

              <Field label="Status" htmlFor="question-status">
                <SelectInput
                  id="question-status"
                  value={form.status}
                  onChange={(event) =>
                    setForm({ ...form, status: event.target.value as ContentStatus })
                  }
                >
                  <option value="draft">Draf</option>
                  <option value="published">Terbit</option>
                  <option value="archived">Arsip</option>
                </SelectInput>
              </Field>

              <Field label="Bahasa" htmlFor="question-language">
                <SelectInput
                  id="question-language"
                  value={form.language}
                  onChange={(event) => setForm({ ...form, language: event.target.value })}
                >
                  {LANGUAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </SelectInput>
              </Field>

              <Field label="Kategori" htmlFor="question-category">
                <TextInput
                  id="question-category"
                  value={form.category}
                  onChange={(event) => setForm({ ...form, category: event.target.value })}
                  placeholder="mis. Tata Bahasa"
                />
              </Field>

              <Field label="Tag" htmlFor="question-tags" hint="Pisahkan dengan koma">
                <TextInput
                  id="question-tags"
                  value={form.tags}
                  onChange={(event) => setForm({ ...form, tags: event.target.value })}
                  placeholder="eps-topik, bab-1"
                />
              </Field>

              <Field label="Sumber" htmlFor="question-source">
                <TextInput
                  id="question-source"
                  value={form.source}
                  onChange={(event) => setForm({ ...form, source: event.target.value })}
                  placeholder="mis. EPS-TOPIK 2023"
                />
              </Field>
            </Grid>
          </AppCard>
        </AppSection>

        <AppSection
          title="Konten soal"
          description={
            form.skill === "listening"
              ? "Soal listening wajib memiliki tautan audio."
              : "Soal reading wajib memiliki bacaan atau pertanyaan yang lengkap."
          }
        >
          <AppCard>
            <Stack gap="md">
              <Field label="Pertanyaan" htmlFor="question-prompt">
                <TextArea
                  id="question-prompt"
                  rows={3}
                  value={form.prompt}
                  onChange={(event) => setForm({ ...form, prompt: event.target.value })}
                  required
                />
              </Field>

              {form.skill === "listening" ? (
                <Field label="URL audio" htmlFor="question-audio">
                  <TextInput
                    id="question-audio"
                    type="url"
                    value={form.audioUrl}
                    onChange={(event) => setForm({ ...form, audioUrl: event.target.value })}
                    placeholder="https://…"
                  />
                </Field>
              ) : (
                <Field label="Bacaan" htmlFor="question-passage">
                  <TextArea
                    id="question-passage"
                    rows={5}
                    value={form.passage}
                    onChange={(event) => setForm({ ...form, passage: event.target.value })}
                  />
                </Field>
              )}

              <Field label="Pembahasan" htmlFor="question-explanation">
                <TextArea
                  id="question-explanation"
                  rows={3}
                  value={form.explanation}
                  onChange={(event) => setForm({ ...form, explanation: event.target.value })}
                />
              </Field>

              {definition.hasChoices ? null : (
                <Field label="Kunci jawaban" htmlFor="question-answer-key">
                  <TextInput
                    id="question-answer-key"
                    value={form.answerKey}
                    onChange={(event) => setForm({ ...form, answerKey: event.target.value })}
                  />
                </Field>
              )}
            </Stack>
          </AppCard>
        </AppSection>

        {definition.hasChoices ? (
          <AppSection
            title="Pilihan jawaban"
            description={
              definition.singleAnswer
                ? "Tandai tepat satu jawaban benar."
                : "Tandai minimal satu jawaban benar."
            }
          >
            <AppCard>
              <Stack gap="md">
                {form.choices.map((choice, index) => (
                  <div
                    key={choice.key}
                    className="flex flex-col gap-sm rounded-md border border-border p-md sm:flex-row sm:items-center"
                  >
                    <label className="inline-flex min-h-11 items-center gap-xs text-body-sm text-text-secondary">
                      <input
                        type={definition.singleAnswer ? "radio" : "checkbox"}
                        name="question-correct"
                        className="size-4 accent-[var(--color-primary)]"
                        checked={choice.isCorrect}
                        onChange={(event) =>
                          setChoice(choice.key, { isCorrect: event.target.checked })
                        }
                      />
                      Benar
                    </label>

                    <TextInput
                      aria-label={`Isi pilihan ${index + 1}`}
                      value={choice.content}
                      readOnly={Boolean(fixed)}
                      onChange={(event) => setChoice(choice.key, { content: event.target.value })}
                      placeholder={`Pilihan ${index + 1}`}
                    />

                    {fixed ? null : (
                      <button
                        type="button"
                        className={ghostButtonClass}
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            choices: current.choices.filter((item) => item.key !== choice.key),
                          }))
                        }
                        aria-label={`Hapus pilihan ${index + 1}`}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                ))}

                {fixed ? null : (
                  <button
                    type="button"
                    className={ghostButtonClass}
                    onClick={() =>
                      setForm((current) => ({ ...current, choices: [...current.choices, newChoice()] }))
                    }
                  >
                    <Plus className="size-4" aria-hidden="true" />
                    Tambah pilihan
                  </button>
                )}
              </Stack>
            </AppCard>
          </AppSection>
        ) : null}

        {error ? (
          <p role="alert" className="text-body-sm text-danger">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-sm">
          <button type="submit" className={buttonClass} disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            {submitLabel}
          </button>
          {version ? (
            <p className="text-caption text-text-secondary">
              Menyimpan membuat versi baru (v{version.version + 1}); versi lama tetap dipakai asesmen
              yang sudah menautkannya.
            </p>
          ) : null}
        </div>
      </Stack>
    </form>
  );
}
