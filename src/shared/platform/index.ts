/**
 * Platform Foundation — single entry point for the whole application.
 * Every following sprint must consume the platform through this module.
 */

export { platformEnv, validateEnv, assertEnv, ENV_VARIABLE_NAMES } from "@/shared/platform/env";
export type { PlatformEnv, EnvValidationResult } from "@/shared/platform/env";

export { platformConfig } from "@/shared/platform/config";
export type { PlatformConfig, BuildInfo, RuntimeConfig } from "@/shared/platform/config";

export { logger } from "@/shared/lib/logger";
export type { LogLevel, LogContext } from "@/shared/lib/logger";

export { AppError, toAppError, handleError } from "@/shared/lib/error-handler";
export type { AppErrorKind, AppErrorOptions } from "@/shared/lib/error-handler";
export { normalizeError, toUserMessage } from "@/shared/platform/errors";
export type { NormalizedError } from "@/shared/platform/errors";

export {
  createSupabaseClient,
  getSupabaseClient,
  isSupabaseConfigured,
  supabaseRequest,
  toSupabaseError,
} from "@/shared/platform/supabase";
export type { PlatformSupabaseClient, PlatformDatabase } from "@/shared/platform/supabase";

export {
  cloudinary,
  cloudinaryConfig,
  buildCloudinaryUrl,
  buildTransformation,
} from "@/shared/platform/cloudinary";
export type {
  CloudinaryConfig,
  CloudinaryTransform,
  CloudinaryUrlOptions,
  CloudinaryUploader,
  CloudinaryUploadInput,
  CloudinaryUploadResult,
} from "@/shared/platform/cloudinary";

export { http, httpRequest, withTimeout, withRetry, sleep } from "@/shared/platform/http";
export type { HttpRequestOptions, HttpResponse, RetryOptions } from "@/shared/platform/http";

export { storage, localStore, sessionStore } from "@/shared/platform/storage";
export type { TypedStorage, StorageKind } from "@/shared/platform/storage";

export {
  networkService,
  startNetworkService,
  getNetworkState,
  onNetworkChange,
  isOnline,
  isOffline,
} from "@/shared/platform/network";
export type { NetworkState, NetworkStatus, NetworkListener } from "@/shared/platform/network";

export {
  connectivityObserver,
  startConnectivityObserver,
  onConnectivityChange,
  getConnectivitySnapshot,
} from "@/shared/platform/connectivity";
export type {
  ConnectivityEvent,
  ConnectivityListener,
  ConnectivitySnapshot,
} from "@/shared/platform/connectivity";

export {
  PlatformProvider,
  usePlatform,
  usePlatformConfig,
  useOnlineStatus,
} from "@/shared/platform/PlatformProvider";
export type { PlatformContextValue, PlatformProviderProps } from "@/shared/platform/PlatformProvider";
