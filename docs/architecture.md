# Architecture

> Last verified against code: 2026-07-04 (Stage C/D — public site live + Blog Phase 2)

## Context & goal

`tionusa.id` is the personal profile + portfolio site of Tionusa Catur Pamungkas (fullstack developer). Audience: recruiters and engineers. Content is curated manually now via the Payload admin; an AI agent curates it in Phase 3 (separate app/repo).

## Components

- **apps/web** — Next.js (App Router) + Payload CMS 3 in one process:
  - Public pages (`/`, `/portfolio/[slug]`) rendered from Payload data via the Local API.
  - `/admin` — Payload admin panel.
  - REST API + media uploads (single origin, `/data/media`).
- **SQLite** — single file under `/data`; migration = copy the volume.
- **Cloudflare Tunnel** (existing) — exposes the container at `tionusa.id`; the container listens on `3000`, but compose maps host `127.0.0.1:3100` → container `3000` (host `3000` is already taken by another project on the VPS — see `docs/deployment.md`).
- **CI/CD** — GitHub Actions builds the Docker image → GHCR → the VPS pulls.
- **Backup** — host cron encrypts a SQLite snapshot + media and hands it to the existing Telegram uploader.

## Key decisions & trade-offs

- **Payload + SQLite (embedded)** — one process, low RAM, no separate CMS service. Trade-off: SQLite is single-writer; fine for this write volume.
- **Self-host on EC2, no Vercel** — reuse the existing box + tunnel, no vendor lock-in, full control. Trade-off: we own ops (deploy, backup).
- **Build in CI, not on the VPS** — the small EC2 would OOM building Next.js. Trade-off: the VPS needs GHCR pull access.
- **Bilingual via Payload localization** — native, no extra library.

## Integration points

- Payload hooks → Next.js `revalidateTag`/`revalidatePath` (internal, no webhook).
- Phase 3 AI agent talks to this app only via REST API + an `agent` API key (draft-only access).

## Blog (Phase 2)

KANAL, the blog, is served on `blog.tionusa.id` — same Next.js process, no separate deploy. Host middleware (`apps/web/src/middleware.ts`) rewrites requests on the `blog.` host to the `(blog)` route group; the main host (`tionusa.id`) is untouched. Content is ingested from Personal-Assistant-AI as draft articles via `/api/ingest/*`, guarded by a shared `INGEST_SECRET` bearer token; publish sets `publishedAt` and revalidates like the rest of the site.

Diagrams: TODO — add ASCII/mermaid as the system solidifies.
