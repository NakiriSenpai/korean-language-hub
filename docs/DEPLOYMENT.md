# Deployment

## Build

```bash
bun install
bun run build      # production build (Vite + Nitro edge worker + PWA precache)
```

Expected output: client bundle, `dist/server` worker, `dist/client/sw.js` with ~158 precached
entries (~1.5 MB). Any router-generator warning is a blocker — fix before shipping.

## Environments

| Environment | Purpose | Notes |
| --- | --- | --- |
| Preview | Latest build of the working branch | Service worker is disabled in preview/iframe contexts |
| Production | Published deployment | HSTS + `upgrade-insecure-requests` enabled |

## Pre-deploy checklist

1. `bun run build` — PASS, no warnings.
2. Typecheck — PASS.
3. `bun run lint` — 0 errors.
4. Environment variables set (see [ENVIRONMENT.md](./ENVIRONMENT.md)).
5. Backend secrets present: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
   `SUPABASE_DB_URL`.
6. Database migrations applied; linter shows only the four accepted `SECURITY DEFINER` warnings.
7. Cloudinary cloud + unsigned upload preset configured (or accepted as degraded).
8. Health Check page green on the target environment.
9. Smoke test: sign in → open a lesson → run one exam attempt → check audit log.

## Deploy

Publish from the project UI. Frontend changes go live after publishing; database changes are
applied immediately when the migration runs.

## Post-deploy verification

- Load the production URL, confirm security headers (`content-security-policy`,
  `strict-transport-security`, `x-frame-options: DENY`).
- Install the PWA on Android Chrome and confirm the offline shell renders when offline.
- Confirm `audit_logs` receives a new entry after an admin action.

## Rollback checklist

1. **Frontend**: re-publish the previous known-good deployment from the project's deployment
   history. No data migration is involved — the frontend is stateless.
2. **Database**: forward-fix only. Never drop a column or table to roll back; ship a corrective
   migration. Snapshots and audit logs are append-only and must not be rewritten.
3. **Secrets**: if a rotated key caused the incident, restore the previous value in the secret
   store; edge functions pick it up on the next invocation.
4. **PWA**: if a bad service worker shipped, deploy a kill-switch worker at `/sw.js` for one
   release cycle so installed clients evict the stale registration.
5. Re-run the post-deploy verification list before declaring the rollback complete.
