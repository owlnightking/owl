#!/usr/bin/env bash
# check-typecheck.sh — 全仓 TypeScript 类型检查
set -uo pipefail

cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

pnpm -r --if-present typecheck
exit $?
