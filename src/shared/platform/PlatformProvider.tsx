import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { ThemeProvider } from "@/shared/theme";
import { logger } from "@/shared/lib/logger";
import { handleError } from "@/shared/lib/error-handler";
import { platformConfig, type PlatformConfig } from "@/shared/platform/config";
import { validateEnv, type EnvValidationResult } from "@/shared/platform/env";
import { startConnectivityObserver, onConnectivityChange } from "@/shared/platform/connectivity";
import { getNetworkState, startNetworkService } from "@/shared/platform/network";

export interface PlatformContextValue {
  readonly config: PlatformConfig;
  readonly env: EnvValidationResult;
  readonly online: boolean;
  readonly ready: boolean;
}

const PlatformContext = createContext<PlatformContextValue | null>(null);

export interface PlatformProviderProps {
  readonly children: ReactNode;
  /** Rendered instead of children when required environment variables are missing. */
  readonly fallback?: (result: EnvValidationResult) => ReactNode;
  /** Set to false to render the app even when the environment is incomplete. */
  readonly strict?: boolean;
}

/**
 * Single initialisation point of the platform: config, theme, network, logger.
 */
export function PlatformProvider({ children, fallback, strict = false }: PlatformProviderProps) {
  const envResult = useMemo(() => validateEnv(), []);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    if (!envResult.valid) {
      handleError(new Error(envResult.message ?? "Invalid environment."), {
        scope: "platform.env",
      });
    }
    if (envResult.warningMessage) {
      logger.warn(envResult.warningMessage, { scope: "platform.env" });
    }
    startNetworkService();
    setOnline(getNetworkState().online);
    const stop = startConnectivityObserver();
    const unsubscribe = onConnectivityChange((event) => setOnline(event === "restored"));
    logger.info("Platform initialised", {
      mode: platformConfig.env.mode,
      version: platformConfig.build.version,
    });
    return () => {
      unsubscribe();
      stop();
    };
  }, [envResult]);

  const value = useMemo<PlatformContextValue>(
    () => ({ config: platformConfig, env: envResult, online, ready: envResult.valid }),
    [envResult, online],
  );

  const blocked = strict && !envResult.valid;

  return (
    <PlatformContext.Provider value={value}>
      <ThemeProvider>
        {blocked ? (
          fallback ? (
            fallback(envResult)
          ) : (
            <EnvErrorScreen result={envResult} />
          )
        ) : (
          children
        )}
      </ThemeProvider>
    </PlatformContext.Provider>
  );
}

function EnvErrorScreen({ result }: { result: EnvValidationResult }) {
  return (
    <div
      role="alert"
      className="flex min-h-dvh w-full items-center justify-center bg-background p-lg text-foreground"
    >
      <div className="max-w-[52ch] space-y-sm">
        <h1 className="text-heading-md font-semibold">Konfigurasi environment belum lengkap</h1>
        <p className="text-body-sm text-muted-foreground">{result.message}</p>
        <ul className="list-disc space-y-xs pl-lg text-body-sm text-muted-foreground">
          {result.missing.map((name) => (
            <li key={name}>
              <code>{name}</code>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function usePlatform(): PlatformContextValue {
  const context = useContext(PlatformContext);
  if (!context) throw new Error("usePlatform must be used within a PlatformProvider.");
  return context;
}

export function usePlatformConfig(): PlatformConfig {
  return usePlatform().config;
}

export function useOnlineStatus(): boolean {
  return usePlatform().online;
}
