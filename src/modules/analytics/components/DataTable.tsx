import { AppCard } from "@/shared/components/layout";
import type { ExportCell, ExportColumn } from "@/modules/analytics/types";

export interface DataTableProps {
  readonly title: string;
  readonly columns: readonly ExportColumn[];
  readonly rows: readonly Record<string, ExportCell>[];
  readonly emptyLabel?: string;
}

function render(value: ExportCell): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Ya" : "Tidak";
  return String(value);
}

/** Scrollable analytics table sharing its column contract with the Export Engine. */
export function DataTable({ title, columns, rows, emptyLabel }: DataTableProps) {
  return (
    <AppCard padding="none">
      <div className="border-b border-border px-md py-sm">
        <h3 className="text-title text-text-primary">{title}</h3>
      </div>
      {rows.length === 0 ? (
        <p className="px-md py-lg text-body-sm text-text-secondary">
          {emptyLabel ?? "Belum ada data pada filter ini."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-max border-collapse text-body-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className="whitespace-nowrap px-md py-sm font-medium text-text-secondary"
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index} className="border-b border-border/60 last:border-b-0">
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="whitespace-nowrap px-md py-sm text-text-primary"
                    >
                      {render(row[column.key] ?? null)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppCard>
  );
}
