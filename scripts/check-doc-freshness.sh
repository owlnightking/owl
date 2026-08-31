#!/usr/bin/env bash
# check-doc-freshness.sh — 代码更新但 docs/PROJECT_STATE.md 未同步则 ERROR
# 用法: bash scripts/check-doc-freshness.sh [--staged]
# 原理：基于 git 提交历史比较时间（不依赖文件系统 mtime，避免 checkout 误报）。
#   --staged（pre-commit）: 暂存区有源码改动但文档落后于源码最新提交 → ERROR
#   all（verify:quick/CI）: 源码最近提交晚于状态文档最近提交 → ERROR
# 代码路径仅统计 src 与 prisma，排除 package.json 版本 bump。

set -uo pipefail
export LC_ALL=C

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

DOC="docs/PROJECT_STATE.md"
[ -f "$DOC" ] || { echo "[ERROR] $DOC 缺失，请先运行 bash scripts/update-state.sh 生成"; exit 1; }

# 版本 bump 只动 package.json，不算"代码"。
# 注意：git log 的 pathspec 不做 glob 展开，必须先展开成具体目录。
CODE_DIRS=""
for p in apps/*/src packages/*/src packages/*/prisma; do
  if [ -d "$p" ]; then CODE_DIRS="$CODE_DIRS $p"; fi
done
[ -n "$CODE_DIRS" ] || CODE_DIRS="."

MODE="${1:-all}"
ERROR_COUNT=0

if [ "$MODE" = "--staged" ]; then
  CODE_STAGED="$(git diff --cached --name-only --diff-filter=ACM -- $CODE_DIRS 2>/dev/null)"
  DOC_STAGED="$(git diff --cached --name-only --diff-filter=ACM -- "$DOC" 2>/dev/null)"
  if [ -n "$CODE_STAGED" ] && [ -z "$DOC_STAGED" ]; then
    LAST_CODE="$(git log -1 --format=%ct -- $CODE_DIRS 2>/dev/null || echo 0)"
    LAST_DOC="$(git log -1 --format=%ct -- "$DOC" 2>/dev/null || echo 0)"
    if [ "${LAST_CODE:-0}" -gt "${LAST_DOC:-0}" ]; then
      TMP_DOC="$(mktemp)"
      bash scripts/update-state.sh >/dev/null 2>&1
      DIFF=$(diff <(git show HEAD:"$DOC" 2>/dev/null || true) "$DOC" 2>/dev/null || true)
      rm -f "$TMP_DOC"
      if [ -n "$DIFF" ]; then
        echo "[ERROR] 源码有改动但未同步 ${DOC}（版本 bump 除外）"
        echo "        运行: bash scripts/update-state.sh && git add ${DOC}"
        ERROR_COUNT=$((ERROR_COUNT + 1))
      fi
    fi
  fi
else
  LAST_CODE="$(git log -1 --format=%ct -- $CODE_DIRS 2>/dev/null || echo 0)"
  LAST_DOC="$(git log -1 --format=%ct -- "$DOC" 2>/dev/null || echo 0)"
  if [ "${LAST_CODE:-0}" -gt "${LAST_DOC:-0}" ]; then
    bash scripts/update-state.sh >/dev/null 2>&1
    DIFF=$(diff <(git show HEAD:"$DOC" 2>/dev/null || true) "$DOC" 2>/dev/null || true)
    if [ -n "$DIFF" ]; then
      echo "[ERROR] $DOC 落后于源码，运行 bash scripts/update-state.sh 并随改动一起提交"
      ERROR_COUNT=$((ERROR_COUNT + 1))
    fi
  fi
fi

if [ "$ERROR_COUNT" -gt 0 ]; then
  exit 1
fi
echo "check-doc-freshness.sh: OK"
exit 0
