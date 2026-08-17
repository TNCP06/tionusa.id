# Business flow

> Last verified against code: 2026-07-04 (Blog Phase 2 live)

## Portfolio entry lifecycle

- **Now (manual)**: the owner creates/edits a `portfolio-entry` in `/admin`, saves as a draft, then publishes. Only published entries reach the public site.
- **Phase 3 (AI)**: the agent creates `source=ai` drafts (never publishes/deletes); the owner approves via a Telegram/Discord bot → publish.

## Ordering on the homepage

`featured` (desc) → `priorityScore` (desc) → `startDate` (desc).

## Article lifecycle

- **Draft**: created by Personal-Assistant-AI via `POST /api/ingest/article` (`INGEST_SECRET`-guarded), or manually in `/admin`.
- **Publish**: `POST /api/ingest/article/[id]/publish`, or a manual publish in `/admin` — sets `publishedAt`, and the `afterChange` hook revalidates.
- **Live**: published articles appear on the blog (`blog.tionusa.id`) — index, category tabs, article page, RSS/sitemap.

## Content path

Admin edit → publish → Payload `afterChange` hook → `revalidate*` → the public page updates without a restart.
