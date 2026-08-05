import { createFileRoute } from "@tanstack/react-router";
import { Star } from "lucide-react";

import { KnowledgeCard, useFavoriteEntries } from "@/modules/knowledge";
import { AppSection, Grid, Stack } from "@/shared/components/layout";
import { EmptyState } from "@/shared/components/shell";

export const Route = createFileRoute("/_shell/knowledge/favorites")({
  head: () => ({
    meta: [
      { title: "Materi Favorit — Knowledge | Hangeul LPK Platform" },
      {
        name: "description",
        content: "Kumpulan materi Knowledge yang Anda simpan sebagai favorit pribadi.",
      },
      { property: "og:title", content: "Materi Favorit — Knowledge" },
      {
        property: "og:description",
        content: "Simpan materi penting dan buka kembali kapan saja dari satu halaman.",
      },
    ],
  }),
  component: KnowledgeFavoritesPage,
});

function KnowledgeFavoritesPage() {
  const favorites = useFavoriteEntries();
  const list = favorites.data ?? [];

  return (
    <AppSection
      title="Favorit"
      description="Favorit bersifat pribadi dan terpisah dari bookmark pada domain Learning."
    >
      <Stack gap="md">
        {favorites.isLoading ? (
          <p className="text-body-sm text-text-secondary">Memuat favorit…</p>
        ) : list.length === 0 ? (
          <EmptyState
            icon={Star}
            title="Belum ada favorit"
            description="Gunakan tombol simpan pada kartu materi untuk menambahkannya ke sini."
          />
        ) : (
          <Grid cols={1} smCols={2} lgCols={3} gap="md">
            {list.map(({ favorite, entry }) => (
              <KnowledgeCard key={favorite.id} entry={entry} showKind />
            ))}
          </Grid>
        )}
      </Stack>
    </AppSection>
  );
}
