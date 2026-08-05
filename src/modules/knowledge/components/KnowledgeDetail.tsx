import { getKnowledgeKind } from "@/modules/knowledge/config/kinds";
import { DifficultyBadge, TagList } from "@/modules/knowledge/components/KnowledgeBadges";
import { FavoriteButton } from "@/modules/knowledge/components/FavoriteButton";
import type { KnowledgeEntry } from "@/modules/knowledge/types";
import { BlockList, ContentStatusBadge, type LessonBlock } from "@/modules/learning";
import { AppCard, AppSection, Grid, Stack } from "@/shared/components/layout";

/**
 * Knowledge detail view.
 * Content is rendered by the Universal Reader from Sprint 3 (`BlockList`);
 * this domain deliberately ships no reader of its own.
 */
export function KnowledgeDetail({ entry }: { entry: KnowledgeEntry }) {
  const definition = getKnowledgeKind(entry.kind);
  const Icon = definition.icon;

  /* Knowledge blocks share the Sprint 3 block shape; adapt to the reader contract. */
  const blocks: readonly LessonBlock[] = entry.blocks.map((block) => ({
    id: block.id,
    tenantId: entry.tenantId,
    unitId: entry.id,
    type: block.type,
    content: block.content,
    position: block.position,
  }));

  return (
    <Stack gap="xl">
      <AppCard>
        <Stack gap="sm">
          <p className="flex items-center gap-3xs text-caption text-text-secondary">
            <Icon className="size-3.5" aria-hidden="true" />
            {definition.label}
          </p>
          <div className="flex flex-wrap items-start justify-between gap-sm">
            <h3 className="min-w-0 text-h3 text-text-primary">{entry.title}</h3>
            <div className="flex items-center gap-xs">
              <ContentStatusBadge status={entry.status} />
              <FavoriteButton itemType={entry.kind} itemId={entry.id} title={entry.title} />
            </div>
          </div>

          {entry.description && (
            <p className="text-body-sm text-text-secondary">{entry.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-xs">
            <DifficultyBadge difficulty={entry.difficulty} />
            {entry.category && (
              <span className="text-caption text-text-secondary">{entry.category}</span>
            )}
            {entry.publishedAt && (
              <time dateTime={entry.publishedAt} className="text-caption text-text-secondary">
                Terbit {new Date(entry.publishedAt).toLocaleDateString("id-ID", { dateStyle: "medium" })}
              </time>
            )}
          </div>

          <TagList tags={entry.tags} />
        </Stack>
      </AppCard>

      {entry.coverUrl && (
        <img
          src={entry.coverUrl}
          alt={`Sampul ${entry.title}`}
          loading="lazy"
          className="w-full rounded-lg border border-border object-cover"
        />
      )}

      {entry.extras.length > 0 && (
        <AppSection title="Detail">
          <AppCard>
            <Grid cols={1} smCols={2} lgCols={3} gap="md">
              {entry.extras.map((extra) => (
                <div key={extra.label} className="min-w-0">
                  <dt className="text-caption text-text-secondary">{extra.label}</dt>
                  <dd className="break-words text-body-sm text-text-primary">{extra.value}</dd>
                </div>
              ))}
            </Grid>
          </AppCard>
        </AppSection>
      )}

      <AppSection title="Materi">
        {blocks.length === 0 ? (
          <AppCard>
            <p className="text-body-sm text-text-secondary">
              Materi blok belum diisi untuk entri ini.
            </p>
          </AppCard>
        ) : (
          <AppCard>
            <BlockList blocks={blocks} />
          </AppCard>
        )}
      </AppSection>
    </Stack>
  );
}
