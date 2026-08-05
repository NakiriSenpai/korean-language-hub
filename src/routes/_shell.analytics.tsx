import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";

import { PlaceholderPage } from "@/shared/components/shell";

export const Route = createFileRoute("/_shell/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Hangeul LPK Platform" },
      {
        name: "description",
        content: "Laporan performa peserta dan kelas untuk lembaga pelatihan bahasa Korea.",
      },
      { property: "og:title", content: "Analytics — Hangeul LPK Platform" },
      {
        property: "og:description",
        content: "Pantau performa peserta dan kelas melalui laporan terpusat.",
      },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  return (
    <PlaceholderPage
      icon={BarChart3}
      title="Analytics"
      description="Laporan performa peserta dan kelas akan ditampilkan di halaman ini."
      emptyTitle="Belum ada laporan"
      emptyDescription="Grafik capaian, kehadiran, dan tren nilai akan tampil setelah data pembelajaran tersedia."
    />
  );
}
