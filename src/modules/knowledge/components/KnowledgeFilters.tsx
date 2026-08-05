import { Search } from "lucide-react";

import { DIFFICULTY_OPTIONS } from "@/modules/knowledge/config/kinds";
import type { KnowledgeDifficulty, KnowledgeSearchFilters } from "@/modules/knowledge/types";
import { AppCard, Grid } from "@/shared/components/layout";
import { Field, SelectInput, TextInput } from "@/shared/components/form";

export interface KnowledgeFiltersProps {
  readonly value: KnowledgeSearchFilters;
  readonly onChange: (next: KnowledgeSearchFilters) => void;
  readonly categories: readonly string[];
  readonly idPrefix: string;
}

/** Keyword, category, difficulty, and tag filters shared by list and search pages. */
export function KnowledgeFilters({ value, onChange, categories, idPrefix }: KnowledgeFiltersProps) {
  return (
    <AppCard>
      <Grid cols={1} smCols={2} lgCols={4} gap="md">
        <Field label="Kata kunci" htmlFor={`${idPrefix}-keyword`}>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-sm top-1/2 size-4 -translate-y-1/2 text-text-secondary"
              aria-hidden="true"
            />
            <TextInput
              id={`${idPrefix}-keyword`}
              type="search"
              className="pl-2xl"
              value={value.keyword ?? ""}
              onChange={(event) => onChange({ ...value, keyword: event.target.value })}
              placeholder="Cari judul atau deskripsi"
            />
          </div>
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

        <Field label="Tingkat" htmlFor={`${idPrefix}-difficulty`}>
          <SelectInput
            id={`${idPrefix}-difficulty`}
            value={value.difficulty ?? ""}
            onChange={(event) =>
              onChange({
                ...value,
                difficulty: event.target.value as KnowledgeDifficulty | "",
              })
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

        <Field label="Tag" htmlFor={`${idPrefix}-tag`}>
          <TextInput
            id={`${idPrefix}-tag`}
            value={value.tag ?? ""}
            onChange={(event) => onChange({ ...value, tag: event.target.value })}
            placeholder="mis. eps-topik"
          />
        </Field>
      </Grid>
    </AppCard>
  );
}
