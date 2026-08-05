import { createFileRoute, useRouter } from "@tanstack/react-router";
import { WifiOff, RotateCcw } from "lucide-react";

import { cn } from "@/lib/utils";
import { usePwa } from "@/shared/pwa";

export const Route = createFileRoute("/offline")({
  head: () => ({
    meta: [
      { title: "Offline — Hangeul LPK Platform" },
      {
        name: "description",
        content: "Koneksi internet terputus. Aplikasi berjalan dalam mode offline terbatas.",
      },
      { property: "og:title", content: "Offline — Hangeul LPK Platform" },
      {
        property: "og:description",
        content: "Halaman ini tampil saat perangkat kehilangan koneksi internet.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OfflineRoute,
});

function OfflineRoute() {
  const router = useRouter();
  const { online } = usePwa();

  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-background px-md">
      <div className="flex max-w-[46ch] flex-col items-center gap-md text-center">
        <span
          aria-hidden="true"
          className="grid size-14 place-items-center rounded-full bg-muted text-text-secondary"
        >
          <WifiOff className="size-7" />
        </span>
        <h1 className="text-h2 text-text-primary">Anda sedang offline</h1>
        <p className="text-body-sm text-text-secondary">
          {online
            ? "Koneksi sudah kembali. Silakan muat ulang halaman."
            : "Koneksi internet terputus sehingga halaman tidak dapat dimuat. Periksa jaringan Anda, lalu coba lagi."}
        </p>
        <button
          type="button"
          onClick={() => router.invalidate()}
          className={cn(
            "inline-flex min-h-11 items-center justify-center gap-sm rounded-md bg-primary px-lg",
            "text-body-sm text-primary-foreground transition-all motion-fast",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          Coba lagi
        </button>
      </div>
    </div>
  );
}
