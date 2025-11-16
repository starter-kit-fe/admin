# Starter Kit Admin

A Turborepo-based admin starter that pairs a Next.js dashboard with a Go backend. It ships with ready-to-use UI, data fetching, authentication, logging, and multilingual support so you can plug in business features quickly.

## Features
- Next.js dashboard with next-intl for bilingual (en/zh) routing and copy management.
- UI system built on shadcn/ui + Tailwind, including theme toggle and responsive layouts.
- Data layer using @tanstack/react-query plus a custom HTTP client for auth, retries, and timeouts.
- Built-in role/permission hooks, activity logging, and health checks for observability.
- Go API service with Swagger docs (`apps/server/internal/docs/swagger.json`) and release builds under `apps/server/build`.

## Project Structure
- `apps/web` — Frontend (Next.js, i18n, UI components, pages).
- `apps/server` — Backend (Go API; commands in `cmd/`, domain packages under `internal/`).
- `apps/docs` — Example Next.js docs app.
- `packages/ui` — Shared UI components.
- `packages/eslint-config` / `packages/typescript-config` — Linting and TS baselines.

## Getting Started
1) Install dependencies (Node ≥ 18, pnpm):
```sh
pnpm install
```
2) Run the whole workspace in dev mode or scope to a single app:
```sh
pnpm dev
# or only frontend
pnpm --filter web dev
# or only backend (requires air)
pnpm --filter server dev
```

## Development Commands
- `pnpm build` — Build all apps/packages via Turbo.
- `pnpm lint` — ESLint checks for the monorepo.
- `pnpm check-types` — TypeScript project references check.
- `pnpm docs` — Regenerate Swagger JSON for the Go API.
- `cd apps/server && go test ./...` — Run Go unit tests.

## i18n Notes
- Locale-aware routes live under `apps/web/src/app/[locale]`.
- Translation messages are in `apps/web/src/messages/{locale}`.
- User locale preference is saved via cookies for consistent redirects.

## Links
- Project repo: https://github.com/starter-kit-fe/admin
- Swagger UI (when running backend): `/dashboard/tool/swagger`
