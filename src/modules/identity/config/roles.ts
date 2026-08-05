/**
 * Role foundation. Roles are data, not hardcoded checks in components.
 */

import type { AppRole } from "@/modules/identity/types";

export interface RoleDefinition {
  readonly id: AppRole;
  readonly label: string;
  readonly description: string;
  /** Higher rank = broader authority. Used only for ordering/display. */
  readonly rank: number;
}

export const ROLES: Readonly<Record<AppRole, RoleDefinition>> = {
  owner: {
    id: "owner",
    label: "Pemilik",
    description: "Pemilik lembaga dengan akses penuh terhadap seluruh konfigurasi.",
    rank: 50,
  },
  admin: {
    id: "admin",
    label: "Admin",
    description: "Mengelola operasional lembaga, pengguna, dan konten.",
    rank: 40,
  },
  instructor: {
    id: "instructor",
    label: "Instruktur",
    description: "Mengelola materi, latihan, dan penilaian peserta.",
    rank: 30,
  },
  staff: {
    id: "staff",
    label: "Staf",
    description: "Akses baca untuk mendukung operasional harian.",
    rank: 20,
  },
  student: {
    id: "student",
    label: "Peserta",
    description: "Mengikuti pembelajaran dan ujian.",
    rank: 10,
  },
};

export const ROLE_LIST: readonly RoleDefinition[] = Object.values(ROLES).sort(
  (a, b) => b.rank - a.rank,
);

export const getRole = (role: AppRole | null | undefined): RoleDefinition | null =>
  role ? (ROLES[role] ?? null) : null;
