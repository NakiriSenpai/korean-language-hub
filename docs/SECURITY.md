# Security & Operations — Production Hardening (Sprint 10)

## 1. Transport & browser hardening

`src/shared/platform/security.ts` builds the header set; `src/server.ts` applies it to
every HTML response (SSR pages, offline shell, error page). Static assets and the
service worker are intentionally left untouched.

| Header | Purpose |
| --- | --- |
| `content-security-policy` | Restricts script/style/connect origins to self + backend + CDN |
| `x-content-type-options: nosniff` | Blocks MIME sniffing |
| `x-frame-options: DENY` | Blocks clickjacking |
| `referrer-policy` | Limits referrer leakage |
| `permissions-policy` | Disables unused device APIs |
| `strict-transport-security` | HTTPS only (production responses) |

## 2. Database access model

- Row Level Security is enabled on **every** table in `public`.
- The `anon` role has **no** privileges on any table or function. Nothing is readable
  before sign-in; the app is fully authenticated-only.
- `authenticated` holds table privileges; RLS policies then scope every row to the
  user's tenant and role.
- `service_role` retains full access for administrative paths.

### Accepted linter warnings — `SECURITY DEFINER` functions

Four helpers are deliberately executable by signed-in users:

| Function | Why it must stay callable |
| --- | --- |
| `has_tenant_role` | Evaluated inside RLS policies; must bypass RLS to avoid recursion |
| `is_tenant_member` | Same — membership lookup used by policies |
| `shares_tenant_with` | Same — cross-user visibility inside one tenant |
| `create_tenant` | Bootstrap RPC: creates a tenant + owner membership atomically |

Each takes only scalar arguments, never accepts SQL, and pins `search_path = public`.
Every other function (triggers, auditing, capacity enforcement) is now callable only by
`service_role`.

## 3. Session hardening

- Session refresh is scheduled ahead of expiry (`session.service.ts`), and a failed
  refresh downgrades to `expired` rather than silently keeping a dead token.
- Sign-out cancels in-flight queries, clears the React Query cache, wipes the namespaced
  local/session storage, and resets identity state.
- Route protection stays server-agnostic: `_shell.tsx` re-validates via `getUser()`.

## 4. Observability

`src/shared/platform/observability.ts` provides a per-session correlation ID and a
per-request ID, attached to outbound HTTP calls (`x-correlation-id`, `x-request-id`) and
embedded in every structured log envelope. Logs never contain tokens, passwords, or
answer payloads.

## 5. Reliability

- Retries apply only to idempotent methods and only for transient failures
  (network error, timeout, 429, 5xx). Writes are never replayed automatically.
- Health probes (`src/shared/platform/health.ts`) cover environment, database, media CDN,
  and local storage; the Platform Console surfaces them live every 60 seconds.
- Offline behaviour is handled by the PWA shell; the connectivity observer drives UI state.

## 6. Backup & recovery

`src/shared/platform/backup.ts` exports tenant **configuration** only (no learner data)
plus backup metadata, and documents the ordered recovery checklist. Database and media
backups are managed by the hosting providers — there is no bespoke dump job.

## 7. Release checklist

1. `bun run build` — must pass with no warnings from the route generator.
2. Typecheck and lint clean.
3. Health Check page green on the target environment.
4. Sign-in, one lesson, one assessment attempt verified manually.
5. Audit Log receiving entries.
