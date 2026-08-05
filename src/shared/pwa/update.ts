/**
 * Service worker update service. Detects a waiting worker and exposes the
 * state through the PWA status service. Never reloads automatically.
 */

import { logger } from "@/shared/lib/logger";
import { setPwaStatus } from "@/shared/pwa/status";

type UpdateFn = (reloadPage?: boolean) => Promise<void>;

let applyUpdate: UpdateFn | null = null;
let registration: ServiceWorkerRegistration | null = null;

/** Wires the update callback produced by the registration wrapper. */
export function setUpdateHandler(fn: UpdateFn | null): void {
  applyUpdate = fn;
}

export function setRegistration(value: ServiceWorkerRegistration | null): void {
  registration = value;
  setPwaStatus({ registered: value !== null });
  if (value?.waiting) markUpdateAvailable();
}

export function markUpdateAvailable(): void {
  logger.info("PWA update available");
  setPwaStatus({ updateAvailable: true });
}

/** Manually asks the browser to look for a new service worker version. */
export async function checkForUpdate(): Promise<boolean> {
  if (!registration) return false;
  try {
    await registration.update();
    return registration.waiting !== null;
  } catch (error) {
    logger.warn("PWA update check failed", { error });
    return false;
  }
}

/**
 * Activates the waiting worker. The caller decides whether to reload,
 * so users are never interrupted without consent.
 */
export async function applyPendingUpdate(reload = true): Promise<void> {
  if (!applyUpdate) return;
  await applyUpdate(reload);
  setPwaStatus({ updateAvailable: false });
}

export const updateService = {
  check: checkForUpdate,
  apply: applyPendingUpdate,
  setHandler: setUpdateHandler,
  setRegistration,
  markAvailable: markUpdateAvailable,
} as const;
