/**
 * Single, guarded service worker registration wrapper.
 * The service worker never registers in dev, in an iframe, or in Lovable
 * preview hosts — those contexts unregister any stale worker instead.
 */

import { logger } from "@/shared/lib/logger";
import { setPwaStatus, syncPwaConnectivity } from "@/shared/pwa/status";
import { markUpdateAvailable, setRegistration, setUpdateHandler } from "@/shared/pwa/update";
import { startInstallService } from "@/shared/pwa/install";

const SW_URL = "/sw.js";

function isPreviewHost(hostname: string): boolean {
  return (
    hostname.startsWith("id-preview--") ||
    hostname.startsWith("preview--") ||
    hostname === "lovableproject.com" ||
    hostname.endsWith(".lovableproject.com") ||
    hostname === "lovableproject-dev.com" ||
    hostname.endsWith(".lovableproject-dev.com") ||
    hostname === "beta.lovable.dev" ||
    hostname.endsWith(".beta.lovable.dev")
  );
}

function shouldRegister(): boolean {
  if (typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator)) return false;
  if (!import.meta.env.PROD) return false;
  if (window.self !== window.top) return false;
  if (isPreviewHost(window.location.hostname)) return false;
  if (new URL(window.location.href).searchParams.get("sw") === "off") return false;
  return true;
}

async function unregisterExisting(): Promise<void> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.allSettled(
      registrations
        .filter((item) =>
          (item.active ?? item.waiting ?? item.installing)?.scriptURL.endsWith(SW_URL),
        )
        .map((item) => item.unregister()),
    );
  } catch (error) {
    logger.warn("Failed to unregister service worker", { error });
  }
}

let started = false;

/**
 * Entry point of the PWA foundation. Non-blocking: registration is deferred
 * until the page is idle so startup performance is untouched.
 */
export function startPwa(): void {
  if (typeof window === "undefined" || started) return;
  started = true;

  syncPwaConnectivity();
  startInstallService();

  if (!shouldRegister()) {
    void unregisterExisting();
    return;
  }

  const run = async () => {
    try {
      const { registerSW } = await import("virtual:pwa-register");
      const updateSW = registerSW({
        immediate: true,
        onNeedRefresh: markUpdateAvailable,
        onOfflineReady: () => logger.info("PWA offline shell ready"),
        onRegisteredSW: (_url, registration) => {
          setRegistration(registration ?? null);
          setPwaStatus({ registered: true });
        },
        onRegisterError: (error) => logger.warn("Service worker registration failed", { error }),
      });
      setUpdateHandler(updateSW);
    } catch (error) {
      logger.warn("PWA bootstrap failed", { error });
    }
  };

  const idle = window.requestIdleCallback?.bind(window);
  if (idle) idle(() => void run(), { timeout: 3000 });
  else window.setTimeout(() => void run(), 1200);
}
