/**
 * Cloudinary foundation: config, URL builder, transformation helper,
 * upload helper interface. No uploading happens here.
 */

import { AppError } from "@/shared/lib/error-handler";
import { platformEnv } from "@/shared/platform/env";

export interface CloudinaryConfig {
  readonly cloudName: string;
  readonly uploadPreset: string;
  readonly baseUrl: string;
  readonly configured: boolean;
}

export const cloudinaryConfig: CloudinaryConfig = {
  cloudName: platformEnv.cloudinaryCloudName,
  uploadPreset: platformEnv.cloudinaryUploadPreset,
  baseUrl: "https://res.cloudinary.com",
  configured:
    platformEnv.cloudinaryCloudName.length > 0 && platformEnv.cloudinaryUploadPreset.length > 0,
};

export type CloudinaryResourceType = "image" | "video" | "raw";
export type CloudinaryCrop = "fill" | "fit" | "scale" | "thumb" | "limit";
export type CloudinaryFormat = "auto" | "webp" | "avif" | "jpg" | "png" | "mp4";

export interface CloudinaryTransform {
  readonly width?: number;
  readonly height?: number;
  readonly crop?: CloudinaryCrop;
  readonly quality?: number | "auto";
  readonly format?: CloudinaryFormat;
  readonly gravity?: "auto" | "face" | "center";
  readonly dpr?: number | "auto";
}

/** Builds the Cloudinary transformation segment, e.g. `w_400,c_fill,q_auto`. */
export function buildTransformation(transform: CloudinaryTransform = {}): string {
  const parts: string[] = [];
  if (transform.width !== undefined) parts.push(`w_${transform.width}`);
  if (transform.height !== undefined) parts.push(`h_${transform.height}`);
  if (transform.crop) parts.push(`c_${transform.crop}`);
  if (transform.gravity) parts.push(`g_${transform.gravity}`);
  if (transform.quality !== undefined) parts.push(`q_${transform.quality}`);
  if (transform.format) parts.push(`f_${transform.format}`);
  if (transform.dpr !== undefined) parts.push(`dpr_${transform.dpr}`);
  return parts.join(",");
}

export interface CloudinaryUrlOptions extends CloudinaryTransform {
  readonly resourceType?: CloudinaryResourceType;
}

/** Builds a delivery URL for a public id. Throws when Cloudinary is unconfigured. */
export function buildCloudinaryUrl(publicId: string, options: CloudinaryUrlOptions = {}): string {
  if (!cloudinaryConfig.configured) {
    throw new AppError("Cloudinary environment is not configured.", { kind: "validation" });
  }
  const id = publicId.replace(/^\/+/, "");
  const { resourceType = "image", ...transform } = options;
  const segment = buildTransformation(transform);
  const path = [
    cloudinaryConfig.baseUrl,
    cloudinaryConfig.cloudName,
    resourceType,
    "upload",
    segment,
    id,
  ].filter((part) => part.length > 0);
  return path.join("/");
}

export interface CloudinaryUploadInput {
  readonly file: File | Blob;
  readonly folder?: string;
  readonly publicId?: string;
  readonly resourceType?: CloudinaryResourceType;
}

export interface CloudinaryUploadResult {
  readonly publicId: string;
  readonly secureUrl: string;
  readonly width?: number;
  readonly height?: number;
  readonly format?: string;
  readonly bytes?: number;
}

/** Contract for the uploader implemented in a later sprint. */
export interface CloudinaryUploader {
  upload(input: CloudinaryUploadInput): Promise<CloudinaryUploadResult>;
}

/** Cloudinary service facade — foundation surface only. */
export const cloudinary = {
  config: cloudinaryConfig,
  url: buildCloudinaryUrl,
  transform: buildTransformation,
  isConfigured: (): boolean => cloudinaryConfig.configured,
} as const;
