/**
 * Knowledge Domain — public entry point.
 * Other modules must import from `@/modules/knowledge`, never from internals.
 */

export type {
  ContentStatus,
  KnowledgeBlock,
  KnowledgeDifficulty,
  KnowledgeEntry,
  KnowledgeExtra,
  KnowledgeFavorite,
  KnowledgeKind,
  KnowledgeSearchFilters,
  KnowledgeSearchResult,
} from "@/modules/knowledge/types";

export { KNOWLEDGE_PERMISSIONS } from "@/modules/knowledge/config/permissions";
export type { KnowledgePermissionKey } from "@/modules/knowledge/config/permissions";

export {
  DIFFICULTY_LABEL,
  DIFFICULTY_OPTIONS,
  KNOWLEDGE_KINDS,
  getKnowledgeKind,
  getKnowledgeKindByRoute,
} from "@/modules/knowledge/config/kinds";
export type {
  KnowledgeExtraField,
  KnowledgeKindDefinition,
  KnowledgeTable,
} from "@/modules/knowledge/config/kinds";

export {
  knowledgeBlockSchema,
  knowledgeDifficultySchema,
  knowledgeEntryInputSchema,
  knowledgeFavoriteInputSchema,
  knowledgeKindSchema,
  knowledgeSearchSchema,
  knowledgeStatusSchema,
} from "@/modules/knowledge/validation/schemas";
export type {
  KnowledgeEntryInput,
  KnowledgeFavoriteInput,
  KnowledgeSearchInput,
} from "@/modules/knowledge/validation/schemas";

export { GrammarService } from "@/modules/knowledge/services/grammar.service";
export { VocabularyService } from "@/modules/knowledge/services/vocabulary.service";
export { ConversationService } from "@/modules/knowledge/services/conversation.service";
export { CultureService } from "@/modules/knowledge/services/culture.service";
export { ReferenceService } from "@/modules/knowledge/services/reference.service";
export { SearchService } from "@/modules/knowledge/services/search.service";
export { FavoriteService } from "@/modules/knowledge/services/favorite.service";
export type { FavoriteEntry } from "@/modules/knowledge/services/favorite.service";

export {
  knowledgeKeys,
  knowledgeService,
  useCreateKnowledgeEntry,
  useDeleteKnowledgeEntry,
  useFavoriteEntries,
  useKnowledgeCategories,
  useKnowledgeEntries,
  useKnowledgeEntry,
  useKnowledgeFavorites,
  useKnowledgeScope,
  useKnowledgeSearch,
  useKnowledgeSearchCategories,
  useKnowledgeTenantId,
  useRemoveFavorite,
  useToggleFavorite,
  useUpdateKnowledgeEntry,
  useUpdateKnowledgeStatus,
} from "@/modules/knowledge/hooks/useKnowledge";

export { DifficultyBadge, TagList } from "@/modules/knowledge/components/KnowledgeBadges";
export { FavoriteButton } from "@/modules/knowledge/components/FavoriteButton";
export { KnowledgeCard } from "@/modules/knowledge/components/KnowledgeCard";
export { KnowledgeDetail } from "@/modules/knowledge/components/KnowledgeDetail";
export { KnowledgeEntryForm } from "@/modules/knowledge/components/KnowledgeEntryForm";
export { KnowledgeFilters } from "@/modules/knowledge/components/KnowledgeFilters";
