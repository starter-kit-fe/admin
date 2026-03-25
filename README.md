# Admin

A full-stack admin panel built with Next.js + Go, packaged into a single Docker image.

[中文文档](./README.zh.md)

## Table of Contents

- [Project Structure](#project-structure)
- [Local Development](#local-development)
- [Updating Dependencies](#updating-dependencies)
- [Updating shadcn/ui Components](#updating-shadcnui-components)
- [Docker Deployment](#docker-deployment)
- [Releasing a New Version](#releasing-a-new-version)

---

## Project Structure

```
.
├── apps/
│   ├── web/          # Next.js frontend (App Router)
│   └── server/       # Go backend + Dockerfile
├── packages/
│   └── ui/           # Shared shadcn/ui component library
├── deployments/
│   └── nginx.conf    # Reference Nginx reverse proxy config
├── docker-compose.yml
├── .env.example
└── Makefile
```

**Tech Stack**

| Layer    | Technology                                        |
| -------- | ------------------------------------------------- |
| Frontend | Next.js 16, Tailwind v4, TanStack Query, Jotai    |
| Backend  | Go 1.24, Gin, GORM                                |
| Database | PostgreSQL 17                                     |
| Cache    | Redis 7                                           |
| Deploy   | Docker + GHCR multi-arch images (amd64 / arm64)   |

---

## Local Development

**Prerequisites**: Node.js ≥ 18, pnpm 9, Go 1.24

```sh
# Install dependencies
pnpm install

# Start full-stack dev server (frontend + backend with hot reload)
pnpm dev
```

Other commands:

```sh
pnpm build        # Build all apps
pnpm lint         # Run ESLint
pnpm check-types  # TypeScript type check
pnpm format       # Prettier format
pnpm docs         # Generate Swagger docs
```

---

## Updating Dependencies

The project uses pnpm workspaces + Turborepo. All dependency updates are managed from the root.

```sh
# Interactive update (recommended)
pnpm update --interactive --latest

# Update a specific package across all workspaces
pnpm update <package-name> --recursive

# Update a package in a specific app
pnpm --filter=web update <package-name>
pnpm --filter=ui update <package-name>
```

Run `pnpm build` after updating to confirm there are no build errors.

---

## Updating shadcn/ui Components

shadcn/ui components live in `packages/ui` and are consumed by `apps/web` via `@repo/ui/components`. **All component operations should be run inside `packages/ui`.**

### Add a new component

```sh
cd packages/ui
pnpm dlx shadcn@latest add <component-name>

# Examples
pnpm dlx shadcn@latest add calendar
pnpm dlx shadcn@latest add data-table
```

### Update an existing component

```sh
cd packages/ui
pnpm dlx shadcn@latest add <component-name> --overwrite
```

### Update all components at once

```sh
cd packages/ui
pnpm dlx shadcn@latest add --all --overwrite
```

> **Note**: shadcn/ui components are source-copied, not npm packages. After overwriting, review the diff to ensure local customizations are not lost.

Import components in `apps/web`:

```tsx
import { Button } from '@repo/ui/components/button';
```

---

## Docker Deployment

**Prerequisites**: Docker and Docker Compose v2 installed on the server.

### First-time Setup

**1. Clone the repository**

```sh
git clone <repo-url>
cd admin
```

**2. Create the `.env` file**

```sh
cp .env.example .env
```

Only one value is required:

```env
POSTGRES_PASSWORD=your_secure_password
```

`AUTH_SECRET`, `DB_URL`, and `REDIS_URL` are auto-generated or derived automatically.

Optional overrides:

```env
# Pin to a specific image version (default: latest)
APP_IMAGE=ghcr.io/<owner>/admin:v26.325.1133

# Custom port (default: 27507)
APP_PORT=27507
```

**3. Start**

```sh
make up
```

`make up` will automatically:
- Initialize `.env` from `.env.example` if missing
- Generate a random `AUTH_SECRET` on first run (stable across restarts)
- Start the `app + postgres + redis` containers

**4. Verify**

```sh
docker compose ps        # Check container status
docker compose logs -f   # Stream logs
```

Open `http://<server-ip>:27507`.

---

### Updating to a New Version

```sh
# Update the image version in .env
APP_IMAGE=ghcr.io/<owner>/admin:v26.325.xxxx

# Pull the new image and restart
docker compose pull
docker compose up -d
```

### Stopping

```sh
make down
```

### Data Persistence

PostgreSQL and Redis data are stored in named volumes (`postgres_data`, `redis_data`). Running `make down` does **not** delete them.

To **fully reset** (deletes all data):

```sh
docker compose down -v
```

### Private Registry

If the GHCR package is private, log in before pulling:

```sh
echo <PAT> | docker login ghcr.io -u <username> --password-stdin
```

The PAT requires `read:packages` scope.

---

## Releasing a New Version

Pushing a tag triggers GitHub Actions to build and push multi-arch images (amd64 + arm64) to GHCR.

```sh
# Bump version, commit, tag, and push in one command
make push-tag
```

Published images:

- `ghcr.io/<owner>/admin:<tag>`
- `ghcr.io/<owner>/admin:latest`
