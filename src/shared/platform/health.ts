/**
 * Engine 6 — Health Check.
 *
 * Lightweight, read-only probes used by the Platform Owner console. Every probe
 * degrades gracefully: a failing dependency reports `down` instead of throwing.
 */

import { getSupabaseClient, isSupabaseConfigured } from "@/shared/platform/supabase";
import { cloudinaryConfig } from "@/shared/platform/cloudinary";
import { platformConfig } from "@/shared/platform/config";
import { validateEnv } from "@/shared/platform/env";
import { localStore } from "@/shared/platform/storage";
import { withTimeout } from "@/shared/platform/http";
import { describeError, observability } from "@/shared/platform/observability";

export type HealthLevel = "ok" | "warn" | "down";

export interface HealthProbeResult {
  readonly id: "platform" | "supabase" | "cloudinary" | "storage";
  readonly label: string;
  readonly level: HealthLevel;
  readonly detail: string;
  readonly latencyMs: number | null;
  readonly checkedAt: string;
}

export interface HealthReport {
  readonly level: HealthLevel;
  readonly checkedAt: string;
  readonly probes: readonly HealthProbeResult[];
}

const PROBE_TIMEOUT_MS = 5_000;

const now = (): string => new Date().toISOString();

function platformProbe(): HealthProbeResult {
  const env = validateEnv();
  return {
    id: "platform",
    label: "Platform",
    level: env.valid ? "ok" : "down",
    detail: env.valid
      ? `Mode ${platformConfig.env.mode}, versi ${platformConfig.build.version}.`
      : (env.message ?? "Konfigurasi environment tidak lengkap."),
    latencyMs: null,
    checkedAt: now(),
  };
}

async function supabaseProbe(): Promise<HealthProbeResult> {
  const startedAt = Date.now();
  if (!isSupabaseConfigured()) {
    return {
      id: "supabase",
      label: "Basis data",
      level: "down",
      detail: "Kredensial basis data belum dikonfigurasi.",
      latencyMs: null,
      checkedAt: now(),
    };
  }
  try {
    const client = getSupabaseClient();
    const { error } = await withTimeout(
      Promise.resolve(
        client.from("role_permissions").select("role", { count: "exact", head: true }),
      ),
      PROBE_TIMEOUT_MS,
      "supabase health probe",
    );
    const latencyMs = Date.now() - startedAt;
    if (error) {
      return {
        id: "supabase",
        label: "Basis data",
        level: "down",
        detail: `Basis data menolak permintaan: ${error.message}`,
        latencyMs,
        checkedAt: now(),
      };
    }
    return {
      id: "supabase",
      label: "Basis data",
      level: latencyMs > 1_500 ? "warn" : "ok",
      detail: `Terhubung dalam ${latencyMs} ms.`,
      latencyMs,
      checkedAt: now(),
    };
  } catch (error) {
    observability.warn("Supabase health probe failed", describeError(error));
    return {
      id: "supabase",
      label: "Basis data",
      level: "down",
      detail: "Basis data tidak dapat dihubungi.",
      latencyMs: Date.now() - startedAt,
      checkedAt: now(),
    };
  }
}

async function cloudinaryProbe(): Promise<HealthProbeResult> {
  const startedAt = Date.now();
  if (!cloudinaryConfig.cloudName || !cloudinaryConfig.uploadPreset) {
    return {
      id: "cloudinary",
      label: "Media",
      level: "down",
      detail: "Konfigurasi penyedia media belum lengkap.",
      latencyMs: null,
      checkedAt: now(),
    };
  }
  if (typeof window === "undefined") {
    return {
      id: "cloudinary",
      label: "Media",
      level: "ok",
      detail: `Cloud ${cloudinaryConfig.cloudName} terkonfigurasi.`,
      latencyMs: null,
      checkedAt: now(),
    };
  }
  try {
    // A 1×1 delivery request is the cheapest reachability signal available
    // without credentials; `no-cors` keeps it free of preflight overhead.
    await withTimeout(
      fetch(
        `https://res.cloudinary.com/${cloudinaryConfig.cloudName}/image/upload/w_1,h_1/sample.jpg`,
        { method: "GET", mode: "no-cors", cache: "no-store" },
      ),
      PROBE_TIMEOUT_MS,
      "cloudinary health probe",
    );
    const latencyMs = Date.now() - startedAt;
    return {
      id: "cloudinary",
      label: "Media",
      level: latencyMs > 2_000 ? "warn" : "ok",
      detail: `CDN merespons dalam ${latencyMs} ms.`,
      latencyMs,
      checkedAt: now(),
    };
  } catch (error) {
    observability.warn("Cloudinary health probe failed", describeError(error));
    return {
      id: "cloudinary",
      label: "Media",
      level: "warn",
      detail: "CDN media tidak merespons; unggahan mungkin terganggu.",
      latencyMs: Date.now() - startedAt,
      checkedAt: now(),
    };
  }
}

function storageProbe(): HealthProbeResult {
  if (typeof window === "undefined") {
    return {
      id: "storage",
      label: "Penyimpanan lokal",
      level: "ok",
      detail: "Tidak berlaku pada sisi server.",
      latencyMs: null,
      checkedAt: now(),
    };
  }
  const key = "health.probe";
  const written = localStore.set(key, { at: Date.now() });
  const readBack = localStore.get<{ at: number } | null>(key, null);
  localStore.remove(key);
  const healthy = written && readBack !== null;
  return {
    id: "storage",
    label: "Penyimpanan lokal",
    level: healthy ? "ok" : "down",
    detail: healthy
      ? "Baca dan tulis penyimpanan lokal berhasil."
      : "Penyimpanan lokal tidak dapat digunakan (mode privat atau kuota penuh).",
    latencyMs: null,
    checkedAt: now(),
  };
}

const WORST: Record<HealthLevel, number> = { ok: 0, warn: 1, down: 2 };

/** Runs every probe in parallel and aggregates the worst level. */
export async function runHealthChecks(): Promise<HealthReport> {
  const probes = await Promise.all([
    Promise.resolve(platformProbe()),
    supabaseProbe(),
    cloudinaryProbe(),
    Promise.resolve(storageProbe()),
  ]);

  const level = probes.reduce<HealthLevel>(
    (worst, probe) => (WORST[probe.level] > WORST[worst] ? probe.level : worst),
    "ok",
  );

  return { level, checkedAt: now(), probes };
}
