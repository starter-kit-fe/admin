# syntax=docker/dockerfile:1

ARG GO_VERSION=1.24
ARG NODE_VERSION=20

# ── Stage 1: build Next.js static export ────────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS web-builder
WORKDIR /repo
RUN corepack enable

# Copy all package manifests first — install layer is cached when only source changes.
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json                           ./apps/web/
COPY packages/ui/package.json                        ./packages/ui/
COPY packages/eslint-config/package.json             ./packages/eslint-config/
COPY packages/typescript-config/package.json         ./packages/typescript-config/

# --mount=type=cache persists the pnpm store across builds on the same host
# so packages are only re-downloaded when pnpm-lock.yaml changes.
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# Copy package source files needed for Next.js build:
#   packages/ui            — shared shadcn components (runtime)
#   packages/typescript-config — tsconfig JSON files referenced via "extends"
# packages/eslint-config source is NOT needed; linting runs separately.
COPY apps/web/                    ./apps/web/
COPY packages/ui/src/             ./packages/ui/src/
COPY packages/typescript-config/  ./packages/typescript-config/

RUN pnpm --filter=web build

# ── Stage 3: build Go binary ─────────────────────────────────────────────────
FROM golang:${GO_VERSION}-alpine AS server-builder
WORKDIR /app
ENV CGO_ENABLED=0 GO111MODULE=on

RUN apk add --no-cache ca-certificates tzdata

# Cache Go modules — layer reused until go.mod/go.sum change
COPY apps/server/go.mod apps/server/go.sum ./
RUN go mod download

# Copy source and compile
COPY apps/server/ ./
ARG VERSION=dev
ARG COMMIT=local
RUN go build -trimpath -ldflags="-s -w \
    -X 'github.com/starter-kit-fe/admin/constant.VERSION=${VERSION}' \
    -X 'github.com/starter-kit-fe/admin/constant.COMMIT=${COMMIT}'" \
    -o /app/bin/admin ./cmd

# ── Stage 4: minimal runtime image ───────────────────────────────────────────
FROM gcr.io/distroless/base-debian12:nonroot
WORKDIR /app

COPY --from=server-builder /app/bin/admin            ./admin
COPY --from=server-builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=web-builder    /repo/apps/web/out        ./web/out

EXPOSE 27507
ENV PORT=27507
ENV FRONTEND_OUT_DIR=/app/web/out

ENTRYPOINT ["./admin"]
CMD ["start", "--addr", ":27507"]
