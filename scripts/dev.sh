#!/usr/bin/env bash
# dev.sh — 选择性启动开发服务
# 用法:
#   pnpm dev           全部 5 个服务
#   pnpm dev api       仅 api-service
#   pnpm dev cron      仅 cron-service
#   pnpm dev owl       仅 owl-web 前端
#   pnpm dev admin     仅 admin-web 前端
#   pnpm dev cronweb   仅 cron-web 前端（兼容 pnpm dev cron web / cron-web）

set -uo pipefail
cd "$(dirname "$0")/.."

TARGET="${*:-all}"

run() {
  local pkg="$1" label="$2" color="$3"
  echo "[dev] starting $pkg ..."
  pnpm -F "$pkg" dev 2>&1 | node scripts/prefix.mjs "$label" "$color" &
}

case "$TARGET" in
  all)
    run @owl/api-service api 36
    run @owl/cron-service cron 35
    run @owl/owl-web owl 32
    run @owl/admin-web admin 33
    run @owl/cron-web cronweb 34
    ;;
  api)
    run @owl/api-service api 36
    ;;
  cron)
    run @owl/cron-service cron 35
    ;;
  owl)
    run @owl/owl-web owl 32
    ;;
  admin)
    run @owl/admin-web admin 33
    ;;
  cronweb | cron-web | "cron web")
    run @owl/cron-web cronweb 34
    ;;
  *)
    echo "usage: pnpm dev [all|api|cron|owl|admin|cronweb]"
    echo "  无参数 = 全部 5 个服务"
    exit 1
    ;;
esac

wait