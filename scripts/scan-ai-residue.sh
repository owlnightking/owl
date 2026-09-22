#!/usr/bin/env bash
# scan-ai-residue.sh — AI 残渣扫描（10 类）
# 用法: bash scripts/scan-ai-residue.sh [--staged]
# 存在 ERROR 或 WARN 时 exit 1
#
# 实现说明：每条规则只跑一次 grep（结果写入临时文件后用 while read 迭代），
# 避免「每文件一次进程替换」在 macOS bash 3.2 上因进程数过多而段错误/挂起。
#
# 所有 grep 必须带 -H：`--staged` 只暂存一个 .ts/.tsx 时 grep 会省略文件名前缀，
# 于是 `${match%%:*}` 取到的是行号而非路径，各条按扩展名/路径的分支（如跳过 *.tsx、
# 跳过 mock 目录）会全部失配，把前端 JSX 里的数字误报成魔法数字而阻断提交。

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
  TS_FILES="$(git ls-files -cmo --exclude-standard '*.ts' '*.tsx' 2>/dev/null | sort -u || find . -name '*.ts' -o -name '*.tsx' | grep -v node_modules | grep -v generated)"
fi

if [ -z "$TS_FILES" ]; then
  echo "scan-ai-residue.sh: no TS files to check"
  exit 0
fi

LIST_FILE="$(mktemp)"
MATCH_FILE="$(mktemp)"
printf '%s\n' "$TS_FILES" > "$LIST_FILE"
trap 'rm -f "$LIST_FILE" "$MATCH_FILE"' EXIT

FILES="$(cat "$LIST_FILE")"

strip_lineno() { echo "$1" | sed 's/^[0-9]*: *//'; }

# 1. 无类型 any 泄漏
check_any() {
  grep -HnE ': *any\b|\bas any\b|<any>' $FILES 2>/dev/null > "$MATCH_FILE"
  while IFS= read -r match; do
    [ -z "$match" ] && continue
    local file="${match%%:*}"
    local rest="${match#*:}"
    error "$file" "any 泄漏: $(strip_lineno "$rest")"
  done < "$MATCH_FILE"
}
check_any

# 2. 魔法数字（非 0/1/2 且非常量上下文；跳过 tsx 样式类、端口声明、mock 数据、描述文本中的数字）
check_magic_numbers() {
  grep -HnE '[^0-9.](3|[4-9]|[1-9][0-9]+)[^0-9]' $FILES 2>/dev/null > "$MATCH_FILE"
  while IFS= read -r match; do
    [ -z "$match" ] && continue
    local file="${match%%:*}"
    local rest="${match#*:}"
    case "$file" in
      *.tsx) continue ;;
      */mock*|*/fake*|*/stub*|*/fixture*) continue ;;
      */data/*) continue ;;
      */seed.ts) continue ;;
    esac
    local line="$(strip_lineno "$rest")"
    if echo "$line" | grep -qE '(const |= 3|= 4|node_modules|@nestjs|version|: [0-9]+,?$|//|status[[:space:]]*(>=|<=|<|>|=)[[:space:]]*[0-9]{3}|Number\(.*\?\?|port:|host:|@Max|@Min|@Length|@MaxLength|@MinLength|@Api|example:|TTL|timeout|maxAge|expiresIn|1000|60 \* 60|24 \* 60|times \*|times >|pageSize.*=|slice\(|getEntry)' ||
      echo "$line" | grep -qE '^[0-9]+:[[:space:]]+[A-Z][A-Z0-9_]*:' ||
      echo "$line" | grep -qE '[a-zA-Z_][a-zA-Z0-9_]*[0-9]+[a-zA-Z0-9_]*[[:space:]]*[]?:,;)}]|^[[:space:]]*[a-zA-Z_][a-zA-Z0-9_]*[0-9]+[a-zA-Z0-9_]*[[:space:]]*[]?:,;)}]|avatar[0-9]+|avatar_[0-9]+|i18n' ||
      echo "$line" | grep -qE 'description:\s*"[^"]*[0-9]+[^"]*"' ||
      echo "$line" | grep -qE 'name:\s*"[^"]*[0-9]+[^"]*"'; then
      continue
    fi
    warn "$file" "疑似魔法数字: $line"
  done < "$MATCH_FILE"
}
check_magic_numbers

# 3. 注释只写"做了什么"（以设置/调用/赋值/打印开头且未解释为什么）
check_comment_quality() {
  grep -HnE '^\s*//\s*(设置|调用|赋值|打印|创建|删除)\s' $FILES 2>/dev/null > "$MATCH_FILE"
  while IFS= read -r match; do
    [ -z "$match" ] && continue
    local file="${match%%:*}"
    local rest="${match#*:}"
    warn "$file" "注释只写做了什么未解释为什么: $(strip_lineno "$rest")"
  done < "$MATCH_FILE"
}
check_comment_quality

# 4. 无意义命名（仅占位符 a/b/tmp/xxx/yyy，data/res 为通用合法名）
check_naming() {
  grep -HnE '\b(a|b|tmp|xxx|yyy)\b\s*[:=]' $FILES 2>/dev/null > "$MATCH_FILE"
  while IFS= read -r match; do
    [ -z "$match" ] && continue
    local file="${match%%:*}"
    local rest="${match#*:}"
    error "$file" "无意义命名: $(strip_lineno "$rest")"
  done < "$MATCH_FILE"
}
check_naming

# 5. TODO/FIXME 无责任人
check_todo() {
  grep -HnE 'TODO|FIXME' $FILES 2>/dev/null > "$MATCH_FILE"
  while IFS= read -r match; do
    [ -z "$match" ] && continue
    local file="${match%%:*}"
    local rest="${match#*:}"
    local line="$(strip_lineno "$rest")"
    if ! echo "$line" | grep -qE '@[A-Za-z0-9_]+'; then
      warn "$file" "TODO/FIXME 无 @责任人: $line"
    fi
  done < "$MATCH_FILE"
}
check_todo

# 6. 重复代码块（同文件 ≥4 处相似行块，跳过测试文件、mock 数据、Prisma include、装饰器、CSS类名）
check_duplicate_blocks() {
  awk '
    length($0) > 0 {
      line = $0
      gsub(/[[:space:]]+/, " ", line)
      key = FILENAME SUBSEP line
      count[key]++
      text[key] = line
      file[key] = FILENAME
    }
    END {
      for (k in count) {
        if (count[k] >= 4) {
          split(k, parts, SUBSEP)
          f = parts[1]
          ln = text[k]
          if (f ~ /\.spec\.ts$|\.test\.ts$/ || f ~ /\/mock|\/fake|\/stub|\/fixture|\/data\//) continue
          if (length(ln) >= 50 && ln !~ /include:|roles:|permissions:|@RequirePermission|@Api|className=|className /) {
            print f "\t" ln " (x" count[k] ")"
          }
        }
      }
    }
  ' $FILES 2>/dev/null > "$MATCH_FILE"
  while IFS=$'\t' read -r file dupe; do
    [ -z "$file" ] && continue
    warn "$file" "疑似重复代码块: $dupe"
  done < "$MATCH_FILE"
}
check_duplicate_blocks

# 7. console.log 残留（非入口文件）
check_console_log() {
  grep -HnE 'console\.log' $FILES 2>/dev/null > "$MATCH_FILE"
  while IFS= read -r match; do
    [ -z "$match" ] && continue
    local file="${match%%:*}"
    local rest="${match#*:}"
    if [[ "$file" != */main.ts && "$file" != */prisma/seed.ts ]]; then
      error "$file" "console.log 残留: $(strip_lineno "$rest")"
    fi
  done < "$MATCH_FILE"
}
check_console_log

# 8. 空 catch 吞异常
check_empty_catch() {
  grep -HnE 'catch\s*(\([^)]*\))?\s*\{\s*\}' $FILES 2>/dev/null > "$MATCH_FILE"
  while IFS= read -r match; do
    [ -z "$match" ] && continue
    local file="${match%%:*}"
    error "$file" "空 catch 吞异常"
  done < "$MATCH_FILE"
}
check_empty_catch

# 9. 未校验外部输入（直接使用 req.body/query/params 未过 DTO）
check_unvalidated_input() {
  grep -HnE '@Body\(\)' $FILES 2>/dev/null > "$MATCH_FILE"
  while IFS= read -r match; do
    [ -z "$match" ] && continue
    local file="${match%%:*}"
    local rest="${match#*:}"
    case "$file" in
      */presentation/*|*/controllers/*) ;;
      *) continue ;;
    esac
    local line="$(strip_lineno "$rest")"
    if echo "$line" | grep -qE '@Body\(\)\s*(body|dto|[a-z]+)\s*:?\s*(any|unknown)?\s*$' && ! echo "$line" | grep -qE 'Dto|DTO'; then
      warn "$file" "外部输入未过 DTO 校验: $line"
    fi
  done < "$MATCH_FILE"
}
check_unvalidated_input

# 10. 禁止颜文字/emoji（图标应使用 UI 库 Icon 组件）
# 实现走 scripts/lib/find-emoji.mjs：grep -P 在 macOS BSD grep 与 Alpine BusyBox grep 上均不受支持，
# 原先配 2>/dev/null 会让本检查静默失效（本地与 CI 都测不出 emoji）。
check_emoji() {
  if ! command -v node >/dev/null 2>&1; then
    error "scripts/lib/find-emoji.mjs" "node 不可用，emoji 检查无法执行，不得静默跳过"
    return
  fi
  node scripts/lib/find-emoji.mjs $FILES 2>/dev/null > "$MATCH_FILE"
  while IFS= read -r match; do
    [ -z "$match" ] && continue
    local file="${match%%:*}"
    local rest="${match#*:}"
    error "$file" "禁止使用颜文字/emoji，应使用 UI 库 Icon 组件: $(strip_lineno "$rest")"
  done < "$MATCH_FILE"
}
check_emoji

# 11. UI 组件库交叉导入检查已移出本脚本
# 该规则属前端 UI 规范，唯一实现收敛到 check-frontend-rules.sh 第 2 条，避免两处实现漂移。

echo "scan-ai-residue.sh: ERROR=$ERROR_COUNT WARN=$WARN_COUNT"
if [ "$ERROR_COUNT" -gt 0 ] || [ "$WARN_COUNT" -gt 0 ]; then
  echo "scan-ai-residue.sh: ERROR/WARN 均阻断，请修复后重试"
  exit 1
fi
exit 0
