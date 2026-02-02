# Admin 部署说明

## 项目概览

- `apps/web`: Next.js 前端（构建产物由后端镜像打包）
- `apps/server`: Go 后端 + 前端静态产物打包入口，镜像名 `admin`

## 系统架构

### Monorepo 布局

- 使用 `pnpm` + Turborepo 管理前后端与共享包，根目录脚本统一通过 `pnpm <task>` 驱动（例如 `pnpm dev` 同时拉起 web/server）。
- `apps/web`、`apps/server`、`apps/docs` 处于同一工作区，`packages/` 目录则提供 UI 组件库（`packages/ui`）、ESLint 配置与 TS 配置，供各应用通过 `workspace:*` 方式直接复用。
- Dockerfile（`apps/server/Dockerfile`）负责在单一镜像中构建 web 与 server，`docker-compose.yml` 负责编排 `app + postgres + redis` 环境。

### Web（`apps/web`）

- 基于 Next.js 16 App Router（目录 `apps/web/src/app`），使用 Server/Client Component 组合、Jotai 状态（`src/stores.ts`）与 TanStack Query 发起数据请求，Tailwind v4 与 `packages/ui` 中的共享组件一起提供 UI 能力。
- `src/app/api/[[...path]]/route.ts` 实现了一个 BASE_URL 透传代理，把 `/api/*` 请求转发到 Go 服务（容器内默认直连 `http://server:27507`），这样 Cloudflare Workers、Node 运行器以及 Docker Compose 都能复用同一前端构建。
- `wrangler.toml` + `open-next.config.ts` 说明前端可以通过 OpenNext 打包成 Cloudflare Worker；在容器场景下则使用 `pnpm start` 启动传统 Node 服务器。

### Server（`apps/server`）

- Go 1.24 服务以 `cmd/main.go` 为入口，通过 `internal/cli`（Cobra）解析 `start`、`version` 等子命令，最终调用 `internal/app` 构建依赖并启动 HTTP 服务。
- `internal/app` 负责初始化 slog、GORM、Redis、全局节流以及 Gin Router，并在 `modules.go` 中把系统模块（auth/user/role/menu/dept/... 等位于 `internal/system/*` 的 handler/service/repository）注入到 `internal/router` 统一注册 `/v1` REST API。
- 配置使用 `internal/config` + Viper 装载，数据库与缓存联接由 `internal/db`、`internal/system/*` 中的仓储层实现；Swagger 文档通过 `pnpm docs` 触发 `apps/server/internal/docs/swagger.json` 更新，`/docs` 路由直接托管静态 UI。
- 中间件（`middleware/`）提供 JWT、权限、操作审计、速率限制等横切能力，公共响应体定义集中在 `pkg/`。

### 数据与基础设施

- PostgreSQL 使用官方 `postgres:16-alpine`（见 `docker-compose.yml`）作为主数据存储，容器预置数据卷与健康检查，Go 服务通过 `DB_URL` 环境变量连入；`internal/db/migrate.go`、`seed.go` 提供迁移与初始化脚本。
- Redis 使用官方 `redis:7-alpine`（见 `docker-compose.yml`）承载会话、验证码、在线用户、缓存等，服务层的 session store（`internal/system/auth/session_store.go`）及缓存模块共用一个地址，通过 `REDIS_URL` 配置。
- `docker-compose.yml` 编排 `app → (db, redis)`，支持本地 `docker compose build` 构建单体 `admin` 镜像用于离线环境。

### 架构数据流

```
┌──────────────┐    HTTPS /api     ┌───────────────────────┐
│ Next.js Web  │ ────────────────▶ │ Go API (Gin + GORM)   │
│ (apps/web)   │ ◀───────────────┐ │ internal/system 模块  │
└──────┬───────┘                 │ └──────────┬────────────┘
       │ 共享 UI & lint config   │            │
       │ (packages/*)            │            │
┌──────▼───────┐                 │            │
│ packages/ui  │                 │            │
└──────────────┘                 │            │
                                 │   ┌────────▼─────────┐
                                 │   │PostgreSQL (db)   │
                                 │   ├────────┬─────────┤
                                 │   │Redis (cache)     │
                                 │   └────────┴─────────┘
                                 │
                                 └── Docker Compose / GHCR 镜像用于统一部署
```

### Cloudflare BFF 拓扑

```
┌────────────┐   HTTPS requests    ┌──────────────────────────┐   Internal RPCs   ┌────────────────┐
│ Browser /  │ ──────────────────▶ │ Cloudflare Worker (BFF)  │ ────────────────▶ │ Go API Service │
│ Mobile App │   (login, dashboard)│  Next.js App Router      │   /v1 REST        │ (apps/server)  │
└────────────┘                    │  Proxy / auth cookies    │                  └──────┬─────────┘
                                  └────────────┬─────────────┘                         │
                                               │ BASE_URL                               │
                                               ▼                                        ▼
                                         ┌───────────────┐                    ┌──────────────────┐
                                         │ Web Assets    │                    │ PostgreSQL /     │
                                         │ (static cache)│                    │ Redis            │
                                         └───────────────┘                    └──────────────────┘
```

Cloudflare Worker 运行 Next.js 构建产物并作为 BFF，负责：

- 终端用户与 Go API 之间的 TLS 边界，复用 Cloudflare 身份策略、防护能力。
- 利用 `apps/web/src/app/api/[[...path]]/route.ts` 代理 `/api/*` 请求，并在边缘处理 Cookie、Session、Fetch 重试等逻辑。
- 静态资源由 Cloudflare KV/Assets 分发，动态请求再命中后台 `apps/server`，后者继续访问 Postgres/Redis。

## 发布镜像（推送 tag 自动构建）

1. 确认代码干净并更新版本号。
2. 打标签并推送：
   ```sh
   git tag vX.Y.Z
   git push origin vX.Y.Z
   ```
3. GitHub Actions 会为 tag 构建并推送多架构镜像到 GHCR：
   - `ghcr.io/<owner>/admin:<tag>` 与 `:latest`

## 一键部署（Docker Compose）

前置：服务器已安装 Docker + Docker Compose v2，并可拉取 GHCR 镜像（`docker login ghcr.io -u <user> -p <PAT>`，PAT 需 `read:packages`）。

1. 复制并填写环境变量：

   ```sh
   cp env.docker.example .env
   ```

   - 将 `IMAGE_OWNER` 设为你的 GitHub 组织或用户名。
   - 将 `IMAGE_TAG` 设为要部署的 tag（如 `vX.Y.Z`）。
   - 根据需要调整数据库、Redis、端口等配置。

2. 拉取镜像：
   ```sh
   docker compose --env-file .env pull
   ```
3. 启动：
   ```sh
   docker compose --env-file .env up -d
   ```
4. 查看状态：
   ```sh
   docker compose ps
   ```

## 本地构建与调试（Docker Compose）

无需推送镜像即可本地起全栈：

## Getting Started

1. Install dependencies (Node ≥ 18, pnpm):

```sh
pnpm install
```

2. Run the whole workspace in dev mode or scope to a single app:

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
- # Swagger UI (when running backend): `/dashboard/tool/swagger`

# 1) 准备环境变量（可在 .env 中覆盖默认构建元信息）

cp env.docker.example .env

# 例：覆盖构建元信息

echo "IMAGE_TAG=dev" >> .env
echo "IMAGE_COMMIT=local" >> .env

# 2) 构建镜像（包含 app/db/redis）

docker compose --env-file .env build

# 3) 启动并映射端口

docker compose --env-file .env up -d

# 4) 查看服务

docker compose ps

````

端口默认：服务 27507（含前端）、Postgres 5432、Redis 6379，可在 `.env` 中调整。若需清理本地数据卷：

```sh
docker compose --env-file .env down -v
````

## 其他命令

- 本地开发：`pnpm install` 然后 `pnpm dev`
- 仅启动单个服务开发：
  - 前端：`pnpm --filter web dev`
  - 后端：进入 `apps/server` 后 `air` 或 `go run ./cmd`
    > > > > > > > main
