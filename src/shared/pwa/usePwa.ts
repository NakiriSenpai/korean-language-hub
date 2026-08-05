import { useCallback, useEffect, useState } from "react";

import { getPwaStatus, onPwaStatusChange, type PwaStatus } from "@/shared/pwa/status";
import { promptInstall, dismissInstallPrompt, type InstallOutcome } from "@/shared/pwa/install";
import { applyPendingUpdate, checkForUpdate } from "@/shared/pwa/update";

export interface UsePwaResult extends PwaStatus {
  readonly install: () => Promise<InstallOutcome>;
  readonly dismissInstall: () => void;
  readonly checkUpdate: () => Promise<boolean>;
  readonly applyUpdate: (reload?: boolean) => Promise<void>;
}

/** Reactive access to the PWA status service. */
export function usePwa(): UsePwaResult {
  const [status, setStatus] = useState<PwaStatus>(getPwaStatus);

  useEffect(() => {
    setStatus(getPwaStatus());
    return onPwaStatusChange(setStatus);
  }, []);

  const install = useCallback(() => promptInstall(), []);
  const dismissInstall = useCallback(() => dismissInstallPrompt(), []);
  const checkUpdate = useCallback(() => checkForUpdate(), []);
  const applyUpdate = useCallback((reload = true) => applyPendingUpdate(reload), []);

  return { ...status, install, dismissInstall, checkUpdate, applyUpdate };
}
