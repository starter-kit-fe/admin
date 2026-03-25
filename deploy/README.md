# 部署说明

## 目录结构

```
deploy/
└── nginx/
    └── admin.conf.example   # Nginx 反向代理配置示例
docker-compose.yml           # 基础服务（app，支持外部数据库）
docker-compose.infra.yml     # 内置基础设施（postgres + redis）
```

---

## 启动方式

### 方式一：使用外部 Postgres / Redis

适用于已有数据库/缓存实例的场景（云数据库、已有自建实例等）。

**通过环境变量传入：**

```bash
DB_URL=postgres://user:pass@host:5432/dbname \
REDIS_URL=redis://:password@host:6379/0 \
docker compose up -d
```

**通过 `.env` 文件传入（推荐）：**

```bash
# 复制示例文件
cp .env.example .env

# 编辑 .env，填入连接信息
# DB_URL=postgres://user:pass@host:5432/dbname
# REDIS_URL=redis://:password@host:6379/0

docker compose up -d
```

---

### 方式二：使用内置 Postgres / Redis

适用于一体化部署，postgres 和 redis 与 app 同在一个 Docker 网络中。

```bash
# 使用默认密码（仅开发/测试）
docker compose -f docker-compose.yml -f docker-compose.infra.yml up -d

# 指定密码和镜像版本（生产推荐）
IMAGE_TAG=v1.0 \
POSTGRES_PASSWORD=your_strong_password \
docker compose -f docker-compose.yml -f docker-compose.infra.yml up -d
```

**可用环境变量：**

| 变量 | 默认值 | 说明 |
|---|---|---|
| `IMAGE_TAG` | `dev` | 应用镜像版本 |
| `POSTGRES_USER` | `admin` | 数据库用户名 |
| `POSTGRES_PASSWORD` | `changeme` | 数据库密码（同时作为 Redis 密码） |
| `POSTGRES_DB` | `admin` | 数据库名 |
| `REDIS_MAXMEMORY` | `512mb` | Redis 最大内存 |
| `APP_PORT` | `27507` | 应用对外端口 |

---

### 方式三：仅启动基础设施（本地开发）

只启动 postgres 和 redis，应用在宿主机本地运行：

```bash
POSTGRES_PASSWORD=your_password \
docker compose -f docker-compose.infra.yml up -d postgres redis
```

---

## Nginx 配置

参考 `deploy/nginx/admin.conf.example`，复制并修改后使用：

```bash
cp deploy/nginx/admin.conf.example /etc/nginx/conf.d/admin.conf
# 修改 server_name 和 ssl_certificate 路径
nginx -t && nginx -s reload
```

---

## 常用命令

```bash
# 查看日志
docker compose logs -f app

# 停止服务
docker compose down

# 停止并删除数据卷（危险：会清空数据库）
docker compose -f docker-compose.yml -f docker-compose.infra.yml down -v

# 重建镜像并启动
docker compose -f docker-compose.yml -f docker-compose.infra.yml up -d --build
```
