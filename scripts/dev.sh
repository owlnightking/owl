#!/usr/bin/env bash
# dev.sh — 顺序启动开发服务
# 用法:
#   pnpm dev           全部 5 个服务 + 统一入口网关
#   pnpm dev api       仅 api-service
#   pnpm dev cron      仅 cron-service
#   pnpm dev owl       仅 owl-web 前端
#   pnpm dev admin     仅 admin-web 前端
#   pnpm dev cronweb   仅 cron-web 前端（兼容 pnpm dev cron web / cron-web）
#   pnpm dev mobile    仅 mobile-web 前端
# 启动顺序: api-service → cron-service → cron-web → admin-web → owl-web → mobile-web → gateway
# 后端通过 /api/health 探活，前端通过端口连通性探活，就绪后才启动下一个。
# 全部就绪后 gateway 监听 GATEWAY_PORT，按 /owl /admin /cron /m 前缀分发。

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
GATEWAY_PORT="$(read_env_port GATEWAY_PORT 5173)"
CRON_WEB_PORT="$(read_env_port CRON_WEB_PORT 5275)"
ADMIN_WEB_PORT="$(read_env_port ADMIN_WEB_PORT 5274)"
OWL_WEB_PORT="$(read_env_port OWL_WEB_PORT 5273)"
MOBILE_WEB_PORT="$(read_env_port MOBILE_WEB_PORT 5276)"

launch() {
  local pkg="$1" label="$2" color="$3"
  echo "[dev] starting $pkg ..."
  FORCE_COLOR=1 pnpm -F "$pkg" dev 2>&1 | node scripts/prefix.mjs "$label" "$color" &
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
    launch @owl/mobile-web mobile 31
    wait_port "$MOBILE_WEB_PORT" mobile-web
    echo "[dev] starting gateway ..."
    node scripts/gateway.mjs 2>&1 | node scripts/prefix.mjs gateway 35 &
    wait_port "$GATEWAY_PORT" gateway
    echo "[dev] ==================================================="
    echo "[dev]   访问入口（唯一）:  http://localhost:$GATEWAY_PORT"
    echo "[dev]     业务工作台 owl :  http://localhost:$GATEWAY_PORT/owl/"
    echo "[dev]     管理台 admin  :  http://localhost:$GATEWAY_PORT/admin/"
    echo "[dev]     定时任务 cron :  http://localhost:$GATEWAY_PORT/cron/"
    echo "[dev]     移动端 mobile :  http://localhost:$GATEWAY_PORT/m/"
    echo "[dev]   局域网访问请将 localhost 换成局域网 IP（如 192.168.x.x）"
    echo "[dev]   内部端口 5273/5274/5275/5276 仅本机网关代理使用，勿直接访问"
    echo "[dev] ==================================================="
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
  mobile)
    launch @owl/mobile-web mobile 31
    ;;
  admin)
    launch @owl/admin-web admin 33
    ;;
  cronweb | cron-web | "cron web")
    launch @owl/cron-web cronweb 34
    ;;
  *)
    echo "usage: pnpm dev [all|api|cron|owl|admin|cronweb|mobile]"
    echo "  无参数 = 全部 6 个服务"
    exit 1
    ;;
esac

wait