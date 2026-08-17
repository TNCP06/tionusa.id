# tionusa.id

Personal platform for Tionusa Catur Pamungkas, Fullstack developer: a portfolio site plus
the **KANAL** blog, both served from one app in this repo.

[![CI](https://github.com/TNCP06/tionusa.id/actions/workflows/ci.yml/badge.svg)](https://github.com/TNCP06/tionusa.id/actions/workflows/ci.yml)
[![Deploy](https://github.com/TNCP06/tionusa.id/actions/workflows/deploy.yml/badge.svg)](https://github.com/TNCP06/tionusa.id/actions/workflows/deploy.yml)
![Next.js](https://img.shields.io/badge/Next.js-App_Router-black?logo=next.js)
![Payload CMS](https://img.shields.io/badge/Payload_CMS-3-000?logo=payloadcms)
![SQLite](https://img.shields.io/badge/SQLite-WAL-003B57?logo=sqlite)
![pnpm](https://img.shields.io/badge/pnpm-workspaces-F69220?logo=pnpm)

- **Portfolio** (`tionusa.id`) — profile, experience, and project write-ups, curated through
  a Payload admin panel.
- **KANAL blog** (`blog.tionusa.id`) — articles served from the same host on the `blog.`
  subdomain, populated by an external content pipeline through an `INGEST_SECRET`-guarded
  ingest API (that pipeline lives in a separate private repo).

Both are one **pnpm workspaces + Turborepo** monorepo. The Phase 1 app, `apps/web`, is Next.js
(App Router) with **Payload CMS 3 embedded** — a single process serving the public site,
`/admin`, the REST/GraphQL API, and uploads. SQLite for storage, self-hosted on EC2 behind a
Cloudflare Tunnel. No Vercel.

## How it's put together

```
        visitors
            │
   ┌────────┴─────────┐
   │                   │
tionusa.id      blog.tionusa.id
(portfolio)          (KANAL)
   │                   │
   └────────┬──────────┘
            │
     one website (this repo)
   ┌────────┴──────────┐
   │  admin panel       │  ← where content gets written & published
   │  (built in, /admin)│
   └────────┬──────────┘
            │
        database
     (1 file, on the
      same server)
```

In plain terms:

- The portfolio and the blog are **two sides of the same website** — same server, same
  database, just a different address. Not two separate projects.
- Content is written and published through an **admin panel that comes built in** — no
  separate CMS app to install or host.
- Blog posts can also come in automatically from a separate AI writing tool, but they always
  land as a **draft first** — nothing goes public until someone hits publish.
- It runs on the owner's own server, not a paid hosting platform (no Vercel).

## Features

- **Bilingual content model** — every field can hold Indonesian + English; the public site
  doesn't switch languages yet (no locale picker), that's wired up in a later phase.
- **Portfolio entries** — projects, work experience, education; hidden until published, then
  shown with the important ones first.
- **Blog articles** — tagged and sorted into categories (tech, film, kpop, hiburan, tips),
  with reading time, RSS, and a sitemap.
- **Two ways in, one rule** — a person can publish through `/admin`; an automated pipeline can
  only ever save a draft, never publish or delete anything on its own.

## Content flow

Write (by hand, or as an automatic draft) → someone hits publish → the page goes live right
away — no restart, no rebuild.

## Quick start (local dev)

```bash
corepack enable             # first time only — activates pnpm
pnpm install
cp .env.example .env         # then set PAYLOAD_SECRET (openssl rand -base64 32)
pnpm dev                     # http://localhost:3000
```

Useful scripts: `pnpm typecheck`, `pnpm build`, `pnpm --filter web seed` (dev seed data),
`pnpm --filter web payload migrate:create <name>` (after a schema change).

## Layout

- `apps/web` — public site + `/admin` + REST/GraphQL API + uploads (Payload embedded); the
  blog lives here as the `(blog)` route group
- `docs/` — architecture, code map, data model, deployment, backup (English)
- `packages/` — shared code, created only when used by more than one app
- `scripts/` — host-side operations (e.g. `backup.sh`)

## Docs

Start at [`docs/codemap.md`](docs/codemap.md) — it maps each area to the files you need to
read. Big picture: [`docs/architecture.md`](docs/architecture.md). See also
[`docs/data-model.md`](docs/data-model.md), [`docs/business-flow.md`](docs/business-flow.md),
[`docs/deployment.md`](docs/deployment.md), and [`docs/backup.md`](docs/backup.md).

## Deploy

Push to `main` → GitHub Actions builds the Docker image → GHCR → the VPS runs
`docker compose pull && up -d`. **The VPS never builds** (OOM risk). See
[`docs/deployment.md`](docs/deployment.md).
