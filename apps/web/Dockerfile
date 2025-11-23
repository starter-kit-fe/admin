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

FROM nginx:1.27-alpine AS runner
WORKDIR /usr/share/nginx/html

# Copy exported static assets
COPY --from=builder /app/apps/web/out ./

# Replace default site config
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
