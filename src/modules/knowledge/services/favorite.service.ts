/**
 * FavoriteService — personal knowledge favorites.
 * Distinct from Learning bookmarks: favorites point at knowledge entries,
 * bookmarks point at lessons and units.
 */

import { supabase } from "@/integrations/supabase/client";
import {
  assertTenant,
  assertUser,
  toKnowledgeError,
  unwrap,
  type KnowledgeScope,
} from "@/modules/knowledge/services/knowledge-client";
import { getEntriesByIds } from "@/modules/knowledge/services/entry.repository";
import { KNOWLEDGE_KINDS } from "@/modules/knowledge/config/kinds";
import type { KnowledgeEntry, KnowledgeFavorite, KnowledgeKind } from "@/modules/knowledge/types";
import {
  knowledgeFavoriteInputSchema,
  type KnowledgeFavoriteInput,
} from "@/modules/knowledge/validation/schemas";

const COLUMNS = "id, tenant_id, user_id, item_type, item_id, note, created_at";

interface Row {
  id: string;
  tenant_id: string;
  user_id: string;
  item_type: KnowledgeKind;
  item_id: string;
  note: string | null;
  created_at: string;
}

const toFavorite = (row: Row): KnowledgeFavorite => ({
  id: row.id,
  tenantId: row.tenant_id,
  userId: row.user_id,
  itemType: row.item_type,
  itemId: row.item_id,
  note: row.note,
  createdAt: row.created_at,
});

export interface FavoriteEntry {
  readonly favorite: KnowledgeFavorite;
  readonly entry: KnowledgeEntry;
}

export const FavoriteService = {
  async list(scope: KnowledgeScope): Promise<readonly KnowledgeFavorite[]> {
    assertTenant(scope.tenantId, "knowledge.favorite.list");
    assertUser(scope.userId, "knowledge.favorite.list");

    const { data, error } = await supabase
      .from("knowledge_favorites")
      .select(COLUMNS)
      .eq("tenant_id", scope.tenantId)
      .eq("user_id", scope.userId)
      .order("created_at", { ascending: false });

    if (error) throw toKnowledgeError(error, "knowledge.favorite.list");
    return (data ?? []).map((row) => toFavorite(row as Row));
  },

  /** Favorites joined with the knowledge entry they point at. */
  async listWithEntries(scope: KnowledgeScope): Promise<readonly FavoriteEntry[]> {
    const favorites = await FavoriteService.list(scope);
    if (favorites.length === 0) return [];

    const byKind = new Map<KnowledgeKind, string[]>();
    for (const favorite of favorites) {
      const bucket = byKind.get(favorite.itemType) ?? [];
      bucket.push(favorite.itemId);
      byKind.set(favorite.itemType, bucket);
    }

    const batches = await Promise.all(
      KNOWLEDGE_KINDS.filter((definition) => byKind.has(definition.kind)).map((definition) =>
        getEntriesByIds(definition.kind, scope.tenantId, byKind.get(definition.kind) ?? []),
      ),
    );

    const entryById = new Map(batches.flat().map((entry) => [entry.id, entry]));
    return favorites
      .map((favorite) => {
        const entry = entryById.get(favorite.itemId);
        return entry ? { favorite, entry } : null;
      })
      .filter((item): item is FavoriteEntry => item !== null);
  },

  /** Adds a favorite; the unique index keeps duplicates impossible. */
  async add(scope: KnowledgeScope, input: KnowledgeFavoriteInput): Promise<KnowledgeFavorite> {
    assertTenant(scope.tenantId, "knowledge.favorite.add");
    assertUser(scope.userId, "knowledge.favorite.add");
    const parsed = knowledgeFavoriteInputSchema.parse(input);

    const result = await supabase
      .from("knowledge_favorites")
      .upsert(
        {
          tenant_id: scope.tenantId,
          user_id: scope.userId,
          item_type: parsed.itemType,
          item_id: parsed.itemId,
          note: parsed.note,
        },
        { onConflict: "tenant_id,user_id,item_type,item_id" },
      )
      .select(COLUMNS)
      .single();

    return toFavorite(unwrap(result, "knowledge.favorite.add") as Row);
  },

  async remove(scope: KnowledgeScope, itemType: KnowledgeKind, itemId: string): Promise<void> {
    assertTenant(scope.tenantId, "knowledge.favorite.remove");
    assertUser(scope.userId, "knowledge.favorite.remove");

    const { error } = await supabase
      .from("knowledge_favorites")
      .delete()
      .eq("tenant_id", scope.tenantId)
      .eq("user_id", scope.userId)
      .eq("item_type", itemType)
      .eq("item_id", itemId);

    if (error) throw toKnowledgeError(error, "knowledge.favorite.remove");
  },

  /** Adds when missing, removes when present. */
  async toggle(scope: KnowledgeScope, input: KnowledgeFavoriteInput): Promise<boolean> {
    const parsed = knowledgeFavoriteInputSchema.parse(input);
    const existing = await FavoriteService.list(scope);
    const found = existing.find(
      (item) => item.itemType === parsed.itemType && item.itemId === parsed.itemId,
    );
    if (found) {
      await FavoriteService.remove(scope, parsed.itemType, parsed.itemId);
      return false;
    }
    await FavoriteService.add(scope, input);
    return true;
  },
};
