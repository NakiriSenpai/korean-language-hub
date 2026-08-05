/**
 * Engine 4 — System Settings.
 * Modular: one row per (tenant, category) holding a typed JSON document, so a
 * new setting never needs a schema migration.
 */

import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { assertTenant, unwrap, unwrapList } from "@/modules/platform/services/platform-client";
import type { SettingCategory, SystemSetting } from "@/modules/platform/types";

const SETTINGS_COLUMNS = "id, tenant_id, category, settings, updated_at";

interface SettingRow {
  id: string;
  tenant_id: string;
  category: SettingCategory;
  settings: Json;
  updated_at: string;
}

export type SettingFieldType = "text" | "number" | "boolean" | "select";

export interface SettingField {
  readonly key: string;
  readonly label: string;
  readonly type: SettingFieldType;
  readonly hint?: string;
  readonly options?: readonly { readonly value: string; readonly label: string }[];
  readonly defaultValue: string | number | boolean;
}

export interface SettingSection {
  readonly category: SettingCategory;
  readonly label: string;
  readonly description: string;
  readonly fields: readonly SettingField[];
}

/** Declarative registry — the settings UI renders itself from this list. */
export const SETTING_SECTIONS: readonly SettingSection[] = [
  {
    category: "general",
    label: "Umum",
    description: "Identitas dasar lembaga dan preferensi tampilan.",
    fields: [
      { key: "institutionName", label: "Nama tampilan", type: "text", defaultValue: "" },
      { key: "supportEmail", label: "Email dukungan", type: "text", defaultValue: "" },
      {
        key: "locale",
        label: "Bahasa antarmuka",
        type: "select",
        defaultValue: "id",
        options: [
          { value: "id", label: "Bahasa Indonesia" },
          { value: "ko", label: "한국어" },
        ],
      },
      { key: "timezone", label: "Zona waktu", type: "text", defaultValue: "Asia/Jakarta" },
    ],
  },
  {
    category: "academic",
    label: "Akademik",
    description: "Aturan bawaan untuk periode, kelas, dan pendaftaran.",
    fields: [
      { key: "defaultCapacity", label: "Kapasitas kelas bawaan", type: "number", defaultValue: 20 },
      {
        key: "autoCloseGroups",
        label: "Tutup kelas penuh otomatis",
        type: "boolean",
        defaultValue: true,
      },
      {
        key: "studentNumberPrefix",
        label: "Awalan nomor peserta",
        type: "text",
        defaultValue: "STD",
      },
    ],
  },
  {
    category: "assessment",
    label: "Asesmen",
    description: "Nilai bawaan saat menyusun asesmen baru.",
    fields: [
      { key: "defaultDuration", label: "Durasi bawaan (menit)", type: "number", defaultValue: 60 },
      {
        key: "defaultPassingScore",
        label: "Nilai lulus bawaan (%)",
        type: "number",
        defaultValue: 60,
      },
      {
        key: "randomizeByDefault",
        label: "Acak soal secara bawaan",
        type: "boolean",
        defaultValue: false,
      },
    ],
  },
  {
    category: "learning",
    label: "Pembelajaran",
    description: "Perilaku reader dan pencatatan progres.",
    fields: [
      {
        key: "autoTrackProgress",
        label: "Catat progres otomatis",
        type: "boolean",
        defaultValue: true,
      },
      { key: "completionThreshold", label: "Ambang selesai (%)", type: "number", defaultValue: 90 },
      { key: "allowBookmarks", label: "Izinkan penanda", type: "boolean", defaultValue: true },
    ],
  },
  {
    category: "notification",
    label: "Notifikasi",
    description: "Kanal pemberitahuan internal aplikasi.",
    fields: [
      {
        key: "announcementBanner",
        label: "Tampilkan banner pengumuman",
        type: "boolean",
        defaultValue: true,
      },
      { key: "examReminder", label: "Pengingat ujian", type: "boolean", defaultValue: true },
      {
        key: "digestFrequency",
        label: "Frekuensi ringkasan",
        type: "select",
        defaultValue: "weekly",
        options: [
          { value: "daily", label: "Harian" },
          { value: "weekly", label: "Mingguan" },
          { value: "off", label: "Nonaktif" },
        ],
      },
    ],
  },
  {
    category: "media",
    label: "Media",
    description: "Batas unggahan dan folder penyimpanan Cloudinary.",
    fields: [
      { key: "maxUploadMb", label: "Ukuran maksimum (MB)", type: "number", defaultValue: 25 },
      { key: "defaultFolder", label: "Folder bawaan", type: "text", defaultValue: "hangeul" },
      { key: "allowVideo", label: "Izinkan unggah video", type: "boolean", defaultValue: true },
    ],
  },
];

function toSetting(row: SettingRow): SystemSetting {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    category: row.category,
    settings: (row.settings ?? {}) as Record<string, Json>,
    updatedAt: row.updated_at,
  };
}

export async function listSettings(tenantId: string): Promise<readonly SystemSetting[]> {
  assertTenant(tenantId, "platform.settings.list");
  const rows = unwrapList(
    await supabase.from("system_settings").select(SETTINGS_COLUMNS).eq("tenant_id", tenantId),
    "platform.settings.list",
  ) as readonly SettingRow[];
  return rows.map(toSetting);
}

export async function saveSettings(
  tenantId: string,
  userId: string,
  category: SettingCategory,
  settings: Record<string, Json>,
): Promise<SystemSetting> {
  assertTenant(tenantId, "platform.settings.save");
  const row = unwrap(
    await supabase
      .from("system_settings")
      .upsert(
        { tenant_id: tenantId, category, settings: settings as Json, updated_by: userId },
        { onConflict: "tenant_id,category" },
      )
      .select(SETTINGS_COLUMNS)
      .single(),
    "platform.settings.save",
  ) as SettingRow;
  return toSetting(row);
}

/** Stored values merged over the registry defaults. */
export function resolveSection(
  section: SettingSection,
  stored: readonly SystemSetting[],
): Record<string, string | number | boolean> {
  const saved = stored.find((item) => item.category === section.category)?.settings ?? {};
  const resolved: Record<string, string | number | boolean> = {};
  for (const field of section.fields) {
    const value = saved[field.key];
    resolved[field.key] =
      value === undefined || value === null
        ? field.defaultValue
        : (value as string | number | boolean);
  }
  return resolved;
}
