/**
 * Engine 4 — Observability foundation.
 *
 * Provides a correlation ID for the browser session, a per-request ID for every
 * outbound call, and a structured logging helper that always emits the same
 * envelope. No external monitoring SaaS is wired in — this is the local
 * foundation such an integration would later consume.
 */

import { logger, type LogContext, type LogLevel } from "@/shared/lib/logger";
import { platformConfig } from "@/shared/platform/config";

export const CORRELATION_HEADER = "x-correlation-id";
export const REQUEST_HEADER = "x-request-id";

/** RFC4122-ish identifier that works in every runtime we target. */
export function createId(): string {
  const cryptoRef = globalThis.crypto as Crypto | undefined;
  if (cryptoRef?.randomUUID) return cryptoRef.randomUUID();
  return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

let correlationId: string | null = null;

/** Stable per-session identifier shared by every log line and request. */
export function getCorrelationId(): string {
  if (!correlationId) correlationId = createId();
  return correlationId;
}

/** Overrides the correlation ID (e.g. propagated from an inbound request). */
export function setCorrelationId(value: string): void {
  correlationId = value;
}

/** Fresh identifier for a single operation. */
export function createRequestId(): string {
  return createId();
}

export interface TelemetryEnvelope extends LogContext {
  readonly correlationId: string;
  readonly requestId?: string;
  readonly mode: string;
  readonly version: string;
  readonly runtime: "server" | "browser";
  readonly at: string;
}

/** Wraps any context into the standard structured-logging envelope. */
export function withTelemetry(context?: LogContext, requestId?: string): TelemetryEnvelope {
  return {
    ...context,
    correlationId: getCorrelationId(),
    ...(requestId ? { requestId } : {}),
    mode: platformConfig.env.mode,
    version: platformConfig.build.version,
    runtime: platformConfig.runtime.isServer ? "server" : "browser",
    at: new Date().toISOString(),
  };
}

/** Structured logger: same API surface as `logger`, richer payload. */
export const observability = {
  log(level: LogLevel, message: string, context?: LogContext, requestId?: string): void {
    logger[level](message, withTelemetry(context, requestId));
  },
  debug: (message: string, context?: LogContext) => logger.debug(message, withTelemetry(context)),
  info: (message: string, context?: LogContext) => logger.info(message, withTelemetry(context)),
  warn: (message: string, context?: LogContext) => logger.warn(message, withTelemetry(context)),
  error: (message: string, context?: LogContext) => logger.error(message, withTelemetry(context)),

  /** Times an operation and logs its outcome with a dedicated request ID. */
  async trace<T>(scope: string, task: (requestId: string) => Promise<T>): Promise<T> {
    const requestId = createRequestId();
    const startedAt = Date.now();
    try {
      const result = await task(requestId);
      logger.debug(
        `${scope} ok`,
        withTelemetry({ scope, durationMs: Date.now() - startedAt }, requestId),
      );
      return result;
    } catch (error) {
      logger.error(
        `${scope} failed`,
        withTelemetry(
          { scope, durationMs: Date.now() - startedAt, error: describeError(error) },
          requestId,
        ),
      );
      throw error;
    }
  },
} as const;

/** Safe, PII-free description of a thrown value for log payloads. */
export function describeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return { name: error.name, message: error.message };
  }
  return { name: "Unknown", message: String(error) };
}
