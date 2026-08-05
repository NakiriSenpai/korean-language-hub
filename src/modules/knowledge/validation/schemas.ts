/**
 * Knowledge Domain — input validation.
 * Slug format, difficulty, and status are enforced here before any write.
 */

import { z } from "zod";

const trimmed = (max: number) =>
  z.string().trim().min(1, "Wajib diisi").max(max, `Maksimal ${max} karakter`);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Maksimal ${max} karakter`)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null));

export const knowledgeDifficultySchema = z.enum(["beginner", "intermediate", "advanced"]);
export const knowledgeStatusSchema = z.enum(["draft", "published", "archived"]);
export const knowledgeKindSchema = z.enum([
  "grammar",
  "vocabulary",
  "conversation",
  "culture_note",
  "eps_reference",
]);

export const knowledgeBlockSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["text", "image", "audio", "video", "quote", "divider", "callout"]),
  position: z.coerce.number().int().min(0).default(0),
  content: z
    .object({
      text: z.string().max(8000).optional(),
      url: z.string().max(1000).optional(),
      alt: z.string().max(300).optional(),
      caption: z.string().max(300).optional(),
      author: z.string().max(160).optional(),
      title: z.string().max(200).optional(),
      tone: z.enum(["info", "success", "warning", "danger"]).optional(),
    })
    .default({}),
});

export const knowledgeEntryInputSchema = z.object({
  title: trimmed(200),
  slug: trimmed(120).regex(/^[a-z0-9-]+$/, "Hanya huruf kecil, angka, dan tanda minus"),
  description: optionalText(1000),
  difficulty: knowledgeDifficultySchema.default("beginner"),
  category: optionalText(120),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  thumbnailUrl: optionalText(1000),
  coverUrl: optionalText(1000),
  status: knowledgeStatusSchema.default("draft"),
  publishedAt: z.string().datetime().nullable().optional(),
  blocks: z.array(knowledgeBlockSchema).max(200).default([]),
  /** Entity specific attributes, validated loosely and mapped by the registry. */
  extras: z.record(z.string(), z.union([z.string(), z.number(), z.null()])).default({}),
});

export const knowledgeFavoriteInputSchema = z.object({
  itemType: knowledgeKindSchema,
  itemId: z.string().uuid("Materi tidak valid"),
  note: optionalText(300),
});

export const knowledgeSearchSchema = z.object({
  keyword: z.string().trim().max(120).optional(),
  category: z.string().trim().max(120).optional(),
  difficulty: z.union([knowledgeDifficultySchema, z.literal("")]).optional(),
  tag: z.string().trim().max(40).optional(),
  kinds: z.array(knowledgeKindSchema).optional(),
  status: z.union([knowledgeStatusSchema, z.literal("")]).optional(),
});

export type KnowledgeEntryInput = z.input<typeof knowledgeEntryInputSchema>;
export type KnowledgeFavoriteInput = z.input<typeof knowledgeFavoriteInputSchema>;
export type KnowledgeSearchInput = z.input<typeof knowledgeSearchSchema>;
