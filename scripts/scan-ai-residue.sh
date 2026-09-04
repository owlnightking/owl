#!/usr/bin/env bash
# scan-ai-residue.sh — AI 残渣扫描（11 类）
# 用法: bash scripts/scan-ai-residue.sh [--staged]
# 存在 ERROR 或 WARN 时 exit 1

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

MODE="${1:-all}"
ERROR_COUNT=0
WARN_COUNT=0

error() { printf "[ERROR] %s - %s\n" "$1" "$2"; ERROR_COUNT=$((ERROR_COUNT + 1)); }
warn() { printf "[WARN] %s - %s\n" "$1" "$2"; WARN_COUNT=$((WARN_COUNT + 1)); }

if [ "$MODE" = "--staged" ]; then
  TS_FILES="$(git diff --cached --name-only --diff-filter=ACM -- '*.ts' '*.tsx')"
else
  TS_FILES="$(git ls-files -cmo --exclude-standard '*.ts' '*.tsx' 2>/dev/null || find . -name '*.ts' -o -name '*.tsx' | grep -v node_modules | grep -v generated)"
fi

if [ -z "$TS_FILES" ]; then
  echo "scan-ai-residue.sh: no TS files to check"
  exit 0
fi

# 1. 无类型 any 泄漏
check_any() {
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    while IFS= read -r line; do
      [ -z "$line" ] && continue
      if echo "$line" | grep -qE ': *any\b|\bas any\b|<any>'; then
        error "$file" "any 泄漏: $(echo "$line" | sed 's/^[0-9]*: *//')"
      fi
    done < <(grep -nE ': *any\b|\bas any\b|<any>' "$file" 2>/dev/null)
  done <<< "$TS_FILES"
}
check_any

# 2. 魔法数字（非 0/1/2 且非常量上下文；跳过 tsx 样式类、端口声明、mock 数据）
check_magic_numbers() {
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    case "$file" in
      *.tsx) continue ;;
      */mock*|*/fake*|*/stub*|*/fixture*) continue ;;
      */data/*) continue ;;
    esac
    if grep -qE '[^0-9.](3|[4-9]|[1-9][0-9]+)[^0-9]' "$file" 2>/dev/null; then
      while IFS= read -r line; do
        [ -z "$line" ] && continue
        if echo "$line" | grep -qE '(const |= 3|= 4|node_modules|@nestjs|version|: [0-9]+,?$|//|status\s*(>=|<=|<|>|=)\s*[0-9]{3}|Number\(.*\?\?|port:|host:|@Max|@Min|@Length|@MaxLength|@MinLength|timeout|maxAge|expiresIn|1000|60 \* 60|24 \* 60|times \*|times >|pageSize.*=|slice\(|getEntry)' ||
          echo "$line" | grep -qE '^[0-9]+:\s+[A-Z][A-Z0-9_]*:' ||
          echo "$line" | grep -qE '[a-zA-Z_][a-zA-Z0-9_]*[0-9]+[a-zA-Z0-9_]*\s*[?:,;)\]}]|^\s*[a-zA-Z_][a-zA-Z0-9_]*[0-9]+[a-zA-Z0-9_]*\s*[\??:]|avatar[0-9]+|avatar_[0-9]+|i18n'; then
          continue
        fi
        warn "$file" "疑似魔法数字: $(echo "$line" | sed 's/^[0-9]*: *//')"
      done < <(grep -nE '[^0-9.](3|[4-9]|[1-9][0-9]+)[^0-9]' "$file" 2>/dev/null | head -20)
    fi
  done <<< "$TS_FILES"
}
check_magic_numbers

# 3. 注释只写"做了什么"（以设置/调用/赋值/打印开头且未解释为什么）
check_comment_quality() {
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    while IFS= read -r line; do
      [ -z "$line" ] && continue
      if echo "$line" | grep -qE '^\s*//\s*(设置|调用|赋值|打印|创建|删除)\s'; then
        warn "$file" "注释只写做了什么未解释为什么: $(echo "$line" | sed 's/^[0-9]*: *//')"
      fi
    done < <(grep -nE '^\s*//\s*(设置|调用|赋值|打印|创建|删除)\s' "$file" 2>/dev/null)
  done <<< "$TS_FILES"
}
check_comment_quality

# 4. 无意义命名（仅占位符 a/b/tmp/xxx/yyy，data/res 为通用合法名）
check_naming() {
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    while IFS= read -r line; do
      [ -z "$line" ] && continue
      if echo "$line" | grep -qE '\b(a|b|tmp|xxx|yyy)\b\s*[:=]'; then
        error "$file" "无意义命名: $(echo "$line" | sed 's/^[0-9]*: *//')"
      fi
    done < <(grep -nE '\b(a|b|tmp|xxx|yyy)\b\s*[:=]' "$file" 2>/dev/null)
  done <<< "$TS_FILES"
}
check_naming

# 5. TODO/FIXME 无责任人
check_todo() {
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    while IFS= read -r line; do
      [ -z "$line" ] && continue
      if echo "$line" | grep -qE 'TODO|FIXME' && ! echo "$line" | grep -qE '@[A-Za-z0-9_]+'; then
        warn "$file" "TODO/FIXME 无 @责任人: $(echo "$line" | sed 's/^[0-9]*: *//')"
      fi
    done < <(grep -nE 'TODO|FIXME' "$file" 2>/dev/null)
  done <<< "$TS_FILES"
}
check_todo

# 6. 重复代码块（同文件 ≥4 处相似行块，跳过测试文件、mock 数据、Prisma include）
check_duplicate_blocks() {
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    case "$file" in
      *.spec.ts|*.test.ts) continue ;;
      */mock*|*/fake*|*/stub*|*/fixture*) continue ;;
      */data/*) continue ;;
    esac
    dupes=$(awk 'length($0)>0 { gsub(/[[:space:]]+/, " ", $0); lines[NR]=$0 } END {
      for (i=1; i<=NR; i++) { count[lines[i]]++ }
      for (k in count) if (count[k] >= 4 && length(k) >= 50 && k !~ /include:|roles:|permissions:/) print k " (x" count[k] ")"
    }' "$file" 2>/dev/null | head -3)
    if [ -n "$dupes" ]; then
      warn "$file" "疑似重复代码块: $dupes"
    fi
  done <<< "$TS_FILES"
}
check_duplicate_blocks

# 7. console.log 残留（非入口文件）
check_console_log() {
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    if [[ "$file" != */main.ts && "$file" != */prisma/seed.ts ]]; then
      while IFS= read -r line; do
        [ -z "$line" ] && continue
        error "$file" "console.log 残留: $(echo "$line" | sed 's/^[0-9]*: *//')"
      done < <(grep -nE 'console\.log' "$file" 2>/dev/null)
    fi
  done <<< "$TS_FILES"
}
check_console_log

# 8. 空 catch 吞异常
check_empty_catch() {
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    while IFS= read -r line; do
      [ -z "$line" ] && continue
      if echo "$line" | grep -qE 'catch\s*(\([^)]*\))?\s*\{\s*\}'; then
        error "$file" "空 catch 吞异常"
      fi
    done < <(grep -nE 'catch\s*(\([^)]*\))?\s*\{\s*\}' "$file" 2>/dev/null)
  done <<< "$TS_FILES"
}
check_empty_catch

# 9. 未校验外部输入（直接使用 req.body/query/params 未过 DTO）
check_unvalidated_input() {
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    if [[ "$file" == */presentation/* || "$file" == */controllers/* ]]; then
      while IFS= read -r line; do
        [ -z "$line" ] && continue
        if echo "$line" | grep -qE '@Body\(\)\s*(body|dto|[a-z]+)\s*:?\s*(any|unknown)?\s*$' && ! echo "$line" | grep -qE 'Dto|DTO'; then
          warn "$file" "外部输入未过 DTO 校验: $(echo "$line" | sed 's/^[0-9]*: *//')"
        fi
      done < <(grep -nE '@Body\(\)' "$file" 2>/dev/null)
    fi
  done <<< "$TS_FILES"
}
check_unvalidated_input

# 10. 禁止颜文字/emoji（图标应使用 UI 库 Icon 组件）
check_emoji() {
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    while IFS= read -r line; do
      [ -z "$line" ] && continue
      error "$file" "禁止使用颜文字/emoji，应使用 UI 库 Icon 组件: $(echo "$line" | sed 's/^[0-9]*: *//')"
    done < <(grep -Pn '[\x{1F300}-\x{1F9FF}\x{2600}-\x{27BF}\x{FE00}-\x{FE0F}\x{1F000}-\x{1F02F}\x{1F0A0}-\x{1F0FF}\x{1F100}-\x{1F64F}\x{1F680}-\x{1F6FF}\x{1F900}-\x{1F9FF}\x{1FA00}-\x{1FA6F}\x{1FA70}-\x{1FAFF}\x{200D}\x{20E3}\x{E0020}-\x{E007F}]' "$file" 2>/dev/null)
  done <<< "$TS_FILES"
}
check_emoji

# 11. UI 组件库交叉导入（mobile-web 禁用 web-react，web 应用禁用 mobile-react）
check_ui_library_cross_import() {
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    case "$file" in
      */mobile-web/*)
        while IFS= read -r line; do
          [ -z "$line" ] && continue
          error "$file" "mobile-web 禁止导入 @arco-design/web-react，应使用 @arco-design/mobile-react: $(echo "$line" | sed 's/^[0-9]*: *//')"
        done < <(grep -nE "from ['\"]@arco-design/web-react" "$file" 2>/dev/null)
        ;;
      */admin-web/*|*/cron-web/*|*/owl-web/*|*/portal/*)
        while IFS= read -r line; do
          [ -z "$line" ] && continue
          error "$file" "web 应用禁止导入 @arco-design/mobile-react，应使用 @arco-design/web-react: $(echo "$line" | sed 's/^[0-9]*: *//')"
        done < <(grep -nE "from ['\"]@arco-design/mobile-react" "$file" 2>/dev/null)
        ;;
    esac
  done <<< "$TS_FILES"
}
check_ui_library_cross_import

echo "scan-ai-residue.sh: ERROR=$ERROR_COUNT WARN=$WARN_COUNT"
if [ "$ERROR_COUNT" -gt 0 ] || [ "$WARN_COUNT" -gt 0 ]; then
  exit 1
fi
exit 0
