#!/usr/bin/env bash
# update-state.sh — 重新生成 docs/PROJECT_STATE.md 的自动段（AUTO-*-BEGIN/END 标记间）
# 用法: bash scripts/update-state.sh
# 原则：脚本负责"事实"（扫描源码生成），人负责"为什么"（人工维护段）。
# 生成完自动跑 prettier 保证 format:check 通过。
# 输出：成功 exit 0；源码缺失 exit 1。

set -uo pipefail
export LC_ALL=C

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

DOC="docs/PROJECT_STATE.md"
[ -f "$DOC" ] || { echo "[ERROR] $DOC 不存在，先创建文档再运行"; exit 1; }

API_SRC="apps/api-service/src"
PRISMA_SCHEMA="packages/database/prisma/schema.prisma"
MIGRATIONS_DIR="packages/database/prisma/migrations"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# ---------- 1. 应用清单 ----------
gen_apps() {
  echo "| app | 类型 | 版本 | 描述 |"
  echo "| --- | --- | --- | --- |"
  for pkg in apps/*/package.json; do
    app="$(basename "$(dirname "$pkg")")"
    name="$(node -p "require('./$pkg').name" 2>/dev/null || echo '?')"
    version="$(node -p "require('./$pkg').version" 2>/dev/null || echo '?')"
    description="$(node -p "require('./$pkg').description || ''" 2>/dev/null || echo '')"
    case "$app" in
      api-service|cron-service) type="后端" ;;
      *) type="前端" ;;
    esac
    echo "| $app | $type | $version | $description |"
  done | sort -t'|' -k2,2 -k1,1
}

# ---------- 2. api-service 模块清单 ----------
gen_modules() {
  echo "| 模块 | app | dom | infra | pres | 状态 |"
  echo "| --- | --- | --- | --- | --- | --- |"
  for mod in "$API_SRC"/modules/*; do
    [ -d "$mod" ] || continue
    name="$(basename "$mod")"
    app_n=0; dom_n=0; infra_n=0; pres_n=0
    [ -d "$mod/application" ] && app_n="$(find "$mod/application" -name '*.ts' ! -name '*.spec.ts' 2>/dev/null | wc -l | tr -d ' ')"
    [ -d "$mod/domain" ] && dom_n="$(find "$mod/domain" -name '*.ts' ! -name '*.spec.ts' 2>/dev/null | wc -l | tr -d ' ')"
    [ -d "$mod/infrastructure" ] && infra_n="$(find "$mod/infrastructure" -name '*.ts' ! -name '*.spec.ts' 2>/dev/null | wc -l | tr -d ' ')"
    [ -d "$mod/presentation" ] && pres_n="$(find "$mod/presentation" -name '*.ts' ! -name '*.spec.ts' 2>/dev/null | wc -l | tr -d ' ')"
    total=$((app_n + dom_n + infra_n + pres_n))
    if [ "$total" -eq 0 ]; then
      status="❌ 空壳"
    elif [ "$app_n" -gt 0 ] && [ "$dom_n" -gt 0 ] && [ "$infra_n" -gt 0 ] && [ "$pres_n" -gt 0 ]; then
      status="✅ 完整"
    else
      status="🟡 不完整"
    fi
    echo "| $name | $app_n | $dom_n | $infra_n | $pres_n | $status |"
  done | sort
}

# ---------- 3. 数据模型 ----------
gen_models() {
  echo "| 模型 | 说明 |"
  echo "| --- | --- |"
  grep -E '^model ' "$PRISMA_SCHEMA" 2>/dev/null | awk '{print "| " $2 " | |"}'
}

# ---------- 4. 迁移 ----------
gen_migrations() {
  echo "| 迁移 | 说明 |"
  echo "| --- | --- |"
  ls -1 "$MIGRATIONS_DIR" 2>/dev/null | grep -v migration_lock | sed 's/^/| /; s/$/ | |/'
}

# ---------- 5. 测试覆盖 ----------
gen_tests() {
  echo "| 目录 | spec 数量 |"
  echo "| --- | --- |"
  for d in apps/* packages/*; do
    [ -d "$d" ] || continue
    n="$(find "$d" -name '*.spec.ts' -not -path '*/node_modules/*' 2>/dev/null | wc -l | tr -d ' ')"
    [ "$n" -gt 0 ] && echo "| $d | $n |"
  done
  total="$(find apps packages -name '*.spec.ts' -not -path '*/node_modules/*' 2>/dev/null | wc -l | tr -d ' ')"
  echo "| **合计** | **$total** |"
}

# ---------- 6. API 路由 ----------
gen_api() {
  echo "| 模块 | 方法 | 路径 |"
  echo "| --- | --- | --- |"
  for ctl in "$API_SRC"/modules/*/presentation/*.controller.ts; do
    [ -f "$ctl" ] || continue
    mod="$(basename "$(dirname "$(dirname "$ctl")")")"
    prefix="$(grep -oE "@Controller\([^)]*\)" "$ctl" | head -1 | grep -oE "['\"][^'\"]*['\"]" | head -1 | tr -d "'\"")"
    prefix="${prefix:-}"
    while IFS= read -r line; do
      verb="$(echo "$line" | grep -oE '@(Get|Post|Put|Delete|Patch)' | head -1 | tr -d '@')"
      [ -z "$verb" ] && continue
      path="$(echo "$line" | grep -oE "@(Get|Post|Put|Delete|Patch)\([^)]*\)" | grep -oE "['\"][^'\"]*['\"]" | head -1 | tr -d "'\"")"
      case "$path" in
        /*) ;;
        "") path="" ;;
        *) path="/$path" ;;
      esac
      if [ -n "$prefix" ]; then
        full="/api/${prefix}${path}"
      else
        full="/api${path}"
      fi
      echo "| $mod | $verb | $full |"
    done < <(grep -E '@(Get|Post|Put|Delete|Patch)\(' "$ctl")
  done | sort -t'|' -k1,1 -k3,3
}

gen_apps > "$TMP/apps.md"
gen_modules > "$TMP/modules.md"
gen_models > "$TMP/models.md"
gen_migrations > "$TMP/migrations.md"
gen_tests > "$TMP/tests.md"
gen_api > "$TMP/api.md"

export SECT_APPS="$TMP/apps.md"
export SECT_MODULES="$TMP/modules.md"
export SECT_MODELS="$TMP/models.md"
export SECT_MIGRATIONS="$TMP/migrations.md"
export SECT_TESTS="$TMP/tests.md"
export SECT_API="$TMP/api.md"

# 替换 AUTO-*-BEGIN / AUTO-*-END 之间的内容，保留其余人工段
perl -0777 -i -pe '
  BEGIN {
    my @paths = @ENV{qw(SECT_APPS SECT_MODULES SECT_MODELS SECT_MIGRATIONS SECT_TESTS SECT_API)};
    my @sections;
    for my $p (@paths) {
      open my $fh, "<", $p or die "cannot read $p: $!";
      local $/;
      my $content = <$fh>;
      close $fh;
      push @sections, $content;
    }
    ($apps, $modules, $models, $migrations, $tests, $api) = @sections;
  }
  s{(<!-- AUTO-APPS-BEGIN -->\n)(.*?)(<!-- AUTO-APPS-END -->)}{$1$apps$3}s;
  s{(<!-- AUTO-MODULES-BEGIN -->\n)(.*?)(<!-- AUTO-MODULES-END -->)}{$1$modules$3}s;
  s{(<!-- AUTO-MODELS-BEGIN -->\n)(.*?)(<!-- AUTO-MODELS-END -->)}{$1$models$3}s;
  s{(<!-- AUTO-MIGRATIONS-BEGIN -->\n)(.*?)(<!-- AUTO-MIGRATIONS-END -->)}{$1$migrations$3}s;
  s{(<!-- AUTO-TESTS-BEGIN -->\n)(.*?)(<!-- AUTO-TESTS-END -->)}{$1$tests$3}s;
  s{(<!-- AUTO-API-BEGIN -->\n)(.*?)(<!-- AUTO-API-END -->)}{$1$api$3}s;
' "$DOC"

# 保证 prettier 格式通过
npx prettier --write "$DOC" >/dev/null 2>&1 || true

echo "update-state.sh: $DOC 已重新生成（AUTO 段来自源码扫描）"
