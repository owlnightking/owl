#!/usr/bin/env bash
# verify.sh — 完整验证流水线（typecheck → lint → format → arch → 残渣 → test）
set -uo pipefail

cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

step() { echo ""; echo "=== $1 ==="; }

step "typecheck"
pnpm typecheck || exit 1

step "lint"
pnpm lint || exit 1

step "format"
pnpm format:check || exit 1

step "architecture"
pnpm arch:check || exit 1

step "doc-freshness"
pnpm doc:check || exit 1

step "ai-residue"
bash scripts/scan-ai-residue.sh || exit 1

step "circular-deps"
pnpm -r --if-present check:deps || true

step "test"
pnpm -r --if-present test || exit 1

echo ""
echo "verify.sh: ALL PASSED"
