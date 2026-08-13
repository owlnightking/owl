#!/usr/bin/env bash
# check-lint.sh — 全仓 ESLint（--max-warnings 0）
set -uo pipefail

cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ ! -d node_modules/eslint ]; then
  echo "check-lint.sh: eslint 未安装，跳过"
  exit 0
fi

eslint "apps/*/src/**/*.{ts,tsx}" "packages/*/src/**/*.{ts,tsx}" --max-warnings 0
exit $?
