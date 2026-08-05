/**
 * Platform Administration — input validation.
 * Every mutation is validated here before it reaches the database.
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

const hexColor = z
  .string()
  .trim()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Gunakan format warna heks, contoh #1B4D3E")
  .optional()
  .or(z.literal(""))
  .transform((value) => (value && value.length > 0 ? value : null));

const optionalUrl = z
  .string()
  .trim()
  .url("URL tidak valid")
  .max(500)
  .optional()
  .or(z.literal(""))
  .transform((value) => (value && value.length > 0 ? value : null));

export const tenantInputSchema = z.object({
  name: trimmed(120),
  slug: trimmed(50).regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, "Gunakan huruf kecil, angka, dan minus"),
});

export const tenantUpdateSchema = z.object({
  name: trimmed(120),
  logoUrl: optionalUrl,
});

export const brandingInputSchema = z.object({
  logoUrl: optionalUrl,
  coverUrl: optionalUrl,
  primaryColor: hexColor,
  secondaryColor: hexColor,
  contactEmail: z
    .string()
    .trim()
    .email("Email tidak valid")
    .max(255)
    .optional()
    .or(z.literal(""))
    .transform((value) => (value && value.length > 0 ? value : null)),
  contactPhone: optionalText(32),
  address: optionalText(500),
});

export const announcementInputSchema = z
  .object({
    title: trimmed(160),
    body: trimmed(4000),
    audience: z.enum(["platform", "tenant", "study_group"]).default("tenant"),
    studyGroupId: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value && value.length > 0 ? value : null)),
    pinned: z.boolean().default(false),
  })
  .refine((value) => value.audience !== "study_group" || Boolean(value.studyGroupId), {
    message: "Kelas wajib dipilih untuk target kelompok belajar",
    path: ["studyGroupId"],
  });

export const mediaAssetInputSchema = z.object({
  kind: z.enum(["image", "audio", "video", "document"]),
  title: trimmed(160),
  publicId: trimmed(255),
  url: z.string().trim().url("URL tidak valid").max(1000),
  format: optionalText(24),
  bytes: z.number().int().nonnegative().nullable().default(null),
  width: z.number().int().nonnegative().nullable().default(null),
  height: z.number().int().nonnegative().nullable().default(null),
  folder: optionalText(255),
});

export const cmsBlockInputSchema = z.object({
  kind: z.enum(["banner", "carousel", "static_page", "faq"]),
  title: trimmed(160),
  slug: trimmed(120).regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, "Gunakan huruf kecil, angka, dan minus"),
  body: optionalText(8000),
  imageUrl: optionalUrl,
  linkUrl: optionalUrl,
  position: z.coerce.number().int().min(0).max(999).default(0),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
});

export type TenantInput = z.infer<typeof tenantInputSchema>;
export type TenantUpdateInput = z.infer<typeof tenantUpdateSchema>;
export type BrandingInput = z.infer<typeof brandingInputSchema>;
export type AnnouncementInput = z.infer<typeof announcementInputSchema>;
export type MediaAssetInput = z.infer<typeof mediaAssetInputSchema>;
export type CmsBlockInput = z.infer<typeof cmsBlockInputSchema>;
