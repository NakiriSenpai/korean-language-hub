import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

import { PlaceholderPage } from "@/shared/components/shell";

export const Route = createFileRoute("/_shell/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Hangeul LPK Platform" },
      {
        name: "description",
        content: "Area administrasi lembaga dan pengelolaan platform Hangeul LPK.",
      },
      { property: "og:title", content: "Admin — Hangeul LPK Platform" },
      {
        property: "og:description",
        content: "Kelola lembaga, kelas, dan konfigurasi platform dari satu area admin.",
      },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  return (
    <PlaceholderPage
      icon={ShieldCheck}
      title="Admin"
      description="Area administrasi lembaga dan pengelolaan platform akan berada di sini."
      emptyTitle="Area admin belum aktif"
      emptyDescription="Pengelolaan lembaga, pengguna, dan konfigurasi platform akan tersedia pada sprint administrasi."
    />
  );
}
