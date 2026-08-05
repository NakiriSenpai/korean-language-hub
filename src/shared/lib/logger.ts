import { appConfig } from "@/shared/config/app.config";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  readonly [key: string]: unknown;
}

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const minLevel: LogLevel = appConfig.debug ? "debug" : "warn";

const shouldLog = (level: LogLevel): boolean => LEVEL_ORDER[level] >= LEVEL_ORDER[minLevel];

const write = (level: LogLevel, message: string, context?: LogContext): void => {
  if (!shouldLog(level)) return;
  const prefix = `[${appConfig.name}][${level}]`;
  const payload = context ? [prefix, message, context] : [prefix, message];
  if (level === "error") console.error(...payload);
  else if (level === "warn") console.warn(...payload);
  else console.info(...payload);
};

export const logger = {
  debug: (message: string, context?: LogContext) => write("debug", message, context),
  info: (message: string, context?: LogContext) => write("info", message, context),
  warn: (message: string, context?: LogContext) => write("warn", message, context),
  error: (message: string, context?: LogContext) => write("error", message, context),
} as const;
