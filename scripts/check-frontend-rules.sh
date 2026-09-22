#!/usr/bin/env bash
# check-frontend-rules.sh — 前端 UI 规则检查
# 1. 组件命名规范
# 2. UI 库跨端导入
# 3. 内联 style 检测
# 4. 硬编码颜色值检测（HEX）
# 5. 操作反馈组件检测（web: Notification, mobile: Notify/Toast）
# 6. 骨架屏加载检测
# 7. 图片上传公共组件检测（admin-web 必须使用 components/ImageUpload）
# 8. 样式方案检测（禁用 CSS Modules / styled-components / 业务自建 .css）
# 9. 设计 token 单一来源（各端 tailwind.config 只允许 content + presets 引用共享预设）
#
# 已移出本脚本、唯一实现见括号（避免同一规则多份实现漂移）：
#   - emoji / 颜文字 → scripts/scan-ai-residue.sh 第 10 条（scripts/lib/find-emoji.mjs）
#   - 单文件 1500 行上限 → scripts/check-architecture.sh 第 5 条（全仓统一，含 >1000 行预警）
#
# 所有问题均为 ERROR 级别，存在即 exit 1（阻断提交）
#
# 实现约定：每条规则只跑一次 grep（结果写临时文件后用 while read 迭代），
# 不要写成「每文件一次进程替换」的嵌套循环——macOS bash 3.2 上进程数一多会 SIGABRT
# （实测本脚本原写法约 40% 概率崩溃、退出码 134），scan-ai-residue.sh 已因同一原因改成这种写法。
# 所有 grep 必须带 -H：只传一个文件时 grep 会省略文件名前缀，${match%%:*} 会取到行号而非路径。

set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

FRONTEND_FILES="$(find apps -name '*.tsx' -o -name '*.ts' | grep -v node_modules | grep -v dist || true)"

ERROR_COUNT=0
error() { printf "[ERROR] %s - %s\n" "$1" "$2"; ERROR_COUNT=$((ERROR_COUNT + 1)); }

if [ -z "$FRONTEND_FILES" ]; then
  echo "check-frontend-rules.sh: no frontend files to check"
  exit 0
fi

MATCH_FILE="$(mktemp)"
trap 'rm -f "$MATCH_FILE"' EXIT

# 从 `file:行号:内容` 中拆出文件与内容
match_file() { echo "${1%%:*}"; }
match_line() {
  local rest="${1#*:}"
  echo "${rest#*:}"
}

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
        grep -qE 'from ["\x27]@arco-design/web-react' "$file" 2>/dev/null &&
          error "$file" "mobile-web 禁止导入 @arco-design/web-react"
        ;;
      */admin-web/*|*/cron-web/*|*/owl-web/*|*/portal/*)
        grep -qE 'from ["\x27]@arco-design/mobile-react' "$file" 2>/dev/null &&
          error "$file" "Web 端应用禁止导入 @arco-design/mobile-react"
        ;;
    esac
  done <<< "$FRONTEND_FILES"
}

# 3. 内联 style 检测（排除 Arco 组件必要属性）
check_inline_style() {
  grep -HnE 'style=\{\{' $FRONTEND_FILES 2>/dev/null > "$MATCH_FILE"
  while IFS= read -r match; do
    [ -z "$match" ] && continue
    # 排除 Arco 组件的必要属性（width / height / 定位等）
    echo "$match" | grep -qE 'style=\{\{\s*(width|height|borderLeft|borderBottom|paddingLeft|top|left|right|bottom)' && continue
    error "$(match_file "$match")" "检测到内联 style，优先使用 Tailwind 工具类"
  done < "$MATCH_FILE"
}

# 4. 硬编码颜色值检测（引号内 HEX）
check_hardcoded_colors() {
  grep -HnE '"#[0-9a-fA-F]{3,8}"' $FRONTEND_FILES 2>/dev/null > "$MATCH_FILE"
  while IFS= read -r match; do
    [ -z "$match" ] && continue
    local file
    file="$(match_file "$match")"
    case "$file" in *tailwind.config*|*.css) continue ;; esac
    error "$file" "检测到硬编码 HEX 颜色，优先使用 Tailwind 调色板"
  done < "$MATCH_FILE"
}

# 5. 操作反馈组件检测（web: Notification，mobile: Notify / Toast）
check_notification_component() {
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    case "$file" in
      */admin-web/*|*/cron-web/*|*/owl-web/*|*/portal/*)
        grep -qE 'Notify\.(success|error|warning|info)' "$file" 2>/dev/null &&
          error "$file" "Web 端应使用 Notification 组件，禁止使用 Notify"
        ;;
      */mobile-web/*)
        grep -qE 'Notification\.(success|error|warning|info)' "$file" 2>/dev/null &&
          error "$file" "Mobile 端应使用 Notify / Toast 组件，禁止使用 Notification"
        ;;
    esac
  done <<< "$FRONTEND_FILES"
}

# 6. 骨架屏加载检测（页面有 loading 状态必须有 Skeleton）
# 注意：`useState.*loading` 匹配不到最常见写法 `const [loading, setLoading] = useState(false)`，
# 因此本规则实际处于漏报状态，详见 docs/frontend-rules.md 8.1 说明；修正前请按人工评审处理。
check_skeleton_loading() {
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    [[ "$file" != *Page.tsx ]] && continue
    grep -qE 'useState.*loading' "$file" 2>/dev/null || continue
    grep -qE 'Skeleton' "$file" 2>/dev/null &&
      continue
    error "$file" "页面有 loading 状态但未使用 Skeleton 骨架屏组件"
  done <<< "$FRONTEND_FILES"
}

# 7. 图片上传公共组件检测（admin-web 必须使用 components/ImageUpload）
check_image_upload_component() {
  grep -HnE '<Upload([^A-Za-z0-9_]|$)|type=["'"'"']file["'"'"']' $FRONTEND_FILES 2>/dev/null > "$MATCH_FILE"
  while IFS= read -r match; do
    [ -z "$match" ] && continue
    local file
    file="$(match_file "$match")"
    [[ "$file" != apps/admin-web/src/* ]] && continue
    [[ "$file" == apps/admin-web/src/components/ImageUpload.tsx ]] && continue
    error "$file" "图片上传必须使用公共组件 ImageUpload（禁止直接使用 Upload / input type=file）"
  done < "$MATCH_FILE"
}

# 8. 样式方案检测（统一 Tailwind：禁止 CSS Modules / styled-components / 业务自建 .css）
check_style_solution() {
  local dirs="apps/admin-web/src apps/mobile-web/src apps/owl-web/src apps/cron-web/src apps/portal/src"

  # 8.1 禁止 CSS Modules 与 styled 文件
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    error "$file" "禁止 CSS Modules / styled 文件，样式统一使用 Tailwind（docs/frontend-rules.md 第七节）"
  done < <(find $dirs \( -name '*.module.css' -o -name '*.module.scss' -o -name '*.module.less' -o -name '*.module.styl' \) 2>/dev/null)

  # 8.2 禁止 styled-components / emotion
  grep -HnE "from [\"'](styled-components|@emotion/[a-z-]+)[\"']" $FRONTEND_FILES 2>/dev/null > "$MATCH_FILE"
  while IFS= read -r match; do
    [ -z "$match" ] && continue
    error "$(match_file "$match")" "禁止 styled-components / emotion，样式统一使用 Tailwind"
  done < "$MATCH_FILE"

  # 8.3 禁止业务自建 .css（各端只允许唯一的 Tailwind 入口 src/index.css；第三方包与预览入口不受限）
  grep -HnE "[\"'](\./|\.\./)[^\"']*\.css[\"']" $FRONTEND_FILES 2>/dev/null > "$MATCH_FILE"
  while IFS= read -r match; do
    [ -z "$match" ] && continue
    echo "$match" | grep -qE "[\"']\.\.?/index\.css[\"']" && continue
    error "$(match_file "$match")" "禁止自建 .css（仅允许各端唯一 Tailwind 入口 ./index.css）"
  done < "$MATCH_FILE"
}

# 9. 设计 token 单一来源：各端 tailwind.config 必须 presets 引用共享预设，且不得自带 theme / plugins
# 共享预设在仓库根 tailwind/（web.cjs 四个 web 端共用、mobile.cjs 移动端专用）。
# 这条规则是「所有页面一份风格」的机制保障：设计 token 只有一处可改，不允许某个端偷偷分叉。
check_tailwind_single_source() {
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    grep -qE 'presets:[[:space:]]*\[' "$file" 2>/dev/null ||
      error "$file" "必须用 presets 引用共享设计基线（tailwind/web.cjs 或 tailwind/mobile.cjs）"
    grep -qE '^[[:space:]]*(theme|plugins)[[:space:]]*:' "$file" 2>/dev/null &&
      error "$file" "设计 token 只允许在 tailwind/ 预设中声明，各 app 配置不得自带 theme / plugins"
  done < <(find apps -maxdepth 2 -name 'tailwind.config.cjs' -not -path '*/node_modules/*' 2>/dev/null)
}

check_page_naming
check_ui_library_cross_import
check_inline_style
check_hardcoded_colors
check_notification_component
check_skeleton_loading
check_image_upload_component
check_style_solution
check_tailwind_single_source

echo "check-frontend-rules.sh: ERROR=$ERROR_COUNT"
if [ "$ERROR_COUNT" -gt 0 ]; then
  exit 1
fi
exit 0
