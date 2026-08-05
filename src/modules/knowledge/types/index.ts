/**
 * Knowledge Domain — domain types.
 * Knowledge is the central content library consumed by Learning, Assessment,
 * Question Bank, Exam, Search, Recommendation, and Analytics.
 */

import type { BlockType, CalloutTone, ContentStatus } from "@/modules/learning";

export type { ContentStatus };

export type KnowledgeDifficulty = "beginner" | "intermediate" | "advanced";

export type KnowledgeKind =
  | "grammar"
  | "vocabulary"
  | "conversation"
  | "culture_note"
  | "eps_reference";

/** A single content block stored inside a knowledge entry (Sprint 3 block shape). */
export interface KnowledgeBlock {
  readonly id: string;
  readonly type: BlockType;
  readonly position: number;
  readonly content: {
    readonly text?: string;
    readonly url?: string;
    readonly alt?: string;
    readonly caption?: string;
    readonly author?: string;
    readonly title?: string;
    readonly tone?: CalloutTone;
  };
}

/** Fields shared by every knowledge entity. */
export interface KnowledgeEntry {
  readonly id: string;
  readonly tenantId: string;
  readonly kind: KnowledgeKind;
  readonly title: string;
  readonly slug: string;
  readonly description: string | null;
  readonly difficulty: KnowledgeDifficulty;
  readonly category: string | null;
  readonly tags: readonly string[];
  readonly thumbnailUrl: string | null;
  readonly coverUrl: string | null;
  readonly status: ContentStatus;
  readonly publishedAt: string | null;
  readonly blocks: readonly KnowledgeBlock[];
  readonly createdAt: string;
  readonly updatedAt: string;
  /** Entity specific attributes, already labelled for display. */
  readonly extras: readonly KnowledgeExtra[];
}

export interface KnowledgeExtra {
  readonly label: string;
  readonly value: string;
}

export interface KnowledgeFavorite {
  readonly id: string;
  readonly tenantId: string;
  readonly userId: string;
  readonly itemType: KnowledgeKind;
  readonly itemId: string;
  readonly note: string | null;
  readonly createdAt: string;
}

/** Filters accepted by SearchService — keyword, category, difficulty, tag. */
export interface KnowledgeSearchFilters {
  readonly keyword?: string;
  readonly category?: string;
  readonly difficulty?: KnowledgeDifficulty | "";
  readonly tag?: string;
  readonly kinds?: readonly KnowledgeKind[];
  readonly status?: ContentStatus | "";
}

export interface KnowledgeSearchResult {
  readonly entries: readonly KnowledgeEntry[];
  readonly total: number;
}
