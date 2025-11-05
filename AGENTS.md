# Repository Guidelines

## Project Structure & Module Organization
The pnpm + Turborepo workspace keeps runtime code in `apps` and shared tooling in `packages`. `apps/web` hosts the Next.js dashboard (entrypoints in `apps/web/src/app`). `apps/server` provides the Go API, with binaries in `cmd/` and domain packages under `internal/`. Swagger output and release builds land inside `apps/server/internal/docs` and `apps/server/build`. Shared UI lives in `packages/ui/src`; lint and TS baselines stay in `packages/eslint-config` and `packages/typescript-config`.

## Build, Test, and Development Commands
- `pnpm install` — bootstrap dependencies (Node ≥ 18).
- `pnpm dev` — run all dev targets; scope with `pnpm --filter web dev` or `pnpm --filter server dev` (requires `air`) when focusing on one service.
- `pnpm build` — run Turbo builds (Next.js plus backend tasks).
- `pnpm lint` / `pnpm check-types` — lint and type-check; keep both green before commits.
- `pnpm docs` — regenerate Swagger at `apps/server/internal/docs/swagger.json`.
- `go test ./...` (run from `apps/server`) — execute Go unit tests.

## Coding Style & Naming Conventions
Prettier (`pnpm format`) enforces two-space indentation, sorted imports, and Tailwind class ordering. Components in `apps/web/src` use `PascalCase`; hooks live beside their caller and start with `use`. Prefer `camelCase` identifiers in TypeScript, reserve SCREAMING_CASE for constants. Go code must be `gofmt`-clean, with exported names in `CamelCase`. Keep example configs (`*.config.*`, `.env.example`) tracked but never commit real secrets.

## Testing Guidelines
Place Go tests beside their package (e.g., `internal/user/service_test.go`) and run `go test ./...` ahead of every PR. The web app presently relies on linting and type checks; when introducing UI tests, follow the `Component.test.tsx` naming pattern and add the command to Turbo so it participates in `pnpm lint` or a dedicated pipeline. Regenerate Swagger when API contracts change and include the diff in review.

## Commit & Pull Request Guidelines
History favors short, imperative subjects (`bump version to v25.1105.0849`); keep the first line ≤72 chars and add prefixes like `web:` or `server:` when it sharpens context. PRs should explain the why, link issues, and attach screenshots or cURL samples for visible/API changes. Note the checks you ran (`pnpm lint`, `pnpm build`, `go test`) and highlight migrations or follow-up tasks.

## Security & Configuration Tips
Keep environment samples up to date by tracking `.env.example` templates alongside each service and avoid committing real credentials. Cloudflare settings live in `apps/web/wrangler.toml`; review them when touching edge deployment code. Store secrets in the team vault and reference them via deployment tooling rather than source control.
