#!/usr/bin/env bash
# check-staged-typecheck.sh — 对暂存文件所在的包执行增量类型检查
set -uo pipefail

cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

STAGED=$(git diff --cached --name-only --diff-filter=ACM)
if [ -z "$STAGED" ]; then
  exit 0
fi

CODE_STAGED=$(echo "$STAGED" | grep -E '\.(ts|tsx)$' || true)
if [ -z "$CODE_STAGED" ]; then
  exit 0
fi

PKGS=$(echo "$CODE_STAGED" | sed -E 's|^([^/]+/[^/]+)/.*|\1|' | sort -u)
FAILED=0

for pkg in $PKGS; do
  if [ -f "$pkg/package.json" ] && grep -q '"typecheck"' "$pkg/package.json"; then
    echo "typecheck: $pkg"
    pnpm --filter "$(jq -r .name "$pkg/package.json")" typecheck || FAILED=1
  fi
done

exit $FAILED
