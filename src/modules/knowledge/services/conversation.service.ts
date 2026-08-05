/**
 * ConversationService — situational dialogues.
 */

import {
  createEntry,
  deleteEntry,
  getEntryBySlug,
  listCategories,
  listEntries,
  updateEntry,
  updateEntryStatus,
} from "@/modules/knowledge/services/entry.repository";
import type { ContentStatus, KnowledgeSearchFilters } from "@/modules/knowledge/types";
import type { KnowledgeEntryInput } from "@/modules/knowledge/validation/schemas";

const KIND = "conversation" as const;

export const ConversationService = {
  list: (tenantId: string, filters?: KnowledgeSearchFilters) =>
    listEntries(KIND, tenantId, filters),
  getBySlug: (tenantId: string, slug: string) => getEntryBySlug(KIND, tenantId, slug),
  create: (tenantId: string, input: KnowledgeEntryInput) => createEntry(KIND, tenantId, input),
  update: (tenantId: string, id: string, input: KnowledgeEntryInput) =>
    updateEntry(KIND, tenantId, id, input),
  setStatus: (tenantId: string, id: string, status: ContentStatus) =>
    updateEntryStatus(KIND, tenantId, id, status),
  remove: (tenantId: string, id: string) => deleteEntry(KIND, tenantId, id),
  categories: (tenantId: string) => listCategories(KIND, tenantId),
};
