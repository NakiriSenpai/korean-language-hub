/**
 * PWA status service — single source of truth for install/offline/update state.
 * Framework agnostic, tree-shakable, SSR safe.
 */

import { logger } from "@/shared/lib/logger";
import { getNetworkState, onNetworkChange, startNetworkService } from "@/shared/platform/network";

export interface PwaStatus {
  /** App is running as an installed PWA (standalone display). */
  readonly installed: boolean;
  /** A browser install prompt has been captured and can be shown. */
  readonly installable: boolean;
  readonly online: boolean;
  readonly offline: boolean;
  /** A new service worker version is waiting to be activated. */
  readonly updateAvailable: boolean;
  /** Service worker registration succeeded. */
  readonly registered: boolean;
}

export type PwaStatusListener = (status: PwaStatus) => void;

const listeners = new Set<PwaStatusListener>();

let status: PwaStatus = {
  installed: false,
  installable: false,
  online: true,
  offline: false,
  updateAvailable: false,
  registered: false,
};

/** True when the document is displayed as an installed application. */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches ||
    iosStandalone === true
  );
}

export function getPwaStatus(): PwaStatus {
  return status;
}

export function setPwaStatus(patch: Partial<PwaStatus>): void {
  const next: PwaStatus = { ...status, ...patch };
  const normalised: PwaStatus = { ...next, offline: !next.online };
  const changed = (Object.keys(normalised) as (keyof PwaStatus)[]).some(
    (key) => normalised[key] !== status[key],
  );
  if (!changed) return;
  status = normalised;
  listeners.forEach((listener) => {
    try {
      listener(status);
    } catch (error) {
      logger.warn("PWA status listener failed", { error });
    }
  });
}

export function onPwaStatusChange(listener: PwaStatusListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

let connectivityBound = false;

/**
 * Keeps PWA status in sync with the platform network service.
 * Idempotent — safe to call from several entry points.
 */
export function syncPwaConnectivity(): void {
  if (typeof window === "undefined" || connectivityBound) return;
  connectivityBound = true;
  startNetworkService();
  setPwaStatus({ online: getNetworkState().online, installed: isStandalone() });
  onNetworkChange((state) => setPwaStatus({ online: state.online }));
}

export const pwaStatusService = {
  get: getPwaStatus,
  set: setPwaStatus,
  subscribe: onPwaStatusChange,
  syncConnectivity: syncPwaConnectivity,
  isStandalone,
} as const;
