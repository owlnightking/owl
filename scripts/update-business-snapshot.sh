#!/usr/bin/env bash
# update-business-snapshot.sh — 更新 docs/business-snapshot.md 的「最近更新」自动段并格式化
# 用法: bash scripts/update-business-snapshot.sh ["变更摘要"]
# 原则：与 update-state.sh 同构——脚本负责"事实与记录"（自动落最近更新 + prettier），
#       业务功能现状/最新计划的人工内容由提交者随改动维护。
#       不自动 git add（pre-commit 在需要时统一 add）。
# 输出：成功 exit 0；文件缺失 exit 1。

set -uo pipefail
export LC_ALL=C

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

DOC="docs/business-snapshot.md"
[ -f "$DOC" ] || { echo "[ERROR] $DOC 不存在，先创建文档再运行"; exit 1; }

SUMMARY="${1:-业务现状与最新计划更新}"
DATE="$(date +%Y-%m-%d)"
export BIZ_DATE="$DATE"
export BIZ_SUMMARY="$SUMMARY"

# 在 <!-- RECENT-BEGIN --> 标记下插入新记录（最新在前）
perl -0777 -i -pe '
  BEGIN { $entry = "- " . $ENV{"BIZ_DATE"} . ": " . $ENV{"BIZ_SUMMARY"} . "\n"; }
  s{(<!-- RECENT-BEGIN -->\n)}{$1$entry};
' "$DOC"

# 保证 prettier 格式通过
npx prettier --write "$DOC" >/dev/null 2>&1 || true

echo "update-business-snapshot.sh: $DOC 已记录更新（$DATE: $SUMMARY）"
