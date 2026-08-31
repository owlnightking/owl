#!/usr/bin/env bash
# check-feature-rules.sh — 业务特征规则检查
# 1. success 不应出现在 vo 判断逻辑
# 2. filter 不应返回 entity（应返回 VO/DTO）
# 3. id 生成放 domain（禁止在 presentation 生成业务 id）
# 存在 ERROR 时 exit 1

set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

TS_FILES="$(git ls-files -cmo --exclude-standard '*.ts' 2>/dev/null || find . -name '*.ts' -o -name '*.tsx' | grep -v node_modules | grep -v generated)"

ERROR_COUNT=0
WARN_COUNT=0

error() { printf "[ERROR] %s - %s\n" "$1" "$2"; ERROR_COUNT=$((ERROR_COUNT + 1)); }
warn() { printf "[WARN] %s - %s\n" "$1" "$2"; WARN_COUNT=$((WARN_COUNT + 1)); }

# 1. vo 文件中不应出现以 success 为条件的分支判断
check_vo_success() {
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    [[ "$file" != *vo* ]] && continue
    while IFS= read -r line; do
      [ -z "$line" ] && continue
      if echo "$line" | grep -qE '(if|ternary|\?)??.*\bsuccess\b.*(==|===|>|<|&&|\|\|)'; then
        error "$file" "vo 中不应以 success 做条件分支: $(echo "$line" | sed 's/^[0-9]*: *//')"
      fi
    done < <(grep -nE '\bsuccess\b' "$file" 2>/dev/null)
  done <<< "$TS_FILES"
}

# 2. filter / guard 不应返回 entity 类型
check_filter_entity() {
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    [[ "$file" != */filters/* ]] && continue
    if grep -qE ':\\s*(Prisma|\w+)\s*\[\]' "$file" 2>/dev/null; then
      warn "$file" "filter 疑似返回底层类型，确认是否应为 VO/DTO"
    fi
  done <<< "$TS_FILES"
}

# 3. 业务 id 应由 domain 生成，presentation 层禁止直接生成
check_id_generation() {
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    [[ "$file" == */presentation/* || "$file" == */controllers/* ]] || continue
    while IFS= read -r line; do
      [ -z "$line" ] && continue
      if echo "$line" | grep -qiE '(randomUUID|nanoid|crypto\.randomBytes|Date\.now\(\).*id)'; then
        error "$file" "presentation 直接生成业务 id: $(echo "$line" | sed 's/^[0-9]*: *//')"
      fi
    done < <(grep -nE '(randomUUID|nanoid|crypto\.randomBytes)' "$file" 2>/dev/null)
  done <<< "$TS_FILES"
}

check_vo_success
check_filter_entity
check_id_generation

echo "check-feature-rules.sh: ERROR=$ERROR_COUNT WARN=$WARN_COUNT"
if [ "$ERROR_COUNT" -gt 0 ] || [ "$WARN_COUNT" -gt 0 ]; then
  exit 1
fi
exit 0