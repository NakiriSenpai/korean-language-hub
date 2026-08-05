/**
 * Knowledge Domain — entity registry.
 * One place that maps a knowledge kind to its table, labels, route slug, and icon,
 * so services, hooks, and UI never duplicate that knowledge.
 */

import { BookMarked, Globe2, Landmark, MessagesSquare, Type, type LucideIcon } from "lucide-react";

import type { KnowledgeDifficulty, KnowledgeKind } from "@/modules/knowledge/types";

export type KnowledgeTable =
  | "grammars"
  | "vocabularies"
  | "conversations"
  | "culture_notes"
  | "eps_references";

export interface KnowledgeExtraField {
  /** Database column (snake_case). */
  readonly column: string;
  /** Form field key (camelCase). */
  readonly key: string;
  readonly label: string;
  readonly type: "text" | "number";
}

export interface KnowledgeKindDefinition {
  readonly kind: KnowledgeKind;
  readonly table: KnowledgeTable;
  /** URL segment used by /knowledge/$kind. */
  readonly route: string;
  readonly label: string;
  readonly plural: string;
  readonly description: string;
  readonly icon: LucideIcon;
  readonly extras: readonly KnowledgeExtraField[];
}

export const KNOWLEDGE_KINDS: readonly KnowledgeKindDefinition[] = [
  {
    kind: "grammar",
    table: "grammars",
    route: "grammar",
    label: "Grammar",
    plural: "Grammar",
    description: "Pola tata bahasa Korea beserta makna dan contoh penggunaannya.",
    icon: Type,
    extras: [
      { column: "pattern", key: "pattern", label: "Pola", type: "text" },
      { column: "meaning", key: "meaning", label: "Makna", type: "text" },
    ],
  },
  {
    kind: "vocabulary",
    table: "vocabularies",
    route: "vocabulary",
    label: "Vocabulary",
    plural: "Vocabulary",
    description: "Kosakata Hangeul lengkap dengan romanisasi, arti, dan audio.",
    icon: BookMarked,
    extras: [
      { column: "hangeul", key: "hangeul", label: "Hangeul", type: "text" },
      { column: "romanization", key: "romanization", label: "Romanisasi", type: "text" },
      { column: "meaning", key: "meaning", label: "Arti", type: "text" },
      { column: "audio_url", key: "audioUrl", label: "Audio", type: "text" },
    ],
  },
  {
    kind: "conversation",
    table: "conversations",
    route: "conversation",
    label: "Conversation",
    plural: "Conversation",
    description: "Percakapan situasional untuk latihan komunikasi sehari-hari.",
    icon: MessagesSquare,
    extras: [
      { column: "situation", key: "situation", label: "Situasi", type: "text" },
      { column: "audio_url", key: "audioUrl", label: "Audio", type: "text" },
    ],
  },
  {
    kind: "culture_note",
    table: "culture_notes",
    route: "culture",
    label: "Culture Note",
    plural: "Culture Note",
    description: "Catatan budaya Korea yang menunjang pemahaman bahasa.",
    icon: Globe2,
    extras: [{ column: "region", key: "region", label: "Wilayah", type: "text" }],
  },
  {
    kind: "eps_reference",
    table: "eps_references",
    route: "reference",
    label: "EPS-TOPIK Reference",
    plural: "EPS-TOPIK Reference",
    description: "Rujukan resmi EPS-TOPIK sebagai acuan materi dan ujian.",
    icon: Landmark,
    extras: [
      { column: "reference_code", key: "referenceCode", label: "Kode rujukan", type: "text" },
      { column: "source_year", key: "sourceYear", label: "Tahun sumber", type: "number" },
    ],
  },
] as const;

const BY_KIND = new Map(KNOWLEDGE_KINDS.map((item) => [item.kind, item]));
const BY_ROUTE = new Map(KNOWLEDGE_KINDS.map((item) => [item.route, item]));

export function getKnowledgeKind(kind: KnowledgeKind): KnowledgeKindDefinition {
  const found = BY_KIND.get(kind);
  if (!found) throw new Error(`Unknown knowledge kind: ${kind}`);
  return found;
}

export function getKnowledgeKindByRoute(route: string): KnowledgeKindDefinition | null {
  return BY_ROUTE.get(route) ?? null;
}

export const DIFFICULTY_OPTIONS: readonly {
  readonly value: KnowledgeDifficulty;
  readonly label: string;
}[] = [
  { value: "beginner", label: "Pemula" },
  { value: "intermediate", label: "Menengah" },
  { value: "advanced", label: "Mahir" },
] as const;

export const DIFFICULTY_LABEL: Record<KnowledgeDifficulty, string> = {
  beginner: "Pemula",
  intermediate: "Menengah",
  advanced: "Mahir",
};
