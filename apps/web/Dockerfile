# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
WORKDIR /app
# Keep pnpm store in a known path we can copy between stages (avoids reinstall/prune failures)
ENV PNPM_STORE_PATH=/pnpm-store

FROM base AS deps
RUN apk add --no-cache libc6-compat \
  && mkdir -p /pnpm-store

# Only copy dependency manifests for better layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY packages/eslint-config/package.json ./packages/eslint-config/package.json
COPY packages/typescript-config/package.json ./packages/typescript-config/package.json

RUN corepack enable && pnpm install --frozen-lockfile

FROM deps AS builder
COPY . .
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN corepack enable && pnpm --filter web build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Seed workspace metadata for pnpm
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY packages/eslint-config/package.json ./packages/eslint-config/package.json
COPY packages/typescript-config/package.json ./packages/typescript-config/package.json

# Reuse already-installed deps and install only prod deps so next.config.ts doesn't try to auto-install TypeScript at runtime
COPY --from=deps /app/node_modules ./node_modules
# Local node_modules links for the web workspace
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
# pnpm prune needs the store metadata
COPY --from=deps /pnpm-store /pnpm-store
RUN corepack enable && pnpm install --prod --filter web --frozen-lockfile --prefer-offline

# Copy built assets
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/next.config.ts ./apps/web/next.config.ts
COPY --from=builder /app/apps/web/postcss.config.mjs ./apps/web/postcss.config.mjs
COPY --from=builder /app/apps/web/open-next.config.ts ./apps/web/open-next.config.ts

WORKDIR /app/apps/web
USER node

EXPOSE 3000
CMD ["pnpm", "start"]
