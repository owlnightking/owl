#!/usr/bin/env bash
# stop.sh — 停止所有开发服务并清理对应端口
# 用法: pnpm stop
# 策略: 先对整个 dev.sh 进程组优雅 SIGTERM（连同 pnpm 管道一起收掉，避免残留孤儿报错），
#       再按 .env 端口兜底强杀仍占用的进程。

set -uo pipefail
cd "$(dirname "$0")/.."

API_PORT="$(grep -E '^API_PORT=' .env 2>/dev/null | cut -d= -f2 | tr -d ' ' || true)"
CRON_PORT="$(grep -E '^CRON_PORT=' .env 2>/dev/null | cut -d= -f2 | tr -d ' ' || true)"
GATEWAY_PORT="$(grep -E '^GATEWAY_PORT=' .env 2>/dev/null | cut -d= -f2 | tr -d ' ' || true)"
OWL_WEB_PORT="$(grep -E '^OWL_WEB_PORT=' .env 2>/dev/null | cut -d= -f2 | tr -d ' ' || true)"
ADMIN_WEB_PORT="$(grep -E '^ADMIN_WEB_PORT=' .env 2>/dev/null | cut -d= -f2 | tr -d ' ' || true)"
CRON_WEB_PORT="$(grep -E '^CRON_WEB_PORT=' .env 2>/dev/null | cut -d= -f2 | tr -d ' ' || true)"

PORTS=("${GATEWAY_PORT:-5173}" "${API_PORT:-3000}" "${CRON_PORT:-3001}" "${OWL_WEB_PORT:-5273}" "${ADMIN_WEB_PORT:-5274}" "${CRON_WEB_PORT:-5275}")

STOPPED=0

# 1) 优雅停止 dev.sh 进程组（dev.sh 与其所有后台管道同组）
self_pgid="$(ps -o pgid= -p $$ | tr -d ' ')"
dev_pids="$(pgrep -f 'scripts/dev\.sh' 2>/dev/null || true)"
for pid in $dev_pids; do
  pgid="$(ps -o pgid= -p "$pid" 2>/dev/null | tr -d ' ' || true)"
  if [ -n "$pgid" ] && [ "$pgid" != "$self_pgid" ]; then
    echo "[stop] sending SIGTERM to dev process group $pgid"
    kill -TERM -- -"$pgid" 2>/dev/null && STOPPED=1
  fi
done

if [ "$STOPPED" -eq 1 ]; then
  sleep 2
fi

# 2) 按端口兜底强杀残留进程
FORCE=0
for port in "${PORTS[@]}"; do
  pids="$(lsof -ti tcp:"$port" 2>/dev/null || true)"
  if [ -n "$pids" ]; then
    echo "[stop] port $port -> force killing $pids"
    kill -9 $pids 2>/dev/null || true
    FORCE=1
  else
    [ "$STOPPED" -eq 1 ] && echo "[stop] port $port -> cleared"
  fi
done

if [ "$STOPPED" -eq 1 ] || [ "$FORCE" -eq 1 ]; then
  echo "[stop] all services stopped, ports cleared."
else
  echo "[stop] no dev service is running."
fi