import { Link } from "@tanstack/react-router";
import { FileQuestion, RotateCcw, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

const actionClass = cn(
  "inline-flex min-h-11 items-center justify-center rounded-md px-lg text-body-sm",
  "transition-all motion-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
);

export function NotFoundPage() {
  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-background px-md">
      <div className="flex max-w-[46ch] flex-col items-center gap-md text-center">
        <span
          aria-hidden="true"
          className="grid size-14 place-items-center rounded-full bg-muted text-text-secondary"
        >
          <FileQuestion className="size-7" />
        </span>
        <p className="text-caption uppercase tracking-widest text-text-secondary">Error 404</p>
        <h1 className="text-h1 text-text-primary">Halaman tidak ditemukan</h1>
        <p className="text-body-sm text-text-secondary">
          Alamat yang kamu buka tidak tersedia atau sudah dipindahkan.
        </p>
        <Link to="/" className={cn(actionClass, "bg-primary text-primary-foreground")}>
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
}

export interface ErrorPageProps {
  readonly message?: string;
  readonly onRetry?: () => void;
}

export function ErrorPage({ message, onRetry }: ErrorPageProps) {
  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-background px-md">
      <div className="flex max-w-[46ch] flex-col items-center gap-md text-center">
        <span
          aria-hidden="true"
          className="grid size-14 place-items-center rounded-full bg-error/10 text-error"
        >
          <TriangleAlert className="size-7" />
        </span>
        <h1 className="text-h2 text-text-primary">Terjadi kesalahan</h1>
        <p className="text-body-sm text-text-secondary">
          {message ?? "Halaman gagal dimuat. Silakan coba lagi."}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-sm">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className={cn(actionClass, "gap-sm bg-primary text-primary-foreground")}
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Coba lagi
            </button>
          )}
          <a
            href="/"
            className={cn(actionClass, "border border-border bg-surface text-text-primary")}
          >
            Kembali ke Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
