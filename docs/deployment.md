# Deployment

> Last verified against code: 2026-07-03 (Stage E live; prod migrations wired via prodMigrations)

## Model

Push to `main` → GitHub Actions builds the Docker image and pushes it to GHCR (tags `latest` + commit SHA) → SSH to the VPS → `docker compose pull && up -d && docker image prune -f`. **The VPS never builds** (small EC2, OOM risk) — it only pulls.

The image ships the built `.next` plus production `node_modules` (`next start`), not `output: standalone` — Next's file tracer drops Payload's dynamically-required `libsql` sqlite driver, so standalone would boot without a database driver.

## Files

- `apps/web/Dockerfile` — multi-stage (deps → build → prod-deps → runner on `node:20-bookworm-slim`).
- `docker-compose.yml` — one service, `127.0.0.1:3100:3000`, volume `app-data:/data`, `mem_limit: 512m`, healthcheck on `/api/health`, label `com.tionusa.project=tionusa.id`.
- `.github/workflows/ci.yml` — PR + push: `pnpm typecheck` + `pnpm build`.
- `.github/workflows/deploy.yml` — push to `main`: build & push image to GHCR, then deploy over SSH.

## GitHub Secrets (values NOT stored in the repo)

| Secret | Purpose |
|---|---|
| `DEPLOY_HOST` | VPS host |
| `DEPLOY_USER` | SSH user |
| `DEPLOY_SSH_KEY` | dedicated deploy private key (not the owner's main key) |
| `DEPLOY_PATH` | app folder on the VPS (holds `docker-compose.yml` + `.env`) |

Image push authenticates with the built-in `GITHUB_TOKEN` (scope `packages: write`). For a **private** GHCR image the VPS logs in once with a PAT scoped `read:packages`.

## VPS one-time prep

1. Ensure swap exists (guards the build-independent runtime): see `panduan-manual.md`.
2. Create `DEPLOY_PATH`; copy `docker-compose.yml` + a filled `.env` (from `.env.example` — set `PAYLOAD_SECRET` via `openssl rand -base64 32`, `DATABASE_URI=file:/data/tncp.db`, `MEDIA_DIR=/data/media`, `SITE_URL=https://tionusa.id`).
3. Private image: `docker login ghcr.io -u TNCP06` with a `read:packages` PAT.
4. Cloudflare Tunnel: point `tionusa.id` → `localhost:3000`.
5. First run: `docker compose up -d`, then create the admin at `/admin`.

## Database migrations

Payload's `push` (schema auto-sync via drizzle-kit) only runs outside production. Dev uses `push`; prod runs committed migrations. `payload.config.ts` wires `prodMigrations: migrations` (from `src/migrations`), which Payload applies on connect in production.

**After any schema change** (new/renamed collection or field):
1. `pnpm --filter web payload migrate:create <name>` locally — generates a `src/migrations/*.ts` + `*.json` snapshot and updates `index.ts`.
2. Commit them. CI bakes them into the image; prod applies pending ones on the next deploy.

**Never hand-create tables/columns on the prod DB.** `migrate:create` diffs against the last snapshot — a manual schema edit makes prod drift silently from the snapshot, and a later baseline records migrations as "run" over a schema that never actually matched. This is exactly what broke `/admin` on 2026-07-03: the `messages` table was created manually but `payload_locked_documents_rels.messages_id` was missed, then the initial migration was baselined over the mismatch, so admin's `select ... messages_id` hit `no such column`. Let migrations do the work on a matching DB instead.

If prod ever does drift, the recovery is to apply the exact DDL the migration snapshot expects (`src/migrations/*.ts`) so prod matches what the recorded migrations claim — then it's back in sync.

## Networking

Host port is **3100** (`tcd` already uses 3000). The container listens on 3000; compose maps `127.0.0.1:3100:3000`. Cloudflare Tunnel routes `tionusa.id` → the container — note `cloudflared` runs in another compose project, so it reaches this container via the Docker host gateway (`172.17.0.1:3100`) or by sharing a network, not `localhost`.

## Rollback

Deploy a previous image: `docker compose pull` a specific `sha-<commit>` tag (edit the image tag in compose or `docker compose up -d` after retagging), or re-run the deploy job on an earlier commit.

## Notes

- Local dev never needs Docker: `pnpm dev`.
- ESLint is not wired yet — CI runs typecheck + build only.
