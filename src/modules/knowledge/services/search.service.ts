/**
 * SearchService — basic knowledge search.
 * Keyword, category, difficulty, and tag across every knowledge kind.
 * Full text search is intentionally out of scope for this sprint.
 */

import { KNOWLEDGE_KINDS } from "@/modules/knowledge/config/kinds";
import { listCategories, listEntries } from "@/modules/knowledge/services/entry.repository";
import { assertTenant } from "@/modules/knowledge/services/knowledge-client";
import type {
  KnowledgeEntry,
  KnowledgeSearchFilters,
  KnowledgeSearchResult,
} from "@/modules/knowledge/types";
import { knowledgeSearchSchema } from "@/modules/knowledge/validation/schemas";

const ALL_KINDS = KNOWLEDGE_KINDS.map((item) => item.kind);

export const SearchService = {
  /** Runs the same filters across every requested knowledge kind. */
  async search(tenantId: string, filters: KnowledgeSearchFilters): Promise<KnowledgeSearchResult> {
    assertTenant(tenantId, "knowledge.search");
    const parsed = knowledgeSearchSchema.parse(filters);
    const kinds = parsed.kinds && parsed.kinds.length > 0 ? parsed.kinds : ALL_KINDS;

    const batches = await Promise.all(
      kinds.map((kind) => listEntries(kind, tenantId, parsed as KnowledgeSearchFilters)),
    );

    const entries: KnowledgeEntry[] = batches
      .flat()
      .sort((a, b) => a.title.localeCompare(b.title, "id"));

    return { entries, total: entries.length };
  },

  /** Union of categories across every knowledge kind, for the filter bar. */
  async categories(tenantId: string): Promise<readonly string[]> {
    assertTenant(tenantId, "knowledge.search.categories");
    const batches = await Promise.all(ALL_KINDS.map((kind) => listCategories(kind, tenantId)));
    return [...new Set(batches.flat())].sort((a, b) => a.localeCompare(b, "id"));
  },
};
