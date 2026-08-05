/**
 * Knowledge Domain — permission catalogue.
 * Permission strings only; role checks are forbidden in this domain.
 */

import type { Permission } from "@/modules/identity";

export const KNOWLEDGE_PERMISSIONS = {
  read: "knowledge.read",
  write: "knowledge.write",
} as const satisfies Record<string, Permission>;

export type KnowledgePermissionKey = keyof typeof KNOWLEDGE_PERMISSIONS;
