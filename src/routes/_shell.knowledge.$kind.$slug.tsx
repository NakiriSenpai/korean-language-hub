import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Library } from "lucide-react";

import { KnowledgeDetail, getKnowledgeKindByRoute, useKnowledgeEntry } from "@/modules/knowledge";
import { Stack } from "@/shared/components/layout";
import { EmptyState } from "@/shared/components/shell";
import { ghostButtonClass } from "@/shared/components/form";

export const Route = createFileRoute("/_shell/knowledge/$kind/$slug")({
  loader: ({ params }) => {
    const definition = getKnowledgeKindByRoute(params.kind);
    if (!definition) throw notFound();
    return { label: definition.label, slug: params.slug };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Materi tidak ditemukan" }, { name: "robots", content: "noindex" }],
      };
    }
    const title = `${loaderData.label} — Detail Materi | Hangeul LPK Platform`;
    const description = `Baca materi ${loaderData.label.toLowerCase()} lengkap dengan blok konten, tingkat kesulitan, dan tag.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: KnowledgeDetailPage,
});

function KnowledgeDetailPage() {
  const { kind, slug } = Route.useParams();
  const definition = getKnowledgeKindByRoute(kind);
  const entry = useKnowledgeEntry(definition?.kind ?? "grammar", slug);

  if (!definition) {
    return (
      <EmptyState
        icon={Library}
        title="Jenis materi tidak dikenal"
        description="Pilih salah satu kategori knowledge pada navigasi di atas."
      />
    );
  }

  return (
    <Stack gap="lg">
      <div>
        <Link
          to="/knowledge/$kind"
          params={{ kind: definition.route }}
          className={ghostButtonClass}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Kembali ke {definition.label}
        </Link>
      </div>

      {entry.isLoading ? (
        <p className="text-body-sm text-text-secondary">Memuat materi…</p>
      ) : !entry.data ? (
        <EmptyState
          icon={definition.icon}
          title="Materi tidak ditemukan"
          description="Materi mungkin telah dihapus atau slug-nya berubah."
        />
      ) : (
        <KnowledgeDetail entry={entry.data} />
      )}
    </Stack>
  );
}
