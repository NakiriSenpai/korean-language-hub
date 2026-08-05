import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";

import { LessonReader, useLessonContext } from "@/modules/learning";
import { AppCard, Stack } from "@/shared/components/layout";
import { EmptyState } from "@/shared/components/shell";
import { ghostButtonClass } from "@/shared/components/form";

export const Route = createFileRoute("/_shell/learning/lessons/$lessonId")({
  head: () => ({
    meta: [
      { title: "Reader — Learning | Hangeul LPK Platform" },
      {
        name: "description",
        content:
          "Baca lesson per unit dengan progress otomatis, bookmark, dan navigasi antar lesson.",
      },
      { property: "og:title", content: "Reader — Learning" },
      {
        property: "og:description",
        content: "Reader block-based dengan progress dan bookmark tersimpan.",
      },
    ],
  }),
  component: ReaderPage,
});

function ReaderPage() {
  const { lessonId } = Route.useParams();
  const context = useLessonContext(lessonId);

  if (context.isLoading) {
    return (
      <AppCard>
        <p className="text-body-sm text-text-secondary">Memuat materi…</p>
      </AppCard>
    );
  }

  if (!context.data) {
    return (
      <Stack gap="md">
        <EmptyState
          icon={BookOpen}
          title="Lesson tidak ditemukan"
          description="Materi mungkin telah dihapus atau belum tersedia untuk lembaga Anda."
        />
        <div>
          <Link to="/learning" className={ghostButtonClass}>
            Kembali ke daftar course
          </Link>
        </div>
      </Stack>
    );
  }

  return <LessonReader context={context.data} />;
}
