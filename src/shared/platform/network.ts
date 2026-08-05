/**
 * Network detection service. Browser-only APIs are guarded so SSR is safe.
 */

import { logger } from "@/shared/lib/logger";

export type NetworkStatus = "online" | "offline";

export interface NetworkState {
  readonly status: NetworkStatus;
  readonly online: boolean;
  readonly since: number;
}

export type NetworkListener = (state: NetworkState) => void;

const listeners = new Set<NetworkListener>();

let state: NetworkState = { status: "online", online: true, since: 0 };
let bound = false;

const readOnline = (): boolean =>
  typeof navigator === "undefined" ? true : navigator.onLine !== false;

function emit(status: NetworkStatus): void {
  if (state.status === status && state.since !== 0) return;
  state = { status, online: status === "online", since: Date.now() };
  logger.info("Network status changed", { status });
  listeners.forEach((listener) => {
    try {
      listener(state);
    } catch (error) {
      logger.warn("Network listener failed", { error });
    }
  });
}

/** Attaches browser listeners once. Safe to call multiple times. */
export function startNetworkService(): () => void {
  if (typeof window === "undefined") return () => undefined;
  if (!bound) {
    bound = true;
    state = {
      status: readOnline() ? "online" : "offline",
      online: readOnline(),
      since: Date.now(),
    };
    window.addEventListener("online", () => emit("online"));
    window.addEventListener("offline", () => emit("offline"));
  }
  return () => undefined;
}

export function getNetworkState(): NetworkState {
  return state;
}

export function isOnline(): boolean {
  return typeof window === "undefined" ? true : readOnline();
}

export function isOffline(): boolean {
  return !isOnline();
}

/** Subscribes to network changes. Returns an unsubscribe function. */
export function onNetworkChange(listener: NetworkListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const networkService = {
  start: startNetworkService,
  getState: getNetworkState,
  isOnline,
  isOffline,
  subscribe: onNetworkChange,
} as const;
