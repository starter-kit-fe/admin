#!/bin/sh
set -e

ENV_FILE=".env"

# 初始化 .env
if [ ! -f "$ENV_FILE" ]; then
  cp env.docker.example "$ENV_FILE"
fi

# 自动生成 AUTH_SECRET（仅首次，之后固定不变）
if ! grep -q "^AUTH_SECRET=" "$ENV_FILE" 2>/dev/null; then
  SECRET=$(openssl rand -hex 32)
  echo "AUTH_SECRET=${SECRET}" >> "$ENV_FILE"
  echo "✓ AUTH_SECRET 已自动生成"
fi

docker compose up -d "$@"
