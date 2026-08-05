import { createFileRoute } from "@tanstack/react-router";
import { LayoutDashboard } from "lucide-react";

import { PlaceholderPage } from "@/shared/components/shell";

export const Route = createFileRoute("/_shell/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Hangeul LPK Platform" },
      {
        name: "description",
        content:
          "Dashboard Hangeul LPK: ringkasan aktivitas belajar, ujian, dan performa peserta lembaga pelatihan bahasa Korea.",
      },
      { property: "og:title", content: "Dashboard — Hangeul LPK Platform" },
      {
        property: "og:description",
        content: "Pusat kendali lembaga pelatihan bahasa Korea dalam satu tampilan.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <PlaceholderPage
      icon={LayoutDashboard}
      title="Dashboard"
      description="Ringkasan aktivitas dan status pembelajaran akan tampil di sini."
      emptyTitle="Belum ada data untuk ditampilkan"
      emptyDescription="Ringkasan peserta, kelas, dan progres akan muncul setelah modul terkait diaktifkan."
    />
  );
}
