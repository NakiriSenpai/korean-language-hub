# Environment Configuration

All runtime configuration is read from Vite environment variables (`VITE_*`) through a single
entry point: `@/shared/platform` → `platformEnv` / `validateEnv()`. Application code must never
read `import.meta.env` directly.

## Variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | **Yes** | Backend project URL (auth, database, realtime) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | **Yes** | Publishable key used by the browser client (legacy alias `VITE_SUPABASE_ANON_KEY` is still read as a fallback) |
| `VITE_CLOUDINARY_CLOUD_NAME` | No | Media delivery (images/audio) |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | No | Unsigned upload preset for the Media Manager |

Required variables block boot: `PlatformProvider` (in `strict` mode) renders the environment
error screen and the app does not start. Optional variables only produce a warning in the log and
mark the `cloudinary` health probe as `warn`; every other domain keeps working.

## Local setup

```bash
cp .env.example .env
# fill in the values, then
bun install
bun run dev
```

## Production

Set the same variables in the hosting environment. Never commit real values; `.env` is ignored.
Server-side secrets (service role key, database URL) are stored in the backend secret store and
are never exposed to the browser bundle.

## Verifying

Sign in and open **Platform → Console → Health Check**. Four probes must report:
`platform` (ok), `supabase` (ok), `cloudinary` (ok or warn when unconfigured), `storage` (ok).
