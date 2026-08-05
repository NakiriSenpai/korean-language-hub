# Changelog

All notable changes to the Hangeul LPK Platform. Format follows
[Keep a Changelog](https://keepachangelog.com/), versioning follows
[Semantic Versioning](https://semver.org/).

## [1.0.0] — 2026-08-05

First production release.

### Added

- **Foundation** — domain-based folder architecture, strict TypeScript, ESLint + Prettier,
  validated environment loader, shared constants, alias imports, error boundary and loading
  foundations.
- **Design system** — light/dark/system theme engine, OKLCH design tokens, layout primitives
  (`AppContainer`, `AppPage`, `AppSection`, `AppCard`, `Stack`, `Grid`), mobile-first responsive
  scale.
- **Application shell** — header, collapsible sidebar, bottom navigation, splash screen, error
  pages, skip links and ≥44 px touch targets.
- **Platform foundation** — Supabase client, Cloudinary URL builder, HTTP utility with retries,
  namespaced storage, network/connectivity observers, `PlatformProvider`.
- **PWA** — manifest, Workbox service worker, offline app shell, install prompt, update strategy.
- **Identity** — auth service, session manager, membership/tenant resolution, permission matrix,
  `AuthGate` and `PermissionGate`.
- **Academic** — academic periods, study groups (capacity trigger), enrollments, student profiles,
  teacher assignments.
- **Learning** — content hierarchy, block renderer, progress, bookmarks, continue-learning.
- **Knowledge** — grammar, vocabulary, conversation, culture, universal reader, search, favorites.
- **Assessment Studio** — versioned question bank, question editor/picker, assessment metadata,
  randomization, immutable publish snapshots.
- **Exam Engine** — snapshot loader, attempt lifecycle with auto-save, runtime with timer and
  palette, scoring engine, result and review views.
- **Analytics** — dataset/aggregate/filter services, dashboards, XLSX/PDF/CSV export engine.
- **Platform Administration** — console, tenants, branding, settings, audit log, announcements,
  media manager, CMS blocks.
- **Hardening** — security headers and CSP at the edge, observability with correlation IDs,
  health probes, backup/recovery foundation, sign-out cleanup.
- **Documentation** — `README`, `docs/SECURITY.md`, `docs/ARCHITECTURE.md`,
  `docs/ENVIRONMENT.md`, `docs/DEPLOYMENT.md`, `docs/RELEASE_NOTES.md`, this changelog.

### Changed

- Cloudinary environment variables are now **optional**: missing values log a warning and mark the
  media health probe as `warn` instead of blocking application boot. Only the backend URL and
  publishable key are required.
- Application version metadata bumped to `1.0.0` (`package.json`, `APP_META.version`).

### Security

- `anon` role holds no privileges on any table or function; the platform is authenticated-only.
- RLS enabled on all 38 public tables, 122 policies, 0 tables without a policy.
- Four `SECURITY DEFINER` helpers remain intentionally callable by signed-in users
  (`has_tenant_role`, `is_tenant_member`, `shares_tenant_with`, `create_tenant`) — documented and
  accepted in `docs/SECURITY.md`.

### Known issues

- Some foreign keys are covered only by composite indexes that do not lead with the FK column.
  No measurable impact at current data volumes; scheduled for a post-1.0 performance pass.
- ESLint reports 19 `react-refresh/only-export-components` warnings (0 errors). These are
  developer-experience warnings on provider/badge modules and do not affect production output.
- Firefox and Edge were validated on rendering/layout only; the automated harness runs Chromium.
