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

VALID_APPS=(all api-service cron-service admin-web owl-web cron-web mobile-web portal)
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
  pnpm version "${BUMP}" --no-git-tag-version
  pnpm -r exec pnpm version "${BUMP}" --no-git-tag-version
else
  pnpm --filter "@owl/${APP}" exec pnpm version "${BUMP}" --no-git-tag-version
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

# 更新 PROJECT_STATE.md，使其与最新版本一致
echo "更新 docs/PROJECT_STATE.md ..."
bash scripts/update-state.sh || { echo "warning: update-state.sh 失败，跳过状态文档更新"; }

# add 被修改的 package.json 和 PROJECT_STATE.md
for f in "${CHANGED_FILES[@]}"; do
  if [ -f "$f" ]; then
    git add "$f"
  fi
done
git add docs/PROJECT_STATE.md

# 获取新版本号
if [ "$APP" = "all" ]; then
  NEW_VERSION=$(node -p "require('./package.json').version")
  COMMIT_MSG="chore: bump all version"
else
  NEW_VERSION=$(node -p "require('./apps/${APP}/package.json').version")
  COMMIT_MSG="chore: bump ${APP} version"
fi

git commit -m "$COMMIT_MSG"

# ── Step 4: tag（CD 仅监听 v* tag push）──────────────────
echo ""
echo "=== Step 4: tag ==="

if [ "$APP" = "all" ]; then
  TAG="v${NEW_VERSION}"
else
  TAG="v${APP}-${NEW_VERSION}"
fi

if git rev-parse -q --verify "refs/tags/${TAG}" >/dev/null 2>&1; then
  echo "warning: tag ${TAG} already exists, skipping (如需重发先删除旧 tag)。"
else
  git tag -a "${TAG}" -m "${COMMIT_MSG}"
  echo "Created tag: ${TAG}"
fi

echo ""
echo "=== Release prepared: ${APP} → ${NEW_VERSION} ==="
echo "Commit: ${COMMIT_MSG}"
echo "Tag:    ${TAG}（仅版本标记，可选推送）"
echo "Review with: git log -1 && git show ${TAG}"
echo "Push when ready: git push origin main"
