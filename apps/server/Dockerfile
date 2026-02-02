# syntax=docker/dockerfile:1

ARG GO_VERSION=1.24
ARG NODE_VERSION=20

FROM node:${NODE_VERSION}-alpine AS web-builder
WORKDIR /repo
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps ./apps
COPY packages ./packages

RUN pnpm install --frozen-lockfile
RUN cd ./apps/web && pnpm build:docker

FROM golang:${GO_VERSION}-alpine AS server-builder
WORKDIR /app
ENV CGO_ENABLED=0 GO111MODULE=on

# Install ca certs for outbound HTTPS (mod download) and runtime trust store.
RUN apk add --no-cache ca-certificates tzdata

# Cache dependencies first
COPY apps/server/go.mod apps/server/go.sum ./
RUN go mod download

# Copy source and build the binary
COPY apps/server/ ./
ARG VERSION=dev
ARG COMMIT=local
RUN go build -trimpath -ldflags="-s -w \
    -X 'github.com/starter-kit-fe/admin/constant.VERSION=${VERSION}' \
    -X 'github.com/starter-kit-fe/admin/constant.COMMIT=${COMMIT}'" \
    -o /app/bin/admin ./cmd

# Use slim runtime image
FROM gcr.io/distroless/base-debian12:nonroot
WORKDIR /app

COPY --from=server-builder /app/bin/admin ./admin
COPY --from=server-builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=web-builder /repo/apps/web/out ./web/out

EXPOSE 27507
ENV PORT=27507
ENV FRONTEND_OUT_DIR=/app/web/out

ENTRYPOINT ["./admin"]
CMD ["start", "--addr", ":27507"]
