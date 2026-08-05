/**
 * Platform Administration — shared service plumbing.
 * Re-uses the Assessment Domain plumbing so error mapping stays identical.
 */

export {
  assertTenant,
  assertUser,
  toAssessmentError as toPlatformError,
  unwrap,
  unwrapList,
} from "@/modules/assessment/services/assessment-client";

export interface PlatformScope {
  readonly tenantId: string;
  readonly userId: string;
}

/** URL friendly slug used by tenants and CMS blocks. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

/** Human readable byte size, id-ID friendly. */
export function formatBytes(bytes: number | null): string {
  if (!bytes || bytes <= 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

/** Date + time formatting used by audit and announcement surfaces. */
export function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
