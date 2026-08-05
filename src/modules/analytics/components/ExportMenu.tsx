import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { ghostButtonClass } from "@/shared/components/form";
import { toUserMessage } from "@/shared/platform";
import { EXPORT_FORMATS, exportAnalytics } from "@/modules/analytics/services/export.service";
import type { ExportFormat, ExportRequest } from "@/modules/analytics/types";

export interface ExportMenuProps {
  readonly build: () => ExportRequest;
  readonly disabled?: boolean;
}

/** Engine 5 surface: the same filtered dataset in Excel, PDF, or CSV. */
export function ExportMenu({ build, disabled }: ExportMenuProps) {
  const [busy, setBusy] = useState<ExportFormat | null>(null);

  const run = async (format: ExportFormat) => {
    setBusy(format);
    try {
      await exportAnalytics(format, build());
      toast.success(`Laporan ${format.toUpperCase()} berhasil dibuat.`);
    } catch (error) {
      toast.error(toUserMessage(error));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-xs">
      <span className="inline-flex items-center gap-xs text-caption text-text-secondary">
        <Download className="size-4" aria-hidden="true" />
        Ekspor
      </span>
      {EXPORT_FORMATS.map((format) => (
        <button
          key={format.id}
          type="button"
          className={ghostButtonClass}
          disabled={disabled || busy !== null}
          onClick={() => void run(format.id)}
        >
          {busy === format.id && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          {format.label}
        </button>
      ))}
    </div>
  );
}
