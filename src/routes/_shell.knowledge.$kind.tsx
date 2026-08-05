import { useMemo, useState } from "react";
import { createFileRoute, notFound } from "@tanstack/react-router";

import { PermissionGate } from "@/modules/identity";
import {
  KNOWLEDGE_PERMISSIONS,
  KnowledgeCard,
  KnowledgeEntryForm,
  KnowledgeFilters,
  getKnowledgeKindByRoute,
  useKnowledgeCategories,
  useKnowledgeEntries,
  type KnowledgeSearchFilters,
} from "@/modules/knowledge";
import { AppSection, Grid, Stack } from "@/shared/components/layout";
import { EmptyState } from "@/shared/components/shell";

export const Route = createFileRoute("/_shell/knowledge/$kind")({
  loader: ({ params }) => {
    const definition = getKnowledgeKindByRoute(params.kind);
    if (!definition) throw notFound();
    return { label: definition.label, description: definition.description };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Materi tidak ditemukan" }, { name: "robots", content: "noindex" }],
      };
    }
    const title = `${loaderData.label} — Knowledge | Hangeul LPK Platform`;
    return {
      meta: [
        { title },
        { name: "description", content: loaderData.description },
        { property: "og:title", content: title },
        { property: "og:description", content: loaderData.description },
      ],
    };
  },
  component: KnowledgeKindPage,
});

function KnowledgeKindPage() {
  const { kind } = Route.useParams();
  const definition = getKnowledgeKindByRoute(kind);
  const [filters, setFilters] = useState<KnowledgeSearchFilters>({});

  const activeKind = definition?.kind ?? "grammar";
  const entries = useKnowledgeEntries(activeKind, filters);
  const categories = useKnowledgeCategories(activeKind);

  const list = useMemo(() => entries.data ?? [], [entries.data]);

  if (!definition) {
    return (
      <EmptyState
        title="Jenis materi tidak dikenal"
        description="Pilih salah satu kategori knowledge pada navigasi di atas."
      />
    );
  }

  return (
    <Stack gap="xl">
      <AppSection title={definition.plural} description={definition.description}>
        <Stack gap="lg">
          <KnowledgeFilters
            value={filters}
            onChange={setFilters}
            categories={categories.data ?? []}
            idPrefix={`knowledge-${definition.route}`}
          />

          {entries.isLoading ? (
            <p className="text-body-sm text-text-secondary">Memuat materi…</p>
          ) : list.length === 0 ? (
            <EmptyState
              icon={definition.icon}
              title={`Belum ada ${definition.label}`}
              description="Tambahkan materi baru atau ubah filter pencarian."
            />
          ) : (
            <Grid cols={1} smCols={2} lgCols={3} gap="md">
              {list.map((entry) => (
                <KnowledgeCard key={entry.id} entry={entry} />
              ))}
            </Grid>
          )}
        </Stack>
      </AppSection>

      <PermissionGate required={[KNOWLEDGE_PERMISSIONS.write]} fallback={null}>
        <KnowledgeEntryForm definition={definition} />
      </PermissionGate>
    </Stack>
  );
}
