#!/usr/bin/env bash
# check-frontend-rules.sh — 前端 UI 规则检查
# 1. 组件命名规范
# 2. UI 库跨端导入
# 3. 内联 style 检测
# 4. 硬编码颜色值检测
# 5. emoji/颜文字检测
# 6. 操作反馈组件检测（web: Notification, mobile: Notify）
# 7. 骨架屏加载检测
# 所有问题均为 ERROR 级别，存在即 exit 1（阻断提交）

set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# 收集前端文件
FRONTEND_FILES="$(find apps -name '*.tsx' -o -name '*.ts' | grep -v node_modules | grep -v dist || true)"

ERROR_COUNT=0

error() { printf "[ERROR] %s - %s\n" "$1" "$2"; ERROR_COUNT=$((ERROR_COUNT + 1)); }

# 1. 页面组件命名规范（必须以 Page.tsx 结尾）
check_page_naming() {
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    [[ "$file" != */pages/* ]] && continue
    [[ "$file" == *Page.tsx ]] && continue
    [[ "$file" == *index.tsx ]] && continue
    error "$file" "页面组件必须以 Page.tsx 结尾（如 UsersPage.tsx）"
  done <<< "$FRONTEND_FILES"
}

# 2. UI 库跨端导入检测
check_ui_library_cross_import() {
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    case "$file" in
      */mobile-web/*)
        if grep -qE 'from ["\x27]@arco-design/web-react' "$file" 2>/dev/null; then
          error "$file" "mobile-web 禁止导入 @arco-design/web-react"
        fi
        ;;
      */admin-web/*|*/cron-web/*|*/owl-web/*|*/portal/*)
        if grep -qE 'from ["\x27]@arco-design/mobile-react' "$file" 2>/dev/null; then
          error "$file" "Web 端应用禁止导入 @arco-design/mobile-react"
        fi
        ;;
    esac
  done <<< "$FRONTEND_FILES"
}

# 3. 内联 style 检测（排除 Arco 组件必要属性）
check_inline_style() {
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    while IFS= read -r line; do
      [ -z "$line" ] && continue
      # 排除 Arco 组件的 width/height/style={{ height: ... }} 等必要属性
      if echo "$line" | grep -qE 'style=\{\{' 2>/dev/null; then
        # 检查是否只包含 width/height/borderBottom 等必要属性
        if ! echo "$line" | grep -qE 'style=\{\{\s*(width|height|borderLeft|borderBottom|paddingLeft|top|left|right|bottom)' 2>/dev/null; then
          error "$file" "检测到内联 style，优先使用 Tailwind 工具类"
        fi
      fi
    done < <(grep -n 'style={{' "$file" 2>/dev/null)
  done <<< "$FRONTEND_FILES"
}

# 4. 硬编码颜色值检测（HEX/RGB）
check_hardcoded_colors() {
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    while IFS= read -r line; do
      [ -z "$line" ] && continue
      # 排除 Tailwind 配置文件和 CSS 文件
      [[ "$file" == *tailwind.config* ]] && continue
      [[ "$file" == *.css ]] && continue
      # 检测 HEX 颜色
      if echo "$line" | grep -qE '"#[0-9a-fA-F]{3,8}"' 2>/dev/null; then
        error "$file" "检测到硬编码 HEX 颜色，优先使用 Tailwind 调色板"
      fi
    done < <(grep -nE '"#[0-9a-fA-F]{3,8}"' "$file" 2>/dev/null)
  done <<< "$FRONTEND_FILES"
}

# 5. emoji/颜文字检测
check_emoji() {
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    [[ "$file" != *.tsx && "$file" != *.ts ]] && continue
    while IFS= read -r line; do
      [ -z "$line" ] && continue
      # 检测 Unicode emoji
      if echo "$line" | grep -qP '[\x{1F300}-\x{1F9FF}\x{2600}-\x{26FF}\x{2700}-\x{27BF}]' 2>/dev/null; then
        error "$file" "源码中禁止直接使用 Unicode emoji，请使用 UI 库 Icon 组件"
      fi
    done < <(grep -nP '[\x{1F300}-\x{1F9FF}\x{2600}-\x{26FF}\x{2700}-\x{27BF}]' "$file" 2>/dev/null)
  done <<< "$FRONTEND_FILES"
}

# 6. 操作反馈组件检测（web: Notification, mobile: Notify）
check_notification_component() {
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    [[ "$file" != *.tsx && "$file" != *.ts ]] && continue
    case "$file" in
      */admin-web/*|*/cron-web/*|*/owl-web/*|*/portal/*)
        # Web 端应该使用 Notification
        if grep -qE 'Notify\.(success|error|warning|info)' "$file" 2>/dev/null; then
          error "$file" "Web 端应使用 Notification 组件，禁止使用 Notify"
        fi
        ;;
      */mobile-web/*)
        # Mobile 端应该使用 Notify
        if grep -qE 'Notification\.(success|error|warning|info)' "$file" 2>/dev/null; then
          error "$file" "Mobile 端应使用 Notify 组件，禁止使用 Notification"
        fi
        ;;
    esac
  done <<< "$FRONTEND_FILES"
}

# 7. 骨架屏加载检测（列表页必须有骨架屏）
check_skeleton_loading() {
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    [[ "$file" != *Page.tsx ]] && continue
    # 检查是否有 loading 状态和 Skeleton 组件
    if grep -qE 'useState.*loading' "$file" 2>/dev/null; then
      if ! grep -qE 'Skeleton' "$file" 2>/dev/null; then
        error "$file" "页面有 loading 状态但未使用 Skeleton 骨架屏组件"
      fi
    fi
  done <<< "$FRONTEND_FILES"
}

check_page_naming
check_ui_library_cross_import
check_inline_style
check_hardcoded_colors
check_emoji
check_notification_component
check_skeleton_loading

echo "check-frontend-rules.sh: ERROR=$ERROR_COUNT"
if [ "$ERROR_COUNT" -gt 0 ]; then
  exit 1
fi
exit 0
