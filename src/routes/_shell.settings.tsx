import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";

import { PlaceholderPage } from "@/shared/components/shell";

export const Route = createFileRoute("/_shell/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Hangeul LPK Platform" },
      {
        name: "description",
        content: "Preferensi aplikasi dan konfigurasi lembaga pelatihan bahasa Korea.",
      },
      { property: "og:title", content: "Settings — Hangeul LPK Platform" },
      {
        property: "og:description",
        content: "Atur preferensi tampilan dan konfigurasi lembaga.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <PlaceholderPage
      icon={Settings}
      title="Settings"
      description="Preferensi aplikasi dan konfigurasi lembaga akan diatur di halaman ini."
      emptyTitle="Belum ada pengaturan yang bisa diubah"
      emptyDescription="Preferensi bahasa, tampilan, dan identitas lembaga akan tersedia pada sprint konfigurasi."
    />
  );
}
