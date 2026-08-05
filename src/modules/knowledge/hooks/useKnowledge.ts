/**
 * Knowledge Domain — React Query bindings.
 * Tenant scoped; favorites additionally require the signed-in user.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth, useTenant } from "@/modules/identity";
import { ConversationService } from "@/modules/knowledge/services/conversation.service";
import { CultureService } from "@/modules/knowledge/services/culture.service";
import { FavoriteService } from "@/modules/knowledge/services/favorite.service";
import { GrammarService } from "@/modules/knowledge/services/grammar.service";
import { ReferenceService } from "@/modules/knowledge/services/reference.service";
import { SearchService } from "@/modules/knowledge/services/search.service";
import { VocabularyService } from "@/modules/knowledge/services/vocabulary.service";
import type {
  ContentStatus,
  KnowledgeKind,
  KnowledgeSearchFilters,
} from "@/modules/knowledge/types";
import type {
  KnowledgeEntryInput,
  KnowledgeFavoriteInput,
} from "@/modules/knowledge/validation/schemas";

const SERVICES = {
  grammar: GrammarService,
  vocabulary: VocabularyService,
  conversation: ConversationService,
  culture_note: CultureService,
  eps_reference: ReferenceService,
} as const;

/** Entity service resolver — used by hooks and by other domains. */
export function knowledgeService(kind: KnowledgeKind) {
  return SERVICES[kind];
}

export const knowledgeKeys = {
  all: (tenantId: string) => ["knowledge", tenantId] as const,
  entries: (tenantId: string, kind: KnowledgeKind, filters: KnowledgeSearchFilters) =>
    ["knowledge", tenantId, "entries", kind, filters] as const,
  entry: (tenantId: string, kind: KnowledgeKind, slug: string) =>
    ["knowledge", tenantId, "entry", kind, slug] as const,
  categories: (tenantId: string, kind: KnowledgeKind) =>
    ["knowledge", tenantId, "categories", kind] as const,
  searchCategories: (tenantId: string) => ["knowledge", tenantId, "categories", "all"] as const,
  search: (tenantId: string, filters: KnowledgeSearchFilters) =>
    ["knowledge", tenantId, "search", filters] as const,
  favorites: (tenantId: string, userId: string) =>
    ["knowledge", tenantId, "favorites", userId] as const,
};

export function useKnowledgeTenantId(): string {
  const { tenant } = useTenant();
  return tenant?.id ?? "";
}

export function useKnowledgeScope(): { tenantId: string; userId: string; ready: boolean } {
  const tenantId = useKnowledgeTenantId();
  const { user } = useAuth();
  const userId = user?.id ?? "";
  return { tenantId, userId, ready: Boolean(tenantId && userId) };
}

function useInvalidateKnowledge(tenantId: string) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: knowledgeKeys.all(tenantId) });
}

/* ------------------------------------------------------------------ */
/* Entries                                                             */
/* ------------------------------------------------------------------ */

export function useKnowledgeEntries(kind: KnowledgeKind, filters: KnowledgeSearchFilters = {}) {
  const tenantId = useKnowledgeTenantId();
  return useQuery({
    queryKey: knowledgeKeys.entries(tenantId, kind, filters),
    queryFn: () => knowledgeService(kind).list(tenantId, filters),
    enabled: Boolean(tenantId),
  });
}

export function useKnowledgeEntry(kind: KnowledgeKind, slug: string) {
  const tenantId = useKnowledgeTenantId();
  return useQuery({
    queryKey: knowledgeKeys.entry(tenantId, kind, slug),
    queryFn: () => knowledgeService(kind).getBySlug(tenantId, slug),
    enabled: Boolean(tenantId && slug),
  });
}

export function useKnowledgeCategories(kind: KnowledgeKind) {
  const tenantId = useKnowledgeTenantId();
  return useQuery({
    queryKey: knowledgeKeys.categories(tenantId, kind),
    queryFn: () => knowledgeService(kind).categories(tenantId),
    enabled: Boolean(tenantId),
  });
}

export function useCreateKnowledgeEntry(kind: KnowledgeKind) {
  const tenantId = useKnowledgeTenantId();
  const invalidate = useInvalidateKnowledge(tenantId);
  return useMutation({
    mutationFn: (input: KnowledgeEntryInput) => knowledgeService(kind).create(tenantId, input),
    onSuccess: invalidate,
  });
}

export function useUpdateKnowledgeEntry(kind: KnowledgeKind) {
  const tenantId = useKnowledgeTenantId();
  const invalidate = useInvalidateKnowledge(tenantId);
  return useMutation({
    mutationFn: (args: { id: string; input: KnowledgeEntryInput }) =>
      knowledgeService(kind).update(tenantId, args.id, args.input),
    onSuccess: invalidate,
  });
}

export function useUpdateKnowledgeStatus(kind: KnowledgeKind) {
  const tenantId = useKnowledgeTenantId();
  const invalidate = useInvalidateKnowledge(tenantId);
  return useMutation({
    mutationFn: (args: { id: string; status: ContentStatus }) =>
      knowledgeService(kind).setStatus(tenantId, args.id, args.status),
    onSuccess: invalidate,
  });
}

export function useDeleteKnowledgeEntry(kind: KnowledgeKind) {
  const tenantId = useKnowledgeTenantId();
  const invalidate = useInvalidateKnowledge(tenantId);
  return useMutation({
    mutationFn: (id: string) => knowledgeService(kind).remove(tenantId, id),
    onSuccess: invalidate,
  });
}

/* ------------------------------------------------------------------ */
/* Search                                                              */
/* ------------------------------------------------------------------ */

export function useKnowledgeSearch(filters: KnowledgeSearchFilters, enabled = true) {
  const tenantId = useKnowledgeTenantId();
  return useQuery({
    queryKey: knowledgeKeys.search(tenantId, filters),
    queryFn: () => SearchService.search(tenantId, filters),
    enabled: Boolean(tenantId) && enabled,
  });
}

export function useKnowledgeSearchCategories() {
  const tenantId = useKnowledgeTenantId();
  return useQuery({
    queryKey: knowledgeKeys.searchCategories(tenantId),
    queryFn: () => SearchService.categories(tenantId),
    enabled: Boolean(tenantId),
  });
}

/* ------------------------------------------------------------------ */
/* Favorites                                                           */
/* ------------------------------------------------------------------ */

export function useKnowledgeFavorites() {
  const { tenantId, userId, ready } = useKnowledgeScope();
  return useQuery({
    queryKey: knowledgeKeys.favorites(tenantId, userId),
    queryFn: () => FavoriteService.list({ tenantId, userId }),
    enabled: ready,
  });
}

export function useFavoriteEntries() {
  const { tenantId, userId, ready } = useKnowledgeScope();
  return useQuery({
    queryKey: [...knowledgeKeys.favorites(tenantId, userId), "entries"],
    queryFn: () => FavoriteService.listWithEntries({ tenantId, userId }),
    enabled: ready,
  });
}

export function useToggleFavorite() {
  const { tenantId, userId } = useKnowledgeScope();
  const invalidate = useInvalidateKnowledge(tenantId);
  return useMutation({
    mutationFn: (input: KnowledgeFavoriteInput) => FavoriteService.toggle({ tenantId, userId }, input),
    onSuccess: invalidate,
  });
}

export function useRemoveFavorite() {
  const { tenantId, userId } = useKnowledgeScope();
  const invalidate = useInvalidateKnowledge(tenantId);
  return useMutation({
    mutationFn: (args: { itemType: KnowledgeKind; itemId: string }) =>
      FavoriteService.remove({ tenantId, userId }, args.itemType, args.itemId),
    onSuccess: invalidate,
  });
}
