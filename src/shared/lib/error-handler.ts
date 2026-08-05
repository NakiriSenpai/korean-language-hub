import { logger } from "@/shared/lib/logger";

export type AppErrorKind = "unknown" | "network" | "validation" | "permission" | "notFound";

export interface AppErrorOptions {
  readonly kind?: AppErrorKind;
  readonly cause?: unknown;
  readonly context?: Record<string, unknown>;
}

export class AppError extends Error {
  readonly kind: AppErrorKind;
  readonly context: Record<string, unknown> | undefined;

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = "AppError";
    this.kind = options.kind ?? "unknown";
    this.context = options.context;
  }
}

export const toAppError = (error: unknown): AppError => {
  if (error instanceof AppError) return error;
  if (error instanceof Error) return new AppError(error.message, { cause: error });
  return new AppError("An unexpected error occurred.", { cause: error });
};

/** Single entry point for reporting errors. Reporting transport lands in a later sprint. */
export const handleError = (error: unknown, context?: Record<string, unknown>): AppError => {
  const appError = toAppError(error);
  logger.error(appError.message, { kind: appError.kind, ...appError.context, ...context });
  return appError;
};
