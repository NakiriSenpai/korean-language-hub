/** Shared cross-domain types. */

export type Nullable<T> = T | null;

export type ID = string;

export interface TenantScoped {
  readonly tenantId: ID;
}

export interface Timestamped {
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface Paginated<T> {
  readonly items: readonly T[];
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
}

export type AsyncStatus = "idle" | "loading" | "success" | "error";
