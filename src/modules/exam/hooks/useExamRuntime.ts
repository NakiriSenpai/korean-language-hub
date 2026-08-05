/**
 * Engine 3 — Exam Runtime timer + Engine 8 — auto save and exit guard.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface ExamTimerState {
  readonly remainingSeconds: number;
  readonly elapsedSeconds: number;
  readonly expired: boolean;
  readonly label: string;
  readonly hasDeadline: boolean;
}

function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

/** Countdown driven by the attempt deadline stored on the server. */
export function useExamTimer(
  startedAt: string | null | undefined,
  expiresAt: string | null | undefined,
  onExpire?: () => void,
): ExamTimerState {
  const [now, setNow] = useState(() => Date.now());
  const firedRef = useRef(false);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const deadline = expiresAt ? new Date(expiresAt).getTime() : null;
  const started = startedAt ? new Date(startedAt).getTime() : null;
  const remainingSeconds = deadline ? Math.max(0, Math.floor((deadline - now) / 1000)) : 0;
  const expired = deadline !== null && remainingSeconds <= 0;

  useEffect(() => {
    if (expired && !firedRef.current) {
      firedRef.current = true;
      onExpire?.();
    }
  }, [expired, onExpire]);

  return useMemo(
    () => ({
      remainingSeconds,
      elapsedSeconds: started ? Math.max(0, Math.floor((now - started) / 1000)) : 0,
      expired,
      hasDeadline: deadline !== null,
      label: deadline ? formatClock(remainingSeconds) : formatClock(started ? Math.floor((now - started) / 1000) : 0),
    }),
    [deadline, expired, now, remainingSeconds, started],
  );
}

/** Periodic auto save heartbeat (Engine 8). */
export function useAutoSave(enabled: boolean, intervalMs: number, onSave: () => void): void {
  const saveRef = useRef(onSave);
  saveRef.current = onSave;

  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => saveRef.current(), intervalMs);
    return () => window.clearInterval(id);
  }, [enabled, intervalMs]);
}

/** Warns before leaving the page while an attempt is open (Engine 8). */
export function useExitGuard(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [enabled]);
}

/** Optional fullscreen helper — silently degrades when unsupported. */
export function useFullscreen(): { supported: boolean; active: boolean; toggle: () => void } {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const handler = () => setActive(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const supported = typeof document !== "undefined" && Boolean(document.documentElement?.requestFullscreen);

  const toggle = useCallback(() => {
    if (!supported) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
    } else {
      void document.documentElement.requestFullscreen().catch(() => undefined);
    }
  }, [supported]);

  return { supported, active, toggle };
}
