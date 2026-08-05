/**
 * Install prompt service. Uses the official `beforeinstallprompt` event and
 * never shows the prompt on its own — UI decides when to call `promptInstall`.
 */

import { logger } from "@/shared/lib/logger";
import { localStore } from "@/shared/platform/storage";
import { isStandalone, setPwaStatus } from "@/shared/pwa/status";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export type InstallOutcome = "accepted" | "dismissed" | "unavailable";

const DISMISS_KEY = "pwa.install.dismissedAt";
/** Do not re-offer installation for 14 days after a dismissal. */
const DISMISS_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let bound = false;

function dismissedRecently(): boolean {
  const at = localStore.get<number>(DISMISS_KEY);
  return typeof at === "number" && Date.now() - at < DISMISS_COOLDOWN_MS;
}

/** True when a prompt is captured, the app is not installed and not muted. */
export function canPromptInstall(): boolean {
  return deferredPrompt !== null && !isStandalone() && !dismissedRecently();
}

/** Starts listening for install events. Idempotent and SSR safe. */
export function startInstallService(): void {
  if (typeof window === "undefined" || bound) return;
  bound = true;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    setPwaStatus({ installable: canPromptInstall() });
    logger.debug("PWA install prompt captured");
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    localStore.remove(DISMISS_KEY);
    setPwaStatus({ installed: true, installable: false });
    logger.info("PWA installed");
  });

  setPwaStatus({ installed: isStandalone() });
}

/** Shows the native install prompt once. */
export async function promptInstall(): Promise<InstallOutcome> {
  if (!deferredPrompt) return "unavailable";
  const event = deferredPrompt;
  deferredPrompt = null;
  try {
    await event.prompt();
    const { outcome } = await event.userChoice;
    if (outcome === "dismissed") localStore.set(DISMISS_KEY, Date.now());
    setPwaStatus({ installable: false, installed: outcome === "accepted" });
    logger.info("PWA install prompt result", { outcome });
    return outcome;
  } catch (error) {
    logger.warn("PWA install prompt failed", { error });
    return "unavailable";
  }
}

/** Mutes the install prompt for the cooldown period. */
export function dismissInstallPrompt(): void {
  localStore.set(DISMISS_KEY, Date.now());
  setPwaStatus({ installable: false });
}

export const installService = {
  start: startInstallService,
  canPrompt: canPromptInstall,
  prompt: promptInstall,
  dismiss: dismissInstallPrompt,
} as const;
