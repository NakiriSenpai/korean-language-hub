# Hangeul LPK Platform

**Version 1.0.0**

Multi-tenant SaaS platform for Korean language training centres (LPK): learning content,
knowledge references, assessment authoring, exam delivery, analytics and platform
administration — mobile-first, installable as a PWA.

## Stack

React 19 · TypeScript (strict) · TanStack Start v1 · TanStack Router & Query · Vite 7 ·
Tailwind CSS v4 (OKLCH tokens) · shadcn/ui · Supabase (PostgreSQL + RLS) · Cloudinary ·
Workbox PWA.

## Quick start

```bash
bun install
cp .env.example .env   # fill in the values
bun run dev            # http://localhost:8080
```

Scripts: `dev`, `build`, `lint`, `format`.

## Features

| Domain | What it does |
| --- | --- |
| Identity | Sign-in, session manager, tenants, roles, permission matrix |
| Academic | Periods, study groups with capacity, enrollments, students, teachers |
| Learning | Course → module → lesson → unit → block reader, progress, bookmarks |
| Knowledge | Grammar, vocabulary, conversation, culture, search, favorites |
| Assessment | Versioned question bank, assessments, randomization, publish snapshots |
| Exam | Snapshot delivery, resumable attempts, timer, auto-scoring, review |
| Analytics | Student / assessment / class / platform dashboards, XLSX-PDF-CSV export |
| Platform | Console, tenants, branding, settings, audit log, announcements, media, CMS |

## Documentation

- [Architecture](./docs/ARCHITECTURE.md) — layering, domains, request lifecycle
- [Environment](./docs/ENVIRONMENT.md) — required vs optional variables
- [Security](./docs/SECURITY.md) — headers, RLS model, session hardening
- [Deployment](./docs/DEPLOYMENT.md) — build, checklist, rollback
- [Release notes](./docs/RELEASE_NOTES.md) · [Changelog](./CHANGELOG.md)

## Conventions

- Domains live in `src/modules/<domain>` and expose a single `index.ts` barrel.
- Cross-domain code lives in `src/shared`; services never import React.
- All colors come from design tokens — no hardcoded color utilities.
- All imports use the `@/` alias.
