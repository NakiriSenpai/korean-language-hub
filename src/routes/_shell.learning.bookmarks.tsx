import { createFileRoute, Link } from "@tanstack/react-router";
import { Bookmark as BookmarkIcon, Trash2 } from "lucide-react";

import { useBookmarks, useRemoveBookmark } from "@/modules/learning";
import { AppCard, AppSection, Stack } from "@/shared/components/layout";
import { EmptyState } from "@/shared/components/shell";
import { ghostButtonClass } from "@/shared/components/form";

export const Route = createFileRoute("/_shell/learning/bookmarks")({
  head: () => ({
    meta: [
      { title: "Bookmark Belajar — Hangeul LPK Platform" },
      {
        name: "description",
        content: "Kumpulan lesson dan unit yang Anda tandai untuk dibaca ulang.",
      },
      { property: "og:title", content: "Bookmark Belajar" },
      {
        property: "og:description",
        content: "Tandai materi penting dan buka kembali kapan saja.",
      },
    ],
  }),
  component: BookmarksPage,
});

function BookmarksPage() {
  const bookmarks = useBookmarks();
  const removeBookmark = useRemoveBookmark();

  return (
    <AppSection title="Bookmark" description="Materi yang Anda tandai untuk dibaca kembali.">
      {bookmarks.isLoading ? (
        <p className="text-body-sm text-text-secondary">Memuat bookmark…</p>
      ) : (bookmarks.data ?? []).length === 0 ? (
        <EmptyState
          icon={BookmarkIcon}
          title="Belum ada bookmark"
          description="Gunakan tombol bookmark di reader untuk menandai unit penting."
        />
      ) : (
        <Stack gap="sm">
          {(bookmarks.data ?? []).map((bookmark) => (
            <AppCard key={bookmark.id} interactive>
              <div className="flex flex-wrap items-center justify-between gap-sm">
                <div className="min-w-0">
                  <Link
                    to="/learning/lessons/$lessonId"
                    params={{ lessonId: bookmark.lessonId }}
                    className="text-title text-text-primary hover:underline"
                  >
                    {bookmark.lessonTitle}
                  </Link>
                  <p className="text-caption text-text-secondary">
                    {bookmark.unitTitle ?? "Seluruh lesson"}
                    {bookmark.note ? ` · ${bookmark.note}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  className={ghostButtonClass}
                  onClick={() => removeBookmark.mutate(bookmark.id)}
                  aria-label={`Hapus bookmark ${bookmark.lessonTitle}`}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
            </AppCard>
          ))}
        </Stack>
      )}
    </AppSection>
  );
}
