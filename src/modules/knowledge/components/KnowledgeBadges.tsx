import { cn } from "@/lib/utils";
import { DIFFICULTY_LABEL } from "@/modules/knowledge/config/kinds";
import type { KnowledgeDifficulty } from "@/modules/knowledge/types";

const TONE: Record<KnowledgeDifficulty, string> = {
  beginner: "border-success/40 bg-success/10 text-success",
  intermediate: "border-warning/40 bg-warning/10 text-warning",
  advanced: "border-destructive/40 bg-destructive/10 text-destructive",
};

/** Difficulty pill used by cards, lists, and the reader header. */
export function DifficultyBadge({ difficulty }: { difficulty: KnowledgeDifficulty }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-sm py-3xs text-caption",
        TONE[difficulty],
      )}
    >
      {DIFFICULTY_LABEL[difficulty]}
    </span>
  );
}

/** Tag chips rendered from the entry's tag array. */
export function TagList({ tags }: { tags: readonly string[] }) {
  if (tags.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-3xs">
      {tags.map((tag) => (
        <li
          key={tag}
          className="rounded-full border border-border bg-muted px-sm py-3xs text-caption text-text-secondary"
        >
          #{tag}
        </li>
      ))}
    </ul>
  );
}
