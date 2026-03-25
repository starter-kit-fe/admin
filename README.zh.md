# Admin

一个基于 Next.js + Go 的全栈管理后台，前后端打包在单一 Docker 镜像中。

[English](./README.md)

## 目录

- [项目结构](#项目结构)
- [本地开发](#本地开发)
- [更新依赖](#更新依赖)
- [更新 shadcn/ui 组件](#更新-shadcnui-组件)
- [Docker 部署](#docker-部署)
- [发布新版本](#发布新版本)

---

## 项目结构

```
.
├── apps/
│   ├── web/          # Next.js 前端（App Router）
│   └── server/       # Go 后端 + Dockerfile
├── packages/
│   └── ui/           # 共享 shadcn/ui 组件库
├── deployments/
│   └── nginx.conf    # Nginx 反向代理参考配置
├── docker-compose.yml
├── .env.example
└── Makefile
```

**技术栈**

| 层     | 技术                                           |
| ------ | ---------------------------------------------- |
| 前端   | Next.js 16、Tailwind v4、TanStack Query、Jotai |
| 后端   | Go 1.24、Gin、GORM                             |
| 数据库 | PostgreSQL 17                                  |
| 缓存   | Redis 7                                        |
| 部署   | Docker + GHCR 多架构镜像（amd64 / arm64）      |

---

## 本地开发

**前置要求**：Node.js ≥ 18、pnpm 9、Go 1.24

```sh
# 安装依赖
pnpm install

# 启动全栈开发服务（前端 + 后端热重载）
pnpm dev
```

其他常用命令：

```sh
pnpm build        # 构建所有应用
pnpm lint         # ESLint 检查
pnpm check-types  # TypeScript 类型检查
pnpm format       # Prettier 格式化
pnpm docs         # 生成 Swagger 文档
```

---

## 更新依赖

项目使用 pnpm workspaces + Turborepo，在根目录统一管理依赖。

```sh
# 交互式选择要更新的包（推荐）
pnpm update --interactive --latest

# 更新指定包（所有工作区）
pnpm update <package-name> --recursive

# 更新某个应用内的包
pnpm --filter=web update <package-name>
pnpm --filter=ui update <package-name>
```

更新后运行 `pnpm build` 确认无编译错误。

---

## 更新 shadcn/ui 组件

shadcn/ui 组件集中存放在 `packages/ui`，由 `apps/web` 通过 `@repo/ui/components` 引用。**所有组件操作都应在 `packages/ui` 目录下执行。**

### 添加新组件

```sh
cd packages/ui
pnpm dlx shadcn@latest add <component-name>

# 示例
pnpm dlx shadcn@latest add calendar
pnpm dlx shadcn@latest add data-table
```

### 覆盖更新已有组件

```sh
cd packages/ui
pnpm dlx shadcn@latest add <component-name> --overwrite
```

### 批量更新全部组件

```sh
cd packages/ui
pnpm dlx shadcn@latest add --all --overwrite
```

> **注意**：shadcn/ui 组件是源码拷贝（不是 npm 包），覆盖更新后需检查 diff，确认本地修改未被覆盖。

在 `apps/web` 中使用组件：

```tsx
import { Button } from '@repo/ui/components/button';
```

---

## Docker 部署

**前置要求**：服务器已安装 Docker 和 Docker Compose v2。

### 首次部署

**1. 克隆仓库**

```sh
git clone <repo-url>
cd admin
```

**2. 创建 `.env` 文件**

```sh
cp .env.example .env
```

只需填写一项必填配置：

```env
POSTGRES_PASSWORD=your_secure_password
```

`AUTH_SECRET`、`DB_URL`、`REDIS_URL` 均会自动生成或推导，无需手动配置。

可选项：

```env
# 指定镜像版本（默认 latest）
APP_IMAGE=ghcr.io/<owner>/admin:v26.325.1133

# 自定义端口（默认 27507）
APP_PORT=27507
```

**3. 启动**

```sh
make up
```

`make up` 会自动：
- 检查并从 `.env.example` 初始化 `.env`（如不存在）
- 首次运行时生成随机 `AUTH_SECRET`（重启后保持不变）
- 拉起 app + postgres + redis 三个容器

**4. 验证**

```sh
docker compose ps        # 查看容器状态
docker compose logs -f   # 查看日志
```

访问 `http://服务器IP:27507`。

---

### 更新版本

```sh
# 修改 .env 中的镜像版本
APP_IMAGE=ghcr.io/<owner>/admin:v26.325.xxxx

# 拉取新镜像并重启
docker compose pull
docker compose up -d
```

### 停止服务

```sh
make down
```

### 数据持久化

PostgreSQL 和 Redis 的数据保存在 Docker named volumes（`postgres_data`、`redis_data`），`make down` 不会删除数据。

**完全重置**（删除所有数据）：

```sh
docker compose down -v
```

### 私有镜像登录

如果 GHCR 包为 private，拉取前需要先登录：

```sh
echo <PAT> | docker login ghcr.io -u <username> --password-stdin
```

PAT 需要 `read:packages` 权限。

---

## 发布新版本

推送 tag 后 GitHub Actions 自动构建 amd64 + arm64 多架构镜像并推送到 GHCR。

```sh
# 自动计算版本号、提交、打 tag、推送
make push-tag
```

构建产物：

- `ghcr.io/<owner>/admin:<tag>`
- `ghcr.io/<owner>/admin:latest`
