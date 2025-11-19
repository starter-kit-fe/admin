# syntax=docker/dockerfile:1

ARG GO_VERSION=1.24
FROM golang:${GO_VERSION}-alpine AS builder

WORKDIR /app
ENV CGO_ENABLED=0 GO111MODULE=on

# Install ca certs for outbound HTTPS (mod download) and runtime trust store.
RUN apk add --no-cache ca-certificates tzdata

# Cache dependencies first
COPY apps/server/go.mod apps/server/go.sum ./
RUN go mod download

# Copy source and build the binary
COPY apps/server/ .
ARG VERSION=dev
ARG COMMIT=local
RUN go build -trimpath -ldflags="-s -w \
    -X 'github.com/starter-kit-fe/admin/constant.VERSION=${VERSION}' \
    -X 'github.com/starter-kit-fe/admin/constant.COMMIT=${COMMIT}'" \
    -o /app/bin/admin ./cmd

# Use slim runtime image
FROM gcr.io/distroless/base-debian12:nonroot
WORKDIR /app

COPY --from=builder /app/bin/admin ./admin
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

EXPOSE 27401
ENV PORT=27401

ENTRYPOINT ["./admin"]
CMD ["start", "--addr", ":27401"]
