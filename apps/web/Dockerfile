# syntax=docker/dockerfile:1

# ── Base: Node + pnpm (Debian slim — safest for sharp + libsql native) ──
FROM node:20-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /app

# ── Full deps (for the build) ──
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json ./apps/web/package.json
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# ── Build ──
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY . .
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Config init needs these; values are irrelevant to the build output.
ENV PAYLOAD_SECRET=build-time-placeholder
ENV DATABASE_URI=file:/tmp/build.db
# NEXT_PUBLIC_* are inlined into the client bundle at build time, not read at
# runtime — so the VPS .env can't set them. Bake the blog URL here so the "Blog"
# nav link renders. Override with --build-arg NEXT_PUBLIC_BLOG_URL=… if it moves.
ARG NEXT_PUBLIC_BLOG_URL=https://blog.tionusa.id
ENV NEXT_PUBLIC_BLOG_URL=$NEXT_PUBLIC_BLOG_URL
# Apply Payload migrations ONCE, single-process, before the build. Otherwise
# next build's parallel static-generation workers each run prodMigrations on the
# same SQLite file and race -> "SQLITE_BUSY: database is locked" / half-applied
# schema. Pre-migrating leaves the workers with nothing to write (read-only).
RUN pnpm --filter web payload migrate
RUN pnpm --filter web build

# ── Prod deps only (smaller runtime; installs the linux libsql/sharp binaries) ──
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/package.json
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --prod

# ── Runtime ──
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Data dir (SQLite + media) — a volume is mounted here in compose.
RUN mkdir -p /data/media && chown -R node:node /data

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/apps/web/node_modules ./apps/web/node_modules
# --chown so the `node` user can write .next/cache (Next fetch cache) at runtime.
COPY --from=builder --chown=node:node /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY apps/web/package.json apps/web/next.config.ts ./apps/web/
COPY package.json pnpm-workspace.yaml ./

USER node
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["pnpm", "start"]
