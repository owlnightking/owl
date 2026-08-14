#!/usr/bin/env bash
# release.sh — 版本发布脚本（verify:quick → version bump → commit）
# 用法:
#   bash scripts/release.sh all patch          全部包 patch 升级
#   bash scripts/release.sh all minor          全部包 minor 升级
#   bash scripts/release.sh api-service patch  仅 api-service patch 升级
#   bash scripts/release.sh cron-service minor 仅 cron-service minor 升级
# 脚本不执行 push，由开发者手动 git push。

set -uo pipefail
cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ── 参数校验 ──────────────────────────────────────────────
APP="${1:-}"
BUMP="${2:-}"

VALID_APPS=(all api-service cron-service admin-web owl-web cron-web)
VALID_BUMPS=(patch minor major)

usage() {
  echo "usage: bash scripts/release.sh <app> <bump>"
  echo "  app:   ${VALID_APPS[*]}"
  echo "  bump:  ${VALID_BUMPS[*]}"
  echo "  example: bash scripts/release.sh api-service patch"
  exit 1
}

if [[ -z "$APP" || -z "$BUMP" ]]; then
  usage
fi

if [[ ! " ${VALID_APPS[*]} " =~ " ${APP} " ]]; then
  echo "error: unknown app '${APP}'"
  usage
fi

if [[ ! " ${VALID_BUMPS[*]} " =~ " ${BUMP} " ]]; then
  echo "error: unknown bump type '${BUMP}'"
  usage
fi

# ── Step 1: verify:quick ──────────────────────────────────
echo ""
echo "=== Step 1: verify:quick ==="
if ! pnpm verify:quick; then
  echo ""
  echo "error: verify:quick failed, aborting release."
  exit 1
fi

# ── Step 2: version bump ──────────────────────────────────
echo ""
echo "=== Step 2: version bump (${APP} ${BUMP}) ==="

if [ "$APP" = "all" ]; then
  pnpm "version:all:${BUMP}"
else
  pnpm "version:${APP}:${BUMP}"
fi

# ── Step 3: commit ────────────────────────────────────────
echo ""
echo "=== Step 3: commit ==="

# 收集被 version 命令修改的 package.json 文件
CHANGED_FILES=()
if [ "$APP" = "all" ]; then
  CHANGED_FILES+=(package.json)
  for pkg in apps/*/package.json packages/*/package.json; do
    CHANGED_FILES+=("$pkg")
  done
else
  CHANGED_FILES+=("apps/${APP}/package.json")
fi

# 只 add 被修改的 package.json
for f in "${CHANGED_FILES[@]}"; do
  if [ -f "$f" ]; then
    git add "$f"
  fi
done

# 获取新版本号
if [ "$APP" = "all" ]; then
  NEW_VERSION=$(node -p "require('./package.json').version")
  COMMIT_MSG="chore: bump version to ${NEW_VERSION}"
else
  NEW_VERSION=$(node -p "require('./apps/${APP}/package.json').version")
  COMMIT_MSG="chore(${APP}): bump version to ${NEW_VERSION}"
fi

git commit -m "$COMMIT_MSG"

echo ""
echo "=== Release prepared: ${APP} → ${NEW_VERSION} ==="
echo "Review with: git log -1"
echo "Push when ready: git push origin main"
