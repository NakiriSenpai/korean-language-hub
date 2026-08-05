# Release Notes — Version 1.0.0

**Status**: Release Candidate → General Availability
**Date**: 2026-08-05

Hangeul LPK Platform 1.0.0 is the first production release: a multi-tenant SaaS for Korean
language training centres (LPK), covering learning content, knowledge references, assessment
authoring, exam delivery, analytics and platform administration.

## Highlights

- **Identity & multi-tenancy** — email sign-in, session manager with proactive refresh, tenant
  memberships, role-based permission matrix, route and UI level gating.
- **Academic** — academic periods, study groups with capacity enforcement, enrollments, student
  profiles, teacher assignments.
- **Learning** — course → module → lesson → unit → block content model, seven block types,
  block-based reader, progress tracking, bookmarks and continue-learning.
- **Knowledge** — grammar, vocabulary, conversation and culture entries with a universal reader,
  filters, search and favorites.
- **Assessment Studio** — question bank with immutable versioning, multiple question types,
  randomization settings and publish snapshots.
- **Exam Engine** — snapshot-only delivery, resumable attempts with auto-save, timer and question
  palette, automatic scoring and answer review with explanations.
- **Analytics** — student, assessment, class and platform dashboards with a filter engine and
  XLSX / PDF / CSV export.
- **Platform Administration** — console with live health probes, tenant management, OKLCH
  branding, system settings, immutable audit log, announcements, media manager and CMS blocks.
- **Production hardening** — CSP and security headers at the edge, correlation-ID observability,
  safe-retry HTTP, full sign-out cleanup, no `anon` database privileges.
- **PWA** — installable app shell, offline page, Workbox precache and controlled update flow.

## Upgrade notes

First release — no upgrade path required.

## Known limitations

See the Known Issues section of [CHANGELOG.md](../CHANGELOG.md).
