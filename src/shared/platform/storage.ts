/**
 * Type-safe, error-safe abstraction over localStorage and sessionStorage.
 * Values are JSON serialised. Never throws.
 */

import { logger } from "@/shared/lib/logger";
import { platformConfig } from "@/shared/platform/config";

export type StorageKind = "local" | "session";

const resolve = (kind: StorageKind): Storage | null => {
  if (typeof window === "undefined") return null;
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch (error) {
    logger.warn("Storage is not accessible", { kind, error });
    return null;
  }
};

const namespaced = (key: string): string =>
  key.startsWith(`${platformConfig.runtime.storageNamespace}.`)
    ? key
    : `${platformConfig.runtime.storageNamespace}.${key}`;

export interface TypedStorage {
  get<T>(key: string, fallback: T): T;
  set<T>(key: string, value: T): boolean;
  remove(key: string): void;
  has(key: string): boolean;
  clearNamespace(): void;
}

function createStorage(kind: StorageKind): TypedStorage {
  return {
    get<T>(key: string, fallback: T): T {
      const store = resolve(kind);
      if (!store) return fallback;
      try {
        const raw = store.getItem(namespaced(key));
        if (raw === null) return fallback;
        return JSON.parse(raw) as T;
      } catch (error) {
        logger.warn("Failed to read storage value", { kind, key, error });
        return fallback;
      }
    },
    set<T>(key: string, value: T): boolean {
      const store = resolve(kind);
      if (!store) return false;
      try {
        store.setItem(namespaced(key), JSON.stringify(value));
        return true;
      } catch (error) {
        logger.warn("Failed to write storage value", { kind, key, error });
        return false;
      }
    },
    remove(key: string): void {
      const store = resolve(kind);
      if (!store) return;
      try {
        store.removeItem(namespaced(key));
      } catch (error) {
        logger.warn("Failed to remove storage value", { kind, key, error });
      }
    },
    has(key: string): boolean {
      const store = resolve(kind);
      if (!store) return false;
      try {
        return store.getItem(namespaced(key)) !== null;
      } catch {
        return false;
      }
    },
    clearNamespace(): void {
      const store = resolve(kind);
      if (!store) return;
      try {
        const prefix = `${platformConfig.runtime.storageNamespace}.`;
        const keys: string[] = [];
        for (let index = 0; index < store.length; index += 1) {
          const key = store.key(index);
          if (key && key.startsWith(prefix)) keys.push(key);
        }
        keys.forEach((key) => store.removeItem(key));
      } catch (error) {
        logger.warn("Failed to clear storage namespace", { kind, error });
      }
    },
  };
}

export const localStore: TypedStorage = createStorage("local");
export const sessionStore: TypedStorage = createStorage("session");
export const storage = { local: localStore, session: sessionStore } as const;
