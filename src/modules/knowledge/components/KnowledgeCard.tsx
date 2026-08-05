import { Link } from "@tanstack/react-router";

import { ContentStatusBadge } from "@/modules/learning";
import { getKnowledgeKind } from "@/modules/knowledge/config/kinds";
import { DifficultyBadge, TagList } from "@/modules/knowledge/components/KnowledgeBadges";
import { FavoriteButton } from "@/modules/knowledge/components/FavoriteButton";
import type { KnowledgeEntry } from "@/modules/knowledge/types";
import { AppCard, Stack } from "@/shared/components/layout";

export interface KnowledgeCardProps {
  readonly entry: KnowledgeEntry;
  /** Shows which knowledge kind the entry belongs to (search and favorites). */
  readonly showKind?: boolean;
  readonly actions?: React.ReactNode;
}

/** Single knowledge entry summary card. */
export function KnowledgeCard({ entry, showKind, actions }: KnowledgeCardProps) {
  const definition = getKnowledgeKind(entry.kind);
  const Icon = definition.icon;

  return (
    <AppCard interactive>
      <Stack gap="sm">
        <div className="flex items-start justify-between gap-sm">
          <div className="min-w-0">
            {showKind && (
              <p className="mb-3xs flex items-center gap-3xs text-caption text-text-secondary">
                <Icon className="size-3.5" aria-hidden="true" />
                {definition.label}
              </p>
            )}
            <Link
              to="/knowledge/$kind/$slug"
              params={{ kind: definition.route, slug: entry.slug }}
              className="text-title text-text-primary hover:underline"
            >
              {entry.title}
            </Link>
          </div>
          <ContentStatusBadge status={entry.status} />
        </div>

        {entry.description && (
          <p className="line-clamp-3 text-body-sm text-text-secondary">{entry.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-xs">
          <DifficultyBadge difficulty={entry.difficulty} />
          {entry.category && (
            <span className="text-caption text-text-secondary">{entry.category}</span>
          )}
        </div>

        <TagList tags={entry.tags} />

        <div className="flex flex-wrap items-center gap-xs">
          <FavoriteButton itemType={entry.kind} itemId={entry.id} title={entry.title} compact />
          {actions}
        </div>
      </Stack>
    </AppCard>
  );
}
