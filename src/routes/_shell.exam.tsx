import { createFileRoute } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";

import { PlaceholderPage } from "@/shared/components/shell";

export const Route = createFileRoute("/_shell/exam")({
  head: () => ({
    meta: [
      { title: "Exam — Hangeul LPK Platform" },
      {
        name: "description",
        content: "Latihan dan simulasi ujian EPS-TOPIK untuk peserta lembaga pelatihan.",
      },
      { property: "og:title", content: "Exam — Hangeul LPK Platform" },
      {
        property: "og:description",
        content: "Siapkan latihan dan simulasi ujian bahasa Korea secara terstruktur.",
      },
    ],
  }),
  component: ExamPage,
});

function ExamPage() {
  return (
    <PlaceholderPage
      icon={GraduationCap}
      title="Exam"
      description="Latihan dan simulasi ujian EPS-TOPIK akan dikelola dari halaman ini."
      emptyTitle="Belum ada paket ujian"
      emptyDescription="Bank soal, jadwal, dan hasil ujian akan tampil di sini pada sprint asesmen."
    />
  );
}
