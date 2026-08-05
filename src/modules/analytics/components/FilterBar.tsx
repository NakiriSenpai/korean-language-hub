import { useMemo } from "react";
import { Filter, RotateCcw } from "lucide-react";

import { Field, SelectInput, TextInput, ghostButtonClass } from "@/shared/components/form";
import { AppCard, Grid } from "@/shared/components/layout";
import { EMPTY_ANALYTICS_FILTER } from "@/modules/analytics/types";
import type { AnalyticsFilter, AnalyticsFilterOptions } from "@/modules/analytics/types";

export interface FilterBarProps {
  readonly value: AnalyticsFilter;
  readonly options: AnalyticsFilterOptions | undefined;
  readonly onChange: (next: AnalyticsFilter) => void;
  /** Hide dimensions that make no sense on a given dashboard. */
  readonly hide?: readonly ("period" | "group" | "assessment" | "student" | "date")[];
}

function single(values: readonly string[]): string {
  return values[0] ?? "";
}

/** Engine 6 — filter bar. One select per dimension, plus an inclusive date range. */
export function FilterBar({ value, options, onChange, hide = [] }: FilterBarProps) {
  const hidden = useMemo(() => new Set(hide), [hide]);

  const groups = useMemo(() => {
    const all = options?.studyGroups ?? [];
    if (value.periodIds.length === 0) return all;
    return all.filter((group) => value.periodIds.includes(group.periodId));
  }, [options, value.periodIds]);

  const set = (patch: Partial<AnalyticsFilter>) => onChange({ ...value, ...patch });
  const toList = (id: string): readonly string[] => (id ? [id] : []);

  return (
    <AppCard>
      <div className="flex min-w-0 items-center justify-between gap-md">
        <h3 className="inline-flex items-center gap-xs text-title text-text-primary">
          <Filter className="size-4 text-text-secondary" aria-hidden="true" />
          Filter laporan
        </h3>
        <button
          type="button"
          className={ghostButtonClass}
          onClick={() => onChange(EMPTY_ANALYTICS_FILTER)}
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          Reset
        </button>
      </div>

      <Grid cols={1} smCols={2} lgCols={3} gap="md" className="mt-md">
        {!hidden.has("period") && (
          <Field label="Gelombang / periode" htmlFor="filter-period">
            <SelectInput
              id="filter-period"
              value={single(value.periodIds)}
              onChange={(event) =>
                set({ periodIds: toList(event.target.value), studyGroupIds: [] })
              }
            >
              <option value="">Semua gelombang</option>
              {options?.periods.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.label}
                </option>
              ))}
            </SelectInput>
          </Field>
        )}

        {!hidden.has("group") && (
          <Field label="Kelas" htmlFor="filter-group">
            <SelectInput
              id="filter-group"
              value={single(value.studyGroupIds)}
              onChange={(event) => set({ studyGroupIds: toList(event.target.value) })}
            >
              <option value="">Semua kelas</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.label}
                </option>
              ))}
            </SelectInput>
          </Field>
        )}

        {!hidden.has("assessment") && (
          <Field label="Asesmen" htmlFor="filter-assessment">
            <SelectInput
              id="filter-assessment"
              value={single(value.assessmentIds)}
              onChange={(event) => set({ assessmentIds: toList(event.target.value) })}
            >
              <option value="">Semua asesmen</option>
              {options?.assessments.map((assessment) => (
                <option key={assessment.id} value={assessment.id}>
                  {assessment.label}
                </option>
              ))}
            </SelectInput>
          </Field>
        )}

        {!hidden.has("student") && (
          <Field label="Peserta" htmlFor="filter-student">
            <SelectInput
              id="filter-student"
              value={single(value.studentUserIds)}
              onChange={(event) => set({ studentUserIds: toList(event.target.value) })}
            >
              <option value="">Semua peserta</option>
              {options?.students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.label}
                </option>
              ))}
            </SelectInput>
          </Field>
        )}

        {!hidden.has("date") && (
          <>
            <Field label="Tanggal mulai" htmlFor="filter-date-from">
              <TextInput
                id="filter-date-from"
                type="date"
                value={value.dateFrom ?? ""}
                onChange={(event) => set({ dateFrom: event.target.value || null })}
              />
            </Field>
            <Field label="Tanggal akhir" htmlFor="filter-date-to">
              <TextInput
                id="filter-date-to"
                type="date"
                value={value.dateTo ?? ""}
                onChange={(event) => set({ dateTo: event.target.value || null })}
              />
            </Field>
          </>
        )}
      </Grid>
    </AppCard>
  );
}
