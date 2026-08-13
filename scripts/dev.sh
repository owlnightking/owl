#!/usr/bin/env bash
# dev.sh — 顺序启动开发服务
# 用法:
#   pnpm dev           全部 5 个服务（后端先行，前端随后）
#   pnpm dev api       仅 api-service
#   pnpm dev cron      仅 cron-service
#   pnpm dev owl       仅 owl-web 前端
#   pnpm dev admin     仅 admin-web 前端
#   pnpm dev cronweb   仅 cron-web 前端（兼容 pnpm dev cron web / cron-web）
# 启动顺序: api-service → cron-service → cron-web → admin-web → owl-web
# 后端通过 /api/health 探活，前端通过端口连通性探活，就绪后才启动下一个。

set -uo pipefail
cd "$(dirname "$0")/.."

TARGET="${*:-all}"

read_env_port() {
  local key="$1" default="$2"
  local val
  val="$(grep -E "^$key=" .env 2>/dev/null | cut -d= -f2 | tr -d ' ' || true)"
  echo "${val:-$default}"
}

API_PORT="$(read_env_port API_PORT 3000)"
CRON_PORT="$(read_env_port CRON_PORT 3001)"
CRON_WEB_PORT="$(read_env_port CRON_WEB_PORT 5175)"
ADMIN_WEB_PORT="$(read_env_port ADMIN_WEB_PORT 5174)"
OWL_WEB_PORT="$(read_env_port OWL_WEB_PORT 5173)"

launch() {
  local pkg="$1" label="$2" color="$3"
  echo "[dev] starting $pkg ..."
  pnpm -F "$pkg" dev 2>&1 | node scripts/prefix.mjs "$label" "$color" &
}

wait_backend() {
  local port="$1" name="$2"
  echo "[dev] waiting for $name on :$port ..."
  for _ in $(seq 1 60); do
    if curl -sf "http://localhost:$port/api/health" >/dev/null 2>&1; then
      echo "[dev] $name ready."
      return 0
    fi
    sleep 1
  done
  echo "[dev] WARN: $name not ready in 60s, continuing." >&2
}

wait_port() {
  local port="$1" name="$2"
  echo "[dev] waiting for $name on :$port ..."
  for _ in $(seq 1 30); do
    if lsof -ti "tcp:$port" >/dev/null 2>&1; then
      echo "[dev] $name ready."
      return 0
    fi
    sleep 1
  done
  echo "[dev] WARN: $name not ready in 30s, continuing." >&2
}

case "$TARGET" in
  all)
    launch @owl/api-service api 36
    wait_backend "$API_PORT" api-service
    launch @owl/cron-service cron 35
    wait_backend "$CRON_PORT" cron-service
    launch @owl/cron-web cronweb 34
    wait_port "$CRON_WEB_PORT" cron-web
    launch @owl/admin-web admin 33
    wait_port "$ADMIN_WEB_PORT" admin-web
    launch @owl/owl-web owl 32
    wait_port "$OWL_WEB_PORT" owl-web
    ;;
  api)
    launch @owl/api-service api 36
    ;;
  cron)
    launch @owl/cron-service cron 35
    ;;
  owl)
    launch @owl/owl-web owl 32
    ;;
  admin)
    launch @owl/admin-web admin 33
    ;;
  cronweb | cron-web | "cron web")
    launch @owl/cron-web cronweb 34
    ;;
  *)
    echo "usage: pnpm dev [all|api|cron|owl|admin|cronweb]"
    echo "  无参数 = 全部 5 个服务"
    exit 1
    ;;
esac

wait