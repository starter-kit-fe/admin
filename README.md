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

## 其他命令

- 本地开发：`pnpm install` 然后 `pnpm dev`
- 仅启动单个服务开发：
  - 前端：`pnpm --filter web dev`
  - 后端：进入 `apps/server` 后 `air` 或 `go run ./cmd`
