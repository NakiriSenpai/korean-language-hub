import { Star } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { useKnowledgeFavorites, useToggleFavorite } from "@/modules/knowledge/hooks/useKnowledge";
import type { KnowledgeKind } from "@/modules/knowledge/types";
import { ghostButtonClass } from "@/shared/components/form";
import { toUserMessage } from "@/shared/platform";

export interface FavoriteButtonProps {
  readonly itemType: KnowledgeKind;
  readonly itemId: string;
  readonly title: string;
  readonly compact?: boolean;
}

/** Favorite toggle — personal, distinct from Learning bookmarks. */
export function FavoriteButton({ itemType, itemId, title, compact }: FavoriteButtonProps) {
  const favorites = useKnowledgeFavorites();
  const toggleFavorite = useToggleFavorite();

  const isFavorite = (favorites.data ?? []).some(
    (item) => item.itemType === itemType && item.itemId === itemId,
  );

  const onToggle = async () => {
    try {
      const added = await toggleFavorite.mutateAsync({ itemType, itemId });
      toast.success(added ? "Ditambahkan ke favorit." : "Dihapus dari favorit.");
    } catch (cause) {
      toast.error(toUserMessage(cause));
    }
  };

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={toggleFavorite.isPending}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? `Hapus favorit ${title}` : `Simpan ${title} ke favorit`}
      className={cn(ghostButtonClass, isFavorite && "border-warning/50 text-warning")}
    >
      <Star className={cn("size-4", isFavorite && "fill-current")} aria-hidden="true" />
      {!compact && <span>{isFavorite ? "Favorit" : "Simpan"}</span>}
    </button>
  );
}
