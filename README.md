# Admin 部署说明

## 项目概览

- `apps/web`: Next.js 前端，镜像名 `admin-web`
- `apps/server`: Go 后端，镜像名 `admin-server`
- `deployments/docker/postgres`: PostgreSQL 封装镜像 `admin-postgres`
- `deployments/docker/redis`: Redis 封装镜像 `admin-redis`

## 发布镜像（推送 tag 自动构建）

1. 确认代码干净并更新版本号。
2. 打标签并推送：
   ```sh
   git tag vX.Y.Z
   git push origin vX.Y.Z
   ```
3. GitHub Actions 会为 tag 构建并推送多架构镜像到 GHCR：
   - `ghcr.io/<owner>/admin-web:<tag>` 与 `:latest`
   - `ghcr.io/<owner>/admin-server:<tag>` 与 `:latest`
   - `ghcr.io/<owner>/admin-postgres:<tag>` 与 `:latest`
   - `ghcr.io/<owner>/admin-redis:<tag>` 与 `:latest`

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
<<<<<<< HEAD
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

# 1) 准备环境变量（可在 .env 中覆盖默认镜像前缀/tag）

cp env.docker.example .env

# 例：本地构建用本地主机仓库名

echo "IMAGE_REGISTRY=local" >> .env
echo "IMAGE_OWNER=admin-local" >> .env
echo "IMAGE_TAG=dev" >> .env

# 2) 构建镜像（包含 web/server/db/redis）

docker compose --env-file .env build

# 3) 启动并映射端口

docker compose --env-file .env up -d

# 4) 查看服务

docker compose ps

````

端口默认：前端 3000、后端 27401、Postgres 5432、Redis 6379，可在 `.env` 中调整。若需清理本地数据卷：

```sh
docker compose --env-file .env down -v
````

## 其他命令

- 本地开发：`pnpm install` 然后 `pnpm dev`
- 仅启动单个服务开发：
  - 前端：`pnpm --filter web dev`
  - 后端：进入 `apps/server` 后 `air` 或 `go run ./cmd`
    > > > > > > > main
