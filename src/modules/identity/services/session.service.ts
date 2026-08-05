/**
 * Session Manager — active session, refresh scheduling, expiry, cleanup.
 * Built on top of the auth service; it never talks to the provider directly.
 */

import type { Session } from "@supabase/supabase-js";

import { logger } from "@/shared/platform";
import { refreshSession, restoreSession } from "@/modules/identity/services/auth.service";

export type SessionEvent = "restored" | "updated" | "refreshed" | "expired" | "cleared";
export type SessionListener = (event: SessionEvent, session: Session | null) => void;

/** Refresh this many milliseconds before the token actually expires. */
const REFRESH_LEEWAY_MS = 60_000;
const MIN_REFRESH_DELAY_MS = 5_000;

let current: Session | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<SessionListener>();

const emit = (event: SessionEvent, session: Session | null): void => {
  listeners.forEach((listener) => listener(event, session));
};

const clearTimer = (): void => {
  if (timer !== null) {
    clearTimeout(timer);
    timer = null;
  }
};

const expiresInMs = (session: Session): number => {
  const expiresAt = session.expires_at;
  if (!expiresAt) return Number.POSITIVE_INFINITY;
  return expiresAt * 1000 - Date.now();
};

const scheduleRefresh = (session: Session): void => {
  clearTimer();
  if (typeof window === "undefined") return;
  const remaining = expiresInMs(session);
  if (!Number.isFinite(remaining)) return;

  if (remaining <= 0) {
    emit("expired", null);
    current = null;
    return;
  }

  timer = setTimeout(
    () => {
      void sessionManager.refresh();
    },
    Math.max(MIN_REFRESH_DELAY_MS, remaining - REFRESH_LEEWAY_MS),
  );
};

export const sessionManager = {
  /** Restores the persisted session on boot. */
  async start(): Promise<Session | null> {
    const session = await restoreSession();
    current = session;
    if (session) {
      scheduleRefresh(session);
      emit("restored", session);
    }
    return session;
  },

  /** Called by the auth listener whenever the provider reports a new session. */
  set(session: Session | null, event: SessionEvent = "updated"): void {
    current = session;
    if (session) scheduleRefresh(session);
    else clearTimer();
    emit(event, session);
  },

  get(): Session | null {
    return current;
  },

  isActive(): boolean {
    return current !== null && expiresInMs(current) > 0;
  },

  isExpired(): boolean {
    return current !== null && expiresInMs(current) <= 0;
  },

  async refresh(): Promise<Session | null> {
    const session = await refreshSession();
    if (!session) {
      logger.warn("Session refresh failed — treating session as expired");
      current = null;
      clearTimer();
      emit("expired", null);
      return null;
    }
    current = session;
    scheduleRefresh(session);
    emit("refreshed", session);
    return session;
  },

  /** Removes every trace of the session from memory and timers. */
  cleanup(): void {
    clearTimer();
    current = null;
    emit("cleared", null);
  },

  subscribe(listener: SessionListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
} as const;
