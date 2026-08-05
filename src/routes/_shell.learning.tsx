import { createFileRoute } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";

import { PlaceholderPage } from "@/shared/components/shell";

export const Route = createFileRoute("/_shell/learning")({
  head: () => ({
    meta: [
      { title: "Learning — Hangeul LPK Platform" },
      {
        name: "description",
        content: "Materi dan jalur belajar bahasa Korea untuk peserta lembaga pelatihan.",
      },
      { property: "og:title", content: "Learning — Hangeul LPK Platform" },
      {
        property: "og:description",
        content: "Kelola materi dan jalur belajar bahasa Korea dalam satu tempat.",
      },
    ],
  }),
  component: LearningPage,
});

function LearningPage() {
  return (
    <PlaceholderPage
      icon={BookOpen}
      title="Learning"
      description="Materi dan jalur belajar bahasa Korea akan tersedia di halaman ini."
      emptyTitle="Modul pembelajaran belum aktif"
      emptyDescription="Daftar materi, unit, dan jalur belajar akan tampil di sini pada sprint pembelajaran."
    />
  );
}
