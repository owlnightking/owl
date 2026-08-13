#!/usr/bin/env bash
# smoke.sh — 冒烟测试：启动/连接 server → GET /health → 断言核心 API
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

BASE_URL="${SMOKE_BASE_URL:-http://localhost:3000/api}"
FAIL=0

check_http() {
  local path="$1"
  local expect_code="$2"
  local name="$3"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$BASE_URL$path" 2>/dev/null)
  if [ "$code" = "$expect_code" ]; then
    echo "PASS  $name ($path -> $code)"
  else
    echo "FAIL  $name ($path -> $code, expect $expect_code)"
    FAIL=1
  fi
}

# health
check_http "/health" "200" "health"

# 核心 API 冒烟（Phase 0 仅底座就绪时，业务 API 未实现）
check_http "/" "404" "root-not-found"

echo ""
if [ "$FAIL" -eq 0 ]; then
  echo "smoke.sh: PASSED"
  exit 0
else
  echo "smoke.sh: FAILED"
  exit 1
fi
