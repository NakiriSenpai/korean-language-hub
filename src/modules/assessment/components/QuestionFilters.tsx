import {
  LANGUAGE_OPTIONS,
  QUESTION_SKILLS,
  QUESTION_TYPES,
} from "@/modules/assessment/config/registry";
import type {
  ContentStatus,
  KnowledgeDifficulty,
  QuestionFilters as Filters,
  QuestionSkill,
  QuestionType,
} from "@/modules/assessment/types";
import { DIFFICULTY_OPTIONS } from "@/modules/knowledge/config/kinds";
import { Field, SelectInput, TextInput } from "@/shared/components/form";
import { AppCard, Grid } from "@/shared/components/layout";

export interface QuestionFiltersProps {
  readonly value: Filters;
  readonly onChange: (next: Filters) => void;
  readonly categories: readonly string[];
  readonly idPrefix: string;
}

/** Question Picker / Question Bank filter bar (Work Package 6). */
export function QuestionFilters({ value, onChange, categories, idPrefix }: QuestionFiltersProps) {
  return (
    <AppCard>
      <Grid cols={1} smCols={2} lgCols={4} gap="md">
        <Field label="Kata kunci" htmlFor={`${idPrefix}-keyword`}>
          <TextInput
            id={`${idPrefix}-keyword`}
            type="search"
            value={value.keyword ?? ""}
            onChange={(event) => onChange({ ...value, keyword: event.target.value })}
            placeholder="Kode soal, kategori, sumber"
          />
        </Field>

        <Field label="Tipe soal" htmlFor={`${idPrefix}-type`}>
          <SelectInput
            id={`${idPrefix}-type`}
            value={value.type ?? ""}
            onChange={(event) =>
              onChange({ ...value, type: event.target.value as QuestionType | "" })
            }
          >
            <option value="">Semua tipe</option>
            {QUESTION_TYPES.map((definition) => (
              <option key={definition.type} value={definition.type}>
                {definition.label}
              </option>
            ))}
          </SelectInput>
        </Field>

        <Field label="Keterampilan" htmlFor={`${idPrefix}-skill`}>
          <SelectInput
            id={`${idPrefix}-skill`}
            value={value.skill ?? ""}
            onChange={(event) =>
              onChange({ ...value, skill: event.target.value as QuestionSkill | "" })
            }
          >
            <option value="">Semua keterampilan</option>
            {QUESTION_SKILLS.map((definition) => (
              <option key={definition.skill} value={definition.skill}>
                {definition.label}
              </option>
            ))}
          </SelectInput>
        </Field>

        <Field label="Tingkat" htmlFor={`${idPrefix}-difficulty`}>
          <SelectInput
            id={`${idPrefix}-difficulty`}
            value={value.difficulty ?? ""}
            onChange={(event) =>
              onChange({ ...value, difficulty: event.target.value as KnowledgeDifficulty | "" })
            }
          >
            <option value="">Semua tingkat</option>
            {DIFFICULTY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectInput>
        </Field>

        <Field label="Kategori" htmlFor={`${idPrefix}-category`}>
          <SelectInput
            id={`${idPrefix}-category`}
            value={value.category ?? ""}
            onChange={(event) => onChange({ ...value, category: event.target.value })}
          >
            <option value="">Semua kategori</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </SelectInput>
        </Field>

        <Field label="Tag" htmlFor={`${idPrefix}-tag`}>
          <TextInput
            id={`${idPrefix}-tag`}
            value={value.tag ?? ""}
            onChange={(event) => onChange({ ...value, tag: event.target.value })}
            placeholder="mis. eps-topik"
          />
        </Field>

        <Field label="Bahasa" htmlFor={`${idPrefix}-language`}>
          <SelectInput
            id={`${idPrefix}-language`}
            value={value.language ?? ""}
            onChange={(event) => onChange({ ...value, language: event.target.value })}
          >
            <option value="">Semua bahasa</option>
            {LANGUAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectInput>
        </Field>

        <Field label="Status" htmlFor={`${idPrefix}-status`}>
          <SelectInput
            id={`${idPrefix}-status`}
            value={value.status ?? ""}
            onChange={(event) =>
              onChange({ ...value, status: event.target.value as ContentStatus | "" })
            }
          >
            <option value="">Semua status</option>
            <option value="draft">Draf</option>
            <option value="published">Terbit</option>
            <option value="archived">Arsip</option>
          </SelectInput>
        </Field>
      </Grid>
    </AppCard>
  );
}
