#!/usr/bin/env bash
# check-architecture.sh — Owl 架构护栏（16 项）
# 用法: bash scripts/check-architecture.sh [--staged]
# 存在 ERROR 时 exit 1；--staged 只查 git 暂存文件

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

MODE="${1:-all}"
ERROR_COUNT=0
WARN_COUNT=0

error() { printf "[ERROR] %s - %s\n" "$1" "$2"; ERROR_COUNT=$((ERROR_COUNT + 1)); }
warn() { printf "[WARN] %s - %s\n" "$1" "$2"; WARN_COUNT=$((WARN_COUNT + 1)); }

# 跨模块内部路径：../../{module}/{layer}/...（两层及以上相对路径）
CROSS_MODULE_INTERNAL="(\.\./){2,}[a-z0-9-]+/(domain|application|infrastructure|presentation)/"

# ---------- 文件收集 ----------
if [ "$MODE" = "--staged" ]; then
  TS_FILES="$(git diff --cached --name-only --diff-filter=ACM -- '*.ts' '*.tsx')"
  ALL_FILES="$(git diff --cached --name-only --diff-filter=ACM)"
else
  TS_FILES="$(find apps packages -type f \( -name '*.ts' -o -name '*.tsx' \) -not -path '*/node_modules/*' -not -path '*/generated/*' 2>/dev/null)"
  ALL_FILES="$(find apps packages scripts docker .github -type f -not -path '*/node_modules/*' -not -path '*/generated/*' 2>/dev/null)"
fi

if [ -z "$TS_FILES" ]; then
  echo "check-architecture.sh: no TS files to check"
  exit 0
fi

# ---------- 1. 跨模块导入检查 ----------
check_cross_module_imports() {
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    while IFS= read -r path; do
      [ -z "$path" ] && continue
      if echo "$path" | grep -qE "$CROSS_MODULE_INTERNAL"; then
        error "$file" "跨模块内部路径导入: $path"
      fi
    done < <(grep -oE "from [\"'][^\"']+[\"']" "$file" 2>/dev/null | sed -E "s/^from [\"']//; s/[\"']$//")
  done <<< "$TS_FILES"
}
check_cross_module_imports

# ---------- 2. DDD 层依赖方向检查 ----------
check_ddd_direction() {
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    case "$file" in
      */domain/*)
        while IFS= read -r path; do
          [ -z "$path" ] && continue
          if echo "$path" | grep -qE "(infrastructure|application|presentation)/"; then
            error "$file" "domain 层依赖了上层: $path"
          fi
        done < <(grep -oE "from [\"'][^\"']+[\"']" "$file" 2>/dev/null | sed -E "s/^from [\"']//; s/[\"']$//" | grep -E "infrastructure|application|presentation")
        ;;
      */application/*)
        while IFS= read -r path; do
          [ -z "$path" ] && continue
          if echo "$path" | grep -qE "infrastructure/"; then
            error "$file" "application 层依赖了 infrastructure: $path"
          fi
        done < <(grep -oE "from [\"'][^\"']+[\"']" "$file" 2>/dev/null | sed -E "s/^from [\"']//; s/[\"']$//" | grep "infrastructure")
        ;;
    esac
  done <<< "$TS_FILES"
}
check_ddd_direction

# ---------- 3. MCP 受限导入检查 ----------
check_mcp_restricted_imports() {
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    if [[ "$file" == */mcp/* ]]; then
      while IFS= read -r path; do
        [ -z "$path" ] && continue
        if echo "$path" | grep -qE "$CROSS_MODULE_INTERNAL"; then
          error "$file" "mcp 直连业务域内部: $path (仅允许 adapter/接口)"
        fi
      done < <(grep -oE "from [\"'][^\"']+[\"']" "$file" 2>/dev/null | sed -E "s/^from [\"']//; s/[\"']$//")
    fi
  done <<< "$TS_FILES"
}
check_mcp_restricted_imports

# ---------- 4. 共享包纯净度检查 ----------
check_shared_purity() {
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    if [[ "$file" == packages/shared/* ]]; then
      if grep -qE "child_process|fs\.write|from ['\"]@nestjs|from ['\"]react|from ['\"]@owl/(database|api|cron)" "$file" 2>/dev/null; then
        error "$file" "shared 包引入了 IO/运行时/框架依赖"
      fi
    fi
  done <<< "$TS_FILES"
}
check_shared_purity

# ---------- 5. 文件大小限制 ----------
check_file_size() {
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    lines=$(wc -l < "$file" 2>/dev/null || echo 0)
    if [ "$lines" -gt 1500 ]; then
      error "$file" "文件行数 $lines 超过 1500"
    elif [ "$lines" -gt 1000 ]; then
      warn "$file" "文件行数 $lines 超过 1000"
    fi
  done <<< "$TS_FILES"
}
check_file_size

# ---------- 6. 受保护文件检查 ----------
check_protected_files() {
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    if [[ "$file" == *generated/* ]] || [[ "$file" == *node_modules/* ]] || [[ "$file" == *.tsbuildinfo ]]; then
      error "$file" "生成文件禁止直接修改/提交"
    fi
  done <<< "$ALL_FILES"
}
check_protected_files

# ---------- 7. 废弃/备份命名检查 ----------
check_deprecated_backup_names() {
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    base="$(basename "$file")"
    if echo "$base" | grep -qiE '(^|[-_])deprecated[-_]|(^|[-_])backup[-_]|(^|[-_])old[-_]'; then
      error "$file" "禁止 deprecated/backup/old 前后缀命名"
    fi
  done <<< "$ALL_FILES"
}
check_deprecated_backup_names

# ---------- 8. 临时文件检查 ----------
check_temp_files() {
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    case "$file" in
      tmp/*) continue ;;
    esac
    if [[ "$file" == *.tmp || "$file" == *.bak || "$file" == debug-* || "$file" == agent-* ]]; then
      error "$file" "临时文件只能放在 tmp/"
    fi
  done <<< "$ALL_FILES"
}
check_temp_files

# ---------- 9. ScheduleModule 单例检查 ----------
check_schedule_singleton() {
  schedule_occurrences=0
  schedule_file=""
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    if grep -q "ScheduleModule.forRoot" "$file" 2>/dev/null; then
      schedule_occurrences=$((schedule_occurrences + 1))
      schedule_file="$file"
    fi
  done <<< "$TS_FILES"
  if [ "$schedule_occurrences" -gt 1 ]; then
    error "$schedule_file" "ScheduleModule.forRoot 出现 $schedule_occurrences 次，必须收敛到任务中心"
  fi
}
check_schedule_singleton

# ---------- 10. 多前端边界检查 ----------
check_frontend_boundary() {
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    case "$file" in
      apps/owl-web/*|apps/admin-web/*|apps/cron-web/*|apps/mobile-web/*)
        while IFS= read -r path; do
          [ -z "$path" ] && continue
          if echo "$path" | grep -qE "^(\.\./)+apps/"; then
            error "$file" "前端禁止跨 app import: $path"
          fi
        done < <(grep -oE "from [\"'][^\"']+[\"']" "$file" 2>/dev/null | sed -E "s/^from [\"']//; s/[\"']$//")
        ;;
    esac
  done <<< "$TS_FILES"
}
check_frontend_boundary

# ---------- 11. 前端代码规范检查 ----------
check_frontend_code_standards() {
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    case "$file" in
      apps/owl-web/*|apps/admin-web/*|apps/cron-web/*|apps/mobile-web/*|apps/portal/*)
        if grep -qE ': *any\b|\bas any\b|<any>' "$file" 2>/dev/null; then
          error "$file" "前端禁止 any"
        fi
        if grep -Pq '[\x{1F300}-\x{1F9FF}\x{2600}-\x{27BF}\x{FE00}-\x{FE0F}\x{1F000}-\x{1F02F}\x{1F0A0}-\x{1F0FF}\x{1F100}-\x{1F64F}\x{1F680}-\x{1F6FF}\x{1F900}-\x{1F9FF}\x{1FA00}-\x{1FA6F}\x{1FA70}-\x{1FAFF}\x{200D}\x{20E3}\x{E0020}-\x{E007F}]' "$file" 2>/dev/null; then
          error "$file" "前端禁止使用颜文字/emoji，应使用 UI 库 Icon 组件"
        fi
        ;;
    esac
  done <<< "$TS_FILES"
}
check_frontend_code_standards

# ---------- 12. 旧前端页面冻结检查（新仓库，无冻结清单 → pass） ----------

# ---------- 13. 路由去重检查 ----------
check_route_dedup() {
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    case "$file" in
      apps/*/src/router*) ;;
      apps/*/src/routes*) ;;
      *) continue ;;
    esac
    dupes=$(grep -oE "path: [\"'][^\"']+[\"']" "$file" 2>/dev/null | sort | uniq -d)
    if [ -n "$dupes" ]; then
      error "$file" "重复路由: $dupes"
    fi
  done <<< "$TS_FILES"
}
check_route_dedup

# ---------- 14. 裸装饰器检查 ----------
check_bare_decorators() {
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    case "$file" in
      */task-center/*|*/cron-service/*) continue ;;
    esac
    if grep -qE '@Cron\(|@Interval\(|@Timeout\(' "$file" 2>/dev/null; then
      error "$file" "禁止裸 @Cron/@Interval/@Timeout，须走任务中心注册"
    fi
  done <<< "$TS_FILES"
}
check_bare_decorators

# ---------- 15. 菜单路由死链检查 ----------
check_menu_route_deadlinks() {
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    case "$file" in
      apps/*/src/router*|apps/*/src/routes*)
        if [ ! -s "$file" ]; then
          error "$file" "路由文件为空"
        fi
        ;;
    esac
  done <<< "$TS_FILES"
}
check_menu_route_deadlinks

# ---------- 16. 模块隔离检查 ----------
check_module_isolation() {
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    if [[ "$file" == apps/api-service/src/modules/* ]]; then
      while IFS= read -r path; do
        [ -z "$path" ] && continue
        if echo "$path" | grep -qE "$CROSS_MODULE_INTERNAL"; then
          error "$file" "跨模块只允许 import index.ts Provider: $path"
        fi
      done < <(grep -oE "from [\"'][^\"']+[\"']" "$file" 2>/dev/null | sed -E "s/^from [\"']//; s/[\"']$//")
    fi
  done <<< "$TS_FILES"
}
check_module_isolation

# ---------- 汇总 ----------
echo "check-architecture.sh: ERROR=$ERROR_COUNT WARN=$WARN_COUNT"
if [ "$ERROR_COUNT" -gt 0 ]; then
  exit 1
fi
exit 0
