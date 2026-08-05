# Lovable Support Report — Cannot connect project to external Supabase after removing Lovable Cloud

## Identification
- **Project UUID:** `4cd67de2-2d1e-4497-b557-c8ef96f64f9f`
- **Project URL:** https://lovable.dev/projects/4cd67de2-2d1e-4497-b557-c8ef96f64f9f
- **Workspace:** the workspace owning the project above (Supabase connector was authorized at workspace level from this workspace)
- **Supabase organization:** `AquilaCafe` (OAuth authorization reported "Connection Successful")
- **Stale/dead Supabase project ref still bound:** `wicozeudbxcfecotwhce`
- **Stack:** TanStack Start (SSR / Nitro), deployed to Cloudflare Workers via GitHub Actions

## Summary
After removing Lovable Cloud and authorizing my own Supabase organization (AquilaCafe) at
the workspace level, the project still shows **"Project: Not connected"** and offers no way
to select one of my Supabase projects. The project remains bound to the deleted Lovable
Cloud Supabase project `wicozeudbxcfecotwhce`.

## Evidence
1. The platform-injected `.env` for this project still contains:
   - `VITE_SUPABASE_URL=https://wicozeudbxcfecotwhce.supabase.co`
   - `VITE_SUPABASE_PROJECT_ID=wicozeudbxcfecotwhce`
   - `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` for the same dead ref
2. `https://wicozeudbxcfecotwhce.supabase.co/auth/v1/health` returns **no response at all**
   (curl exit / HTTP code `000`) — the project no longer exists.
3. `supabase/config.toml` still reads `project_id = "wicozeudbxcfecotwhce"`.
4. The Lovable agent's connector API reports:
   **"No connections are available in the workspace for the current user"**,
   while the Connectors UI simultaneously shows the AquilaCafe Supabase connection as
   **Connection Successful**. UI state and backend connector state disagree.
5. The Supabase integration is a *seamless connector*, so the agent has no API to create or
   clear the project-level binding; it must be done platform-side.

## Root cause (as diagnosed)
Removing Lovable Cloud deleted the managed Supabase backend but did **not** clear the
project-level Supabase binding record. The project row still references the deleted project
`wicozeudbxcfecotwhce`, and that stale binding blocks the "select an external Supabase
project" flow from ever being offered — even though the workspace-level OAuth connection to
the AquilaCafe organization exists and is valid.

## Steps to reproduce
1. Project created with Lovable Cloud enabled → managed Supabase project
   `wicozeudbxcfecotwhce` provisioned.
2. Cloud → Advanced → **Remove Lovable Cloud** (confirmed, backend deleted).
3. Dashboard → **Connectors → Supabase → Connect Supabase** → authorize organization
   **AquilaCafe** → UI shows **Connection Successful**.
4. Open the project → **More → Cloud / Connectors**.
5. **Observed:** `Project: Not connected`, with no project picker and no way to choose a
   Supabase project from AquilaCafe.
   **Expected:** a picker listing AquilaCafe's Supabase projects to bind to this project.
6. Injected `.env` still points at the deleted ref `wicozeudbxcfecotwhce`.

## What I have already ruled out (not the cause)
- **Repository configuration:** no application code hardcodes a project ref; all Supabase
  access goes through `src/integrations/supabase/*`, which reads env vars.
- **Migrations:** 17 migration files exist in `supabase/migrations/`, all valid, none applied
  to the new project yet — they cannot influence connector binding.
- **GitHub:** remote is the Lovable-managed internal git repo; workflows only read
  `secrets.VITE_SUPABASE_URL` / `secrets.VITE_SUPABASE_PUBLISHABLE_KEY` at build time.
- **Cloudflare:** deployment is build-output only (Nitro → Workers) and never touches
  connector state.
- **My Supabase org:** OAuth completed successfully; the org is reachable and authorized.
- **Self-service remediation:** `.env` is platform-managed and regenerated, and editing
  `supabase/config.toml` does not change the binding. There is no unbind control in the UI.

## Requested fix from Lovable engineering
1. Clear the stale Lovable Cloud / Supabase project binding
   (`wicozeudbxcfecotwhce`) for project `4cd67de2-2d1e-4497-b557-c8ef96f64f9f`.
2. Purge the injected `.env` values referencing that dead project ref.
3. Re-enable the external Supabase project selection flow for this project so I can bind it
   to a project inside the **AquilaCafe** organization.
4. Confirm why the connector backend reports zero workspace connections while the Connectors
   UI reports the AquilaCafe connection as successful — this desync may affect other
   projects/workspaces.

## After the fix (my plan, no action needed from support)
Bind the project to my Supabase project → apply the 17 repository migrations →
create `media` and `documents` storage buckets → regenerate types → verify tables, RLS,
triggers, and functions.
