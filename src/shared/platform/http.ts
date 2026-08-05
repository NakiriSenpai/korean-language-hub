/**
 * HTTP foundation: timeout, retry and a thin request wrapper around fetch.
 * No business API calls live here.
 */

import { AppError } from "@/shared/lib/error-handler";
import { logger } from "@/shared/lib/logger";
import { platformConfig } from "@/shared/platform/config";

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/** Rejects with a timeout AppError when the promise does not settle in time. */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = platformConfig.runtime.requestTimeoutMs,
  label = "operation",
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new AppError(`The ${label} timed out after ${timeoutMs}ms.`, { kind: "network" })),
      timeoutMs,
    );
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

export interface RetryOptions {
  readonly attempts?: number;
  readonly baseDelayMs?: number;
  readonly shouldRetry?: (error: unknown, attempt: number) => boolean;
}

/** Retries a task with exponential backoff. Foundation only — no policy per API. */
export async function withRetry<T>(
  task: (attempt: number) => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const attempts = options.attempts ?? platformConfig.runtime.retryAttempts;
  const baseDelayMs = options.baseDelayMs ?? platformConfig.runtime.retryBaseDelayMs;
  const shouldRetry = options.shouldRetry ?? (() => true);

  let lastError: unknown;
  for (let attempt = 0; attempt <= attempts; attempt += 1) {
    try {
      return await task(attempt);
    } catch (error) {
      lastError = error;
      if (attempt === attempts || !shouldRetry(error, attempt)) break;
      const delay = baseDelayMs * 2 ** attempt;
      logger.debug("Retrying after failure", { attempt, delay });
      await sleep(delay);
    }
  }
  throw lastError;
}

export interface HttpRequestOptions extends Omit<RequestInit, "body"> {
  readonly body?: unknown;
  readonly timeoutMs?: number;
  readonly retry?: RetryOptions | false;
  readonly parse?: "json" | "text" | "raw";
}

export interface HttpResponse<T> {
  readonly data: T;
  readonly status: number;
  readonly headers: Headers;
}

/** Thin fetch wrapper with timeout, retry and normalised errors. */
export async function httpRequest<T = unknown>(
  url: string,
  options: HttpRequestOptions = {},
): Promise<HttpResponse<T>> {
  const { body, timeoutMs, retry, parse = "json", headers, ...init } = options;

  const run = async (): Promise<HttpResponse<T>> => {
    const controller = new AbortController();
    const requestHeaders = new Headers(headers);
    let payload: BodyInit | null = null;

    if (body !== undefined) {
      if (typeof body === "string" || body instanceof FormData || body instanceof Blob) {
        payload = body;
      } else {
        payload = JSON.stringify(body);
        if (!requestHeaders.has("content-type")) {
          requestHeaders.set("content-type", "application/json");
        }
      }
    }

    const response = await withTimeout(
      fetch(url, { ...init, headers: requestHeaders, body: payload, signal: controller.signal }),
      timeoutMs ?? platformConfig.runtime.requestTimeoutMs,
      `request to ${url}`,
    ).catch((error: unknown) => {
      controller.abort();
      throw error instanceof AppError
        ? error
        : new AppError("Network request failed.", { kind: "network", cause: error });
    });

    if (!response.ok) {
      throw new AppError(`Request failed with status ${response.status}.`, {
        kind: response.status === 404 ? "notFound" : "network",
        context: { url, status: response.status },
      });
    }

    let data: unknown = response;
    if (parse === "json") data = response.status === 204 ? null : await response.json();
    else if (parse === "text") data = await response.text();

    return { data: data as T, status: response.status, headers: response.headers };
  };

  if (retry === false) return run();
  return withRetry(run, retry ?? {});
}

export const http = {
  get: <T>(url: string, options?: HttpRequestOptions) =>
    httpRequest<T>(url, { ...options, method: "GET" }),
  post: <T>(url: string, body?: unknown, options?: HttpRequestOptions) =>
    httpRequest<T>(url, { ...options, method: "POST", body }),
  put: <T>(url: string, body?: unknown, options?: HttpRequestOptions) =>
    httpRequest<T>(url, { ...options, method: "PUT", body }),
  patch: <T>(url: string, body?: unknown, options?: HttpRequestOptions) =>
    httpRequest<T>(url, { ...options, method: "PATCH", body }),
  delete: <T>(url: string, options?: HttpRequestOptions) =>
    httpRequest<T>(url, { ...options, method: "DELETE" }),
} as const;
