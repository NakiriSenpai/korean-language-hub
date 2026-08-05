/**
 * Knowledge Domain — generic entry repository.
 * Every knowledge entity shares the same shape, so all CRUD lives here once and
 * the per-entity services stay thin, named wrappers.
 */

import {
  assertTenant,
  knowledgeDb,
  toKnowledgeError,
  unwrap,
} from "@/modules/knowledge/services/knowledge-client";
import { getKnowledgeKind, type KnowledgeKindDefinition } from "@/modules/knowledge/config/kinds";
import type {
  KnowledgeBlock,
  KnowledgeEntry,
  KnowledgeExtra,
  KnowledgeKind,
  KnowledgeSearchFilters,
} from "@/modules/knowledge/types";
import {
  knowledgeEntryInputSchema,
  type KnowledgeEntryInput,
} from "@/modules/knowledge/validation/schemas";

type Row = Record<string, unknown>;

const BASE_COLUMNS = [
  "id",
  "tenant_id",
  "title",
  "slug",
  "description",
  "difficulty",
  "category",
  "tags",
  "thumbnail_url",
  "cover_url",
  "status",
  "published_at",
  "blocks",
  "created_at",
  "updated_at",
];

function columnsFor(definition: KnowledgeKindDefinition): string {
  return [...BASE_COLUMNS, ...definition.extras.map((extra) => extra.column)].join(", ");
}

function toBlocks(value: unknown): readonly KnowledgeBlock[] {
  if (!Array.isArray(value)) return [];
  return (value as KnowledgeBlock[])
    .filter((block) => Boolean(block?.id) && Boolean(block?.type))
    .map((block, index) => ({
      id: String(block.id),
      type: block.type,
      position: typeof block.position === "number" ? block.position : index,
      content: block.content ?? {},
    }))
    .sort((a, b) => a.position - b.position);
}

function toExtras(definition: KnowledgeKindDefinition, row: Row): readonly KnowledgeExtra[] {
  const result: KnowledgeExtra[] = [];
  for (const extra of definition.extras) {
    const value = row[extra.column];
    if (value === null || value === undefined || value === "") continue;
    result.push({ label: extra.label, value: String(value) });
  }
  return result;
}

function toEntry(definition: KnowledgeKindDefinition, row: Row): KnowledgeEntry {
  return {
    id: String(row["id"]),
    tenantId: String(row["tenant_id"]),
    kind: definition.kind,
    title: String(row["title"]),
    slug: String(row["slug"]),
    description: (row["description"] as string | null) ?? null,
    difficulty: row["difficulty"] as KnowledgeEntry["difficulty"],
    category: (row["category"] as string | null) ?? null,
    tags: Array.isArray(row["tags"]) ? (row["tags"] as string[]) : [],
    thumbnailUrl: (row["thumbnail_url"] as string | null) ?? null,
    coverUrl: (row["cover_url"] as string | null) ?? null,
    status: row["status"] as KnowledgeEntry["status"],
    publishedAt: (row["published_at"] as string | null) ?? null,
    blocks: toBlocks(row["blocks"]),
    createdAt: String(row["created_at"]),
    updatedAt: String(row["updated_at"]),
    extras: toExtras(definition, row),
  };
}

function toPayload(definition: KnowledgeKindDefinition, input: KnowledgeEntryInput): Row {
  const parsed = knowledgeEntryInputSchema.parse(input);
  const payload: Row = {
    title: parsed.title,
    slug: parsed.slug,
    description: parsed.description,
    difficulty: parsed.difficulty,
    category: parsed.category,
    tags: parsed.tags,
    thumbnail_url: parsed.thumbnailUrl,
    cover_url: parsed.coverUrl,
    status: parsed.status,
    published_at:
      parsed.publishedAt ?? (parsed.status === "published" ? new Date().toISOString() : null),
    blocks: parsed.blocks,
  };
  for (const extra of definition.extras) {
    const value = parsed.extras[extra.key];
    payload[extra.column] =
      value === "" || value === undefined
        ? null
        : extra.type === "number" && value !== null
          ? Number(value)
          : value;
  }
  return payload;
}

/** Applies keyword / category / difficulty / tag filters shared by list and search. */
function applyFilters<T extends { eq: unknown }>(query: T, filters: KnowledgeSearchFilters): T {
  type Builder = {
    eq: (column: string, value: unknown) => Builder;
    contains: (column: string, value: unknown) => Builder;
    or: (expression: string) => Builder;
  };
  let builder = query as unknown as Builder;

  if (filters.category) builder = builder.eq("category", filters.category);
  if (filters.difficulty) builder = builder.eq("difficulty", filters.difficulty);
  if (filters.status) builder = builder.eq("status", filters.status);
  if (filters.tag) builder = builder.contains("tags", [filters.tag]);
  if (filters.keyword) {
    const safe = filters.keyword.replace(/[%,()]/g, " ").trim();
    if (safe) {
      builder = builder.or(
        `title.ilike.%${safe}%,slug.ilike.%${safe}%,description.ilike.%${safe}%,category.ilike.%${safe}%`,
      );
    }
  }
  return builder as unknown as T;
}

export async function listEntries(
  kind: KnowledgeKind,
  tenantId: string,
  filters: KnowledgeSearchFilters = {},
): Promise<readonly KnowledgeEntry[]> {
  const scope = `knowledge.${kind}.list`;
  assertTenant(tenantId, scope);
  const definition = getKnowledgeKind(kind);

  const base = knowledgeDb
    .from(definition.table)
    .select(columnsFor(definition))
    .eq("tenant_id", tenantId);

  const { data, error } = await applyFilters(base, filters).order("title", { ascending: true });
  if (error) throw toKnowledgeError(error, scope);
  return ((data ?? []) as unknown as Row[]).map((row) => toEntry(definition, row));
}

export async function getEntryBySlug(
  kind: KnowledgeKind,
  tenantId: string,
  slug: string,
): Promise<KnowledgeEntry | null> {
  const scope = `knowledge.${kind}.get`;
  assertTenant(tenantId, scope);
  const definition = getKnowledgeKind(kind);

  const { data, error } = await knowledgeDb
    .from(definition.table)
    .select(columnsFor(definition))
    .eq("tenant_id", tenantId)
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw toKnowledgeError(error, scope);
  return data ? toEntry(definition, data as unknown as Row) : null;
}

export async function getEntriesByIds(
  kind: KnowledgeKind,
  tenantId: string,
  ids: readonly string[],
): Promise<readonly KnowledgeEntry[]> {
  if (ids.length === 0) return [];
  const scope = `knowledge.${kind}.byIds`;
  assertTenant(tenantId, scope);
  const definition = getKnowledgeKind(kind);

  const { data, error } = await knowledgeDb
    .from(definition.table)
    .select(columnsFor(definition))
    .eq("tenant_id", tenantId)
    .in("id", [...ids]);

  if (error) throw toKnowledgeError(error, scope);
  return ((data ?? []) as unknown as Row[]).map((row) => toEntry(definition, row));
}

export async function createEntry(
  kind: KnowledgeKind,
  tenantId: string,
  input: KnowledgeEntryInput,
): Promise<KnowledgeEntry> {
  const scope = `knowledge.${kind}.create`;
  assertTenant(tenantId, scope);
  const definition = getKnowledgeKind(kind);

  const result = await knowledgeDb
    .from(definition.table)
    .insert({ ...toPayload(definition, input), tenant_id: tenantId })
    .select(columnsFor(definition))
    .single();

  return toEntry(definition, unwrap(result, scope) as unknown as Row);
}

export async function updateEntry(
  kind: KnowledgeKind,
  tenantId: string,
  entryId: string,
  input: KnowledgeEntryInput,
): Promise<KnowledgeEntry> {
  const scope = `knowledge.${kind}.update`;
  assertTenant(tenantId, scope);
  const definition = getKnowledgeKind(kind);

  const result = await knowledgeDb
    .from(definition.table)
    .update(toPayload(definition, input))
    .eq("tenant_id", tenantId)
    .eq("id", entryId)
    .select(columnsFor(definition))
    .single();

  return toEntry(definition, unwrap(result, scope) as unknown as Row);
}

export async function updateEntryStatus(
  kind: KnowledgeKind,
  tenantId: string,
  entryId: string,
  status: KnowledgeEntry["status"],
): Promise<void> {
  const scope = `knowledge.${kind}.status`;
  assertTenant(tenantId, scope);
  const definition = getKnowledgeKind(kind);

  const { error } = await knowledgeDb
    .from(definition.table)
    .update({
      status,
      published_at: status === "published" ? new Date().toISOString() : null,
    })
    .eq("tenant_id", tenantId)
    .eq("id", entryId);

  if (error) throw toKnowledgeError(error, scope);
}

export async function deleteEntry(
  kind: KnowledgeKind,
  tenantId: string,
  entryId: string,
): Promise<void> {
  const scope = `knowledge.${kind}.delete`;
  assertTenant(tenantId, scope);
  const definition = getKnowledgeKind(kind);

  const { error } = await knowledgeDb
    .from(definition.table)
    .delete()
    .eq("tenant_id", tenantId)
    .eq("id", entryId);

  if (error) throw toKnowledgeError(error, scope);
}

/** Distinct categories for the filter bar, derived from the current tenant data. */
export async function listCategories(
  kind: KnowledgeKind,
  tenantId: string,
): Promise<readonly string[]> {
  const scope = `knowledge.${kind}.categories`;
  assertTenant(tenantId, scope);
  const definition = getKnowledgeKind(kind);

  const { data, error } = await knowledgeDb
    .from(definition.table)
    .select("category")
    .eq("tenant_id", tenantId)
    .not("category", "is", null);

  if (error) throw toKnowledgeError(error, scope);
  const unique = new Set(
    ((data ?? []) as unknown as { category: string | null }[])
      .map((row) => row.category)
      .filter((value): value is string => Boolean(value)),
  );
  return [...unique].sort((a, b) => a.localeCompare(b, "id"));
}
