import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SearchX } from "lucide-react";

import {
  KnowledgeCard,
  KnowledgeFilters,
  useKnowledgeSearch,
  useKnowledgeSearchCategories,
  type KnowledgeSearchFilters,
} from "@/modules/knowledge";
import { AppSection, Grid, Stack } from "@/shared/components/layout";
import { EmptyState } from "@/shared/components/shell";

export const Route = createFileRoute("/_shell/knowledge/search")({
  head: () => ({
    meta: [
      { title: "Pencarian Materi — Knowledge | Hangeul LPK Platform" },
      {
        name: "description",
        content:
          "Cari materi lintas kategori berdasarkan kata kunci, kategori, tingkat kesulitan, dan tag.",
      },
      { property: "og:title", content: "Pencarian Materi — Knowledge" },
      {
        property: "og:description",
        content: "Satu pencarian untuk grammar, kosakata, percakapan, budaya, dan rujukan EPS.",
      },
    ],
  }),
  component: KnowledgeSearchPage,
});

function KnowledgeSearchPage() {
  const [filters, setFilters] = useState<KnowledgeSearchFilters>({});
  const categories = useKnowledgeSearchCategories();

  const hasFilter = Boolean(
    filters.keyword?.trim() || filters.category || filters.difficulty || filters.tag?.trim(),
  );
  const results = useKnowledgeSearch(filters, hasFilter);
  const list = results.data?.entries ?? [];

  return (
    <AppSection
      title="Pencarian"
      description="Telusuri seluruh jenis materi sekaligus dalam satu tempat."
    >
      <Stack gap="lg">
        <KnowledgeFilters
          value={filters}
          onChange={setFilters}
          categories={categories.data ?? []}
          idPrefix="knowledge-search"
        />

        {!hasFilter ? (
          <EmptyState
            icon={SearchX}
            title="Mulai pencarian"
            description="Masukkan kata kunci atau pilih filter untuk melihat hasil."
          />
        ) : results.isLoading ? (
          <p className="text-body-sm text-text-secondary">Mencari materi…</p>
        ) : list.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="Tidak ada hasil"
            description="Coba kata kunci lain atau longgarkan filter yang dipakai."
          />
        ) : (
          <Stack gap="md">
            <p className="text-caption text-text-secondary">{list.length} materi ditemukan.</p>
            <Grid cols={1} smCols={2} lgCols={3} gap="md">
              {list.map((entry) => (
                <KnowledgeCard key={`${entry.kind}-${entry.id}`} entry={entry} showKind />
              ))}
            </Grid>
          </Stack>
        )}
      </Stack>
    </AppSection>
  );
}
