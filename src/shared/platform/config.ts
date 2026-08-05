/**
 * Global platform configuration: app metadata, environment, build info, runtime.
 * Everything the platform needs is read from here.
 */

import { appConfig, type AppConfig } from "@/shared/config/app.config";
import { APP_DEFAULTS, APP_META } from "@/shared/constants";
import { platformEnv, type PlatformEnv } from "@/shared/platform/env";

export interface BuildInfo {
  readonly version: string;
  readonly mode: string;
  readonly builtAt: string;
}

export interface RuntimeConfig {
  readonly isServer: boolean;
  readonly isBrowser: boolean;
  readonly debug: boolean;
  readonly requestTimeoutMs: number;
  readonly retryAttempts: number;
  readonly retryBaseDelayMs: number;
  readonly storageNamespace: string;
}

export interface PlatformConfig {
  readonly app: AppConfig;
  readonly env: PlatformEnv;
  readonly build: BuildInfo;
  readonly runtime: RuntimeConfig;
}

const BUILT_AT = new Date(0).toISOString();

export const platformConfig: PlatformConfig = {
  app: appConfig,
  env: platformEnv,
  build: {
    version: APP_META.version,
    mode: platformEnv.mode,
    builtAt: BUILT_AT,
  },
  runtime: {
    isServer: platformEnv.isServer,
    isBrowser: !platformEnv.isServer,
    debug: !platformEnv.isProduction,
    requestTimeoutMs: APP_DEFAULTS.requestTimeoutMs,
    retryAttempts: 2,
    retryBaseDelayMs: 300,
    storageNamespace: "hangeul-lpk",
  },
};
