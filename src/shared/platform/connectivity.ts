/**
 * Global connectivity observer. Notifies the app when the connection is lost
 * or restored. No UI is rendered here.
 */

import { logger } from "@/shared/lib/logger";
import {
  getNetworkState,
  onNetworkChange,
  startNetworkService,
  type NetworkState,
} from "@/shared/platform/network";

export type ConnectivityEvent = "lost" | "restored";

export interface ConnectivitySnapshot {
  readonly online: boolean;
  readonly lastChangeAt: number;
  readonly wasOffline: boolean;
}

export type ConnectivityListener = (event: ConnectivityEvent, state: NetworkState) => void;

const listeners = new Set<ConnectivityListener>();

let wasOffline = false;
let stop: (() => void) | null = null;

/** Starts observing connectivity. Returns a stop function. */
export function startConnectivityObserver(): () => void {
  if (stop) return stop;
  startNetworkService();

  const unsubscribe = onNetworkChange((state) => {
    const event: ConnectivityEvent = state.online ? "restored" : "lost";
    if (!state.online) wasOffline = true;
    logger.debug("Connectivity event", { event });
    listeners.forEach((listener) => {
      try {
        listener(event, state);
      } catch (error) {
        logger.warn("Connectivity listener failed", { error });
      }
    });
  });

  stop = () => {
    unsubscribe();
    stop = null;
  };
  return stop;
}

export function onConnectivityChange(listener: ConnectivityListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getConnectivitySnapshot(): ConnectivitySnapshot {
  const state = getNetworkState();
  return { online: state.online, lastChangeAt: state.since, wasOffline };
}

export const connectivityObserver = {
  start: startConnectivityObserver,
  subscribe: onConnectivityChange,
  snapshot: getConnectivitySnapshot,
} as const;
