/**
 * Engine 5 — Export Engine.
 *
 * One registry, three renderers (CSV, Excel, PDF). Heavy renderers are loaded
 * on demand so the analytics bundle stays small.
 */

import { AppError } from "@/shared/platform";
import type {
  ExportCell,
  ExportFormat,
  ExportRequest,
  ExportTable,
} from "@/modules/analytics/types";

type Renderer = (request: ExportRequest) => Promise<void>;

function toText(value: ExportCell): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "Ya" : "Tidak";
  return String(value);
}

function download(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function escapeCsv(value: string): string {
  return /[",\n;]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

function tableToCsv(table: ExportTable): string {
  const header = table.columns.map((column) => escapeCsv(column.label)).join(",");
  const rows = table.rows.map((row) =>
    table.columns.map((column) => escapeCsv(toText(row[column.key] ?? null))).join(","),
  );
  return [table.title, header, ...rows].join("\n");
}

const renderCsv: Renderer = async (request) => {
  const body = [
    request.heading,
    ...(request.subtitle ? [request.subtitle] : []),
    "",
    ...request.tables.map(tableToCsv),
  ].join("\n\n");
  download(
    new Blob([`\uFEFF${body}`], { type: "text/csv;charset=utf-8" }),
    `${request.fileName}.csv`,
  );
};

const renderXlsx: Renderer = async (request) => {
  const { default: writeXlsxFile } = await import("write-excel-file/browser");

  const sheets = request.tables.map((table, index) => ({
    sheet: (table.title.slice(0, 28) || `Sheet ${index + 1}`).replaceAll(/[[\]:*?/\\]/g, " "),
    columns: table.columns.map((column) => ({ width: column.width ?? 22 })),
    data: [
      table.columns.map((column) => ({ value: column.label, fontWeight: "bold" as const })),
      ...table.rows.map((row) =>
        table.columns.map((column) => {
          const raw = row[column.key] ?? null;
          return typeof raw === "number"
            ? { value: raw, type: Number }
            : { value: toText(raw), type: String };
        }),
      ),
    ],
  }));

  await writeXlsxFile(sheets as never, {
    fontFamily: "Arial",
    fontSize: 11,
  }).toFile(`${request.fileName}.xlsx`);
};

const renderPdf: Renderer = async (request) => {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  doc.setFontSize(14);
  doc.text(request.heading, 40, 40);
  if (request.subtitle) {
    doc.setFontSize(9);
    doc.text(request.subtitle, 40, 56);
  }

  let cursor = request.subtitle ? 74 : 60;
  for (const table of request.tables) {
    doc.setFontSize(11);
    doc.text(table.title, 40, cursor);
    autoTable(doc, {
      startY: cursor + 8,
      head: [table.columns.map((column) => column.label)],
      body: table.rows.map((row) => table.columns.map((column) => toText(row[column.key] ?? null))),
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [37, 78, 148] },
      margin: { left: 40, right: 40 },
    });
    const state = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable;
    cursor = (state?.finalY ?? cursor) + 32;
    if (cursor > 500) {
      doc.addPage();
      cursor = 50;
    }
  }

  doc.save(`${request.fileName}.pdf`);
};

const RENDERERS: Record<ExportFormat, Renderer> = {
  csv: renderCsv,
  xlsx: renderXlsx,
  pdf: renderPdf,
};

export const EXPORT_FORMATS: readonly { readonly id: ExportFormat; readonly label: string }[] = [
  { id: "xlsx", label: "Excel (.xlsx)" },
  { id: "pdf", label: "PDF (.pdf)" },
  { id: "csv", label: "CSV (.csv)" },
];

export async function exportAnalytics(format: ExportFormat, request: ExportRequest): Promise<void> {
  const renderer = RENDERERS[format];
  if (!renderer) {
    throw new AppError("Format ekspor tidak dikenal.", { kind: "validation" });
  }
  if (request.tables.every((table) => table.rows.length === 0)) {
    throw new AppError("Tidak ada data untuk diekspor pada filter ini.", { kind: "validation" });
  }
  await renderer(request);
}

/** File-name safe slug with a timestamp so repeated exports never collide. */
export function exportFileName(prefix: string): string {
  const stamp = new Date().toISOString().slice(0, 16).replaceAll(/[:T]/g, "-");
  return `${prefix.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}-${stamp}`;
}
