#!/usr/bin/env bash
# stop.sh — 停止所有开发服务并清理对应端口
# 用法: pnpm stop
# 依据 .env 中的端口（缺省用默认值）清理 api/cron/三个前端进程

set -uo pipefail
cd "$(dirname "$0")/.."

API_PORT="$(grep -E '^API_PORT=' .env 2>/dev/null | cut -d= -f2 | tr -d ' ' || true)"
CRON_PORT="$(grep -E '^CRON_PORT=' .env 2>/dev/null | cut -d= -f2 | tr -d ' ' || true)"
OWL_WEB_PORT="$(grep -E '^OWL_WEB_PORT=' .env 2>/dev/null | cut -d= -f2 | tr -d ' ' || true)"
ADMIN_WEB_PORT="$(grep -E '^ADMIN_WEB_PORT=' .env 2>/dev/null | cut -d= -f2 | tr -d ' ' || true)"
CRON_WEB_PORT="$(grep -E '^CRON_WEB_PORT=' .env 2>/dev/null | cut -d= -f2 | tr -d ' ' || true)"

PORTS=("${API_PORT:-3000}" "${CRON_PORT:-3001}" "${OWL_WEB_PORT:-5173}" "${ADMIN_WEB_PORT:-5174}" "${CRON_WEB_PORT:-5175}")

FOUND=0
for port in "${PORTS[@]}"; do
  pids="$(lsof -ti tcp:"$port" 2>/dev/null || true)"
  if [ -n "$pids" ]; then
    echo "[stop] port $port -> killing $pids"
    kill $pids 2>/dev/null || true
    FOUND=1
  else
    echo "[stop] port $port -> free"
  fi
done

if [ "$FOUND" -eq 1 ]; then
  sleep 1
  echo "[stop] all services stopped, ports cleared."
else
  echo "[stop] no dev service is running."
fi