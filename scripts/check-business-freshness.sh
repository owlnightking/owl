#!/usr/bin/env bash
# check-business-freshness.sh — 计划/决策有更新但 docs/business-snapshot.md 未同步则 ERROR
# 用法: bash scripts/check-business-freshness.sh [--staged]
# 原理：与 check-doc-freshness.sh 同构，基于 git 提交历史比较时间（不依赖 mtime）。
#   业务快照的"事实来源" = 计划文档(implementation-plan.md) + 决策日志(docs/decisions/)。
#   任一来源更新而快照未同步 → 说明业务现状/最新计划可能已漂移，需运行:
#     pnpm business:update "变更摘要" && git add docs/business-snapshot.md
#   --staged（pre-commit）: 暂存区有计划/决策改动但快照未一并暂存 → ERROR
#   all（verify:quick/CI）: 来源最近提交晚于快照最近提交 → ERROR
# 例外：仅版本 bump（package.json）不触发。

set -uo pipefail
export LC_ALL=C

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

DOC="docs/business-snapshot.md"
[ -f "$DOC" ] || { echo "[ERROR] $DOC 缺失，请先创建文档"; exit 1; }

# 业务快照的事实来源：实现计划 + 决策日志（路径需展开为具体目录，git pathspec 不做 glob）
SRC_PATHS="docs/implementation-plan.md docs/decisions"

MODE="${1:-all}"
ERROR_COUNT=0

if [ "$MODE" = "--staged" ]; then
  SRC_STAGED="$(git diff --cached --name-only --diff-filter=ACM -- $SRC_PATHS 2>/dev/null)"
  DOC_STAGED="$(git diff --cached --name-only --diff-filter=ACM -- "$DOC" 2>/dev/null)"
  if [ -n "$SRC_STAGED" ] && [ -z "$DOC_STAGED" ]; then
    LAST_SRC="$(git log -1 --format=%ct -- $SRC_PATHS 2>/dev/null || echo 0)"
    LAST_DOC="$(git log -1 --format=%ct -- "$DOC" 2>/dev/null || echo 0)"
    if [ "${LAST_SRC:-0}" -gt "${LAST_DOC:-0}" ]; then
      echo "[ERROR] 计划/决策有改动但未同步 ${DOC}"
      echo "        运行: pnpm business:update \"变更摘要\" && git add ${DOC}"
      ERROR_COUNT=$((ERROR_COUNT + 1))
    fi
  fi
else
  LAST_SRC="$(git log -1 --format=%ct -- $SRC_PATHS 2>/dev/null || echo 0)"
  LAST_DOC="$(git log -1 --format=%ct -- "$DOC" 2>/dev/null || echo 0)"
  if [ "${LAST_SRC:-0}" -gt "${LAST_DOC:-0}" ]; then
    echo "[ERROR] ${DOC} 落后于计划/决策文档，运行 pnpm business:update \"变更摘要\" 并随改动一起提交"
    ERROR_COUNT=$((ERROR_COUNT + 1))
  fi
fi

if [ "$ERROR_COUNT" -gt 0 ]; then
  exit 1
fi
echo "check-business-freshness.sh: OK"
exit 0
