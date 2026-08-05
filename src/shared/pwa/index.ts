/**
 * PWA Foundation — single entry point.
 * Every following sprint must consume PWA features through this module.
 */

export { startPwa } from "@/shared/pwa/register";
export { PwaRegistrar } from "@/shared/pwa/PwaRegistrar";

export {
  pwaStatusService,
  getPwaStatus,
  onPwaStatusChange,
  setPwaStatus,
  syncPwaConnectivity,
  isStandalone,
} from "@/shared/pwa/status";
export type { PwaStatus, PwaStatusListener } from "@/shared/pwa/status";

export {
  installService,
  startInstallService,
  canPromptInstall,
  promptInstall,
  dismissInstallPrompt,
} from "@/shared/pwa/install";
export type { InstallOutcome } from "@/shared/pwa/install";

export {
  updateService,
  checkForUpdate,
  applyPendingUpdate,
  markUpdateAvailable,
} from "@/shared/pwa/update";

export { usePwa } from "@/shared/pwa/usePwa";
export type { UsePwaResult } from "@/shared/pwa/usePwa";
