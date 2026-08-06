# Architecture

## Stack

- **Framework**: TanStack Start v1 (React 19, SSR + file-based routing) on Vite 7.
- **Styling**: Tailwind CSS v4 with OKLCH design tokens declared in `src/styles.css`.
- **Data**: TanStack Query v5 over a Supabase (PostgreSQL) backend with Row Level Security.
- **Delivery**: Edge worker runtime; PWA via `vite-plugin-pwa` (Workbox `generateSW`).

## Layering

```
src/
  routes/            file-based routes; `_shell.*` = authenticated app shell
  modules/<domain>/  one folder per business domain
    components/      domain UI
    config/          permissions, registries
    hooks/           React Query hooks (the only React entry point)
    services/        data access + pure domain logic
    types/           domain types
    validation/      Zod schemas
    index.ts         public surface of the domain
  shared/            cross-domain foundation
    platform/        env, config, http, storage, security, observability, health, backup
    components/      layout primitives, shell, form primitives
    design/, theme/  tokens and theme engine
    pwa/             registration, install, update, status
```

Rules enforced across sprints:

- Routes import domains only through `@/modules/<domain>` barrels.
- Domains never import each other's internals; shared logic lives in `src/shared`.
- Services never import React; hooks never contain SQL/query construction.

## Domains

| Domain       | Responsibility                                                                     |
| ------------ | ---------------------------------------------------------------------------------- |
| `identity`   | Auth, session manager, tenant membership, roles, permission matrix                 |
| `academic`   | Academic periods, study groups, enrollments, student profiles, teacher assignments |
| `learning`   | Course → module → lesson → unit → block content, progress, bookmarks               |
| `knowledge`  | Grammar, vocabulary, conversation, culture entries, search, favorites              |
| `assessment` | Question bank with immutable versioning, assessments, publish snapshots            |
| `exam`       | Snapshot-only loader, attempt lifecycle, scoring engine, review                    |
| `analytics`  | Denormalized datasets, aggregation, filters, XLSX/PDF/CSV export                   |
| `platform`   | Console, tenants, branding, settings, audit log, announcements, media, CMS         |

## Multi-tenancy & security

Every business table carries `tenant_id`. RLS policies resolve access through the
`SECURITY DEFINER` helpers `is_tenant_member`, `has_tenant_role` and `shares_tenant_with`. The
`anon` role holds no privileges anywhere — the platform is authenticated-only. Details in
[SECURITY.md](./SECURITY.md).

## Request lifecycle

1. Edge worker (`src/server.ts`) serves the document and applies security headers/CSP.
2. `PlatformProvider` validates the environment, starts network/connectivity observers.
3. `IdentityProvider` restores the session, loads profile, memberships and permission matrix.
4. `_shell.tsx` re-validates the session and gates the route; `PermissionGate` gates UI.
5. Domain hooks fetch through TanStack Query (`staleTime` 30s, `gcTime` 5m).
