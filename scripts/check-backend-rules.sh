#!/usr/bin/env bash
# check-backend-rules.sh — 后端规范检查
# 1. 所有数据表必须有 id Int @id @default(autoincrement())
# 2. 所有数据表必须有 createdAt / updatedAt（精确到秒 @db.Timestamp(0)）与 deletedAt（软删除）
# 3. 禁止 prisma/tx 硬删除（.delete / .deleteMany）
# 4. 详情/编辑/删除路由必须用 :id，禁止 :name/:code/:key 等非自增 id
# 5. @Param("id") 必须经 ParseIntPipe 转 number
# 6. dev 环境必须暴露 Swagger UI
# 7. NestJS 三层：功能模块必须有 Module，含 Controller 必须有 Service
# 8. Controller 不得直连 Prisma / 手动 new Service
# 9. Controller 必须经 ok()/page() 统一返回格式，禁止直接写响应
# 10. 列表与统计读查询必须过滤 deletedAt: null
# 11. Swagger 注解：@ApiTags / @ApiOperation / 响应注解 / DTO @ApiProperty
# 12. Swagger JWT：addBearerAuth + 守卫接受 Authorization: Bearer
# 13. 统一错误日志：异常过滤器必须用 Logger 记录
#
# 已移出本脚本、唯一实现见括号（避免同一规则多份实现漂移）：
#   - 单文件 1500 行上限 → scripts/check-architecture.sh 第 5 条（全仓统一，含 >1000 行预警）
#
# 所有问题均为 ERROR 级别，存在即 exit 1（阻断提交）

set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

SCHEMA="packages/database/prisma/schema.prisma"
ERROR_COUNT=0

error() { printf "[ERROR] %s - %s\n" "$1" "$2"; ERROR_COUNT=$((ERROR_COUNT + 1)); }

# 1 & 2. 数据表主键与软删除字段
check_schema() {
  if [ ! -f "$SCHEMA" ]; then
    error "$SCHEMA" "schema 文件不存在"
    return
  fi
  while IFS=$'\t' read -r kind model; do
    [ -z "$kind" ] && continue
    if [ "$kind" = "ID" ]; then
      error "$SCHEMA" "模型 $model 缺少 id Int @id @default(autoincrement())"
    elif [ "$kind" = "DEL" ]; then
      error "$SCHEMA" "模型 $model 缺少 deletedAt DateTime? @db.Timestamp(0) @map(\"deleted_at\")（软删除）"
    elif [ "$kind" = "CREATED" ]; then
      error "$SCHEMA" "模型 $model 缺少 createdAt DateTime @db.Timestamp(0) @default(now()) @map(\"created_at\")"
    elif [ "$kind" = "UPDATED" ]; then
      error "$SCHEMA" "模型 $model 缺少 updatedAt DateTime @db.Timestamp(0) @default(now()) @updatedAt @map(\"updated_at\")"
    fi
  done < <(awk '
    /^model[[:space:]]/ { name=$2; body=""; inmodel=1 }
    inmodel { body=body $0 "\n" }
    inmodel && /^}/ {
      hasId = (body ~ /id[[:space:]]+Int[[:space:]]+@id[[:space:]]+@default\(autoincrement\(\)\)/)
      hasDel = (body ~ /deletedAt[[:space:]]+DateTime\?[[:space:]]+@db\.Timestamp\(0\)[[:space:]]+@map\("deleted_at"\)/)
      hasCreated = (body ~ /createdAt[[:space:]]+DateTime[[:space:]]+@db\.Timestamp\(0\)[[:space:]]+@default\(now\(\)\)/)
      hasUpdated = (body ~ /updatedAt[[:space:]]+DateTime[[:space:]]+@db\.Timestamp\(0\)[[:space:]]+@default\(now\(\)\)[[:space:]]+@updatedAt/)
      if (!hasId) print "ID\t" name
      if (!hasDel) print "DEL\t" name
      if (!hasCreated) print "CREATED\t" name
      if (!hasUpdated) print "UPDATED\t" name
      inmodel=0
    }
  ' "$SCHEMA")
}

# 3. 禁止 Prisma 硬删除
check_hard_delete() {
  local files
  files="$(find apps/api-service/src apps/cron-service/src packages/database/src -name '*.ts' 2>/dev/null | grep -v generated | grep -v node_modules || true)"
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    while IFS= read -r line; do
      [ -z "$line" ] && continue
      error "$file" "禁止硬删除（软删除请 update deletedAt）: $(echo "$line" | sed 's/^[0-9]*: *//')"
    done < <(grep -nE '(prisma|tx)\.[A-Za-z0-9_]+\.[A-Za-z0-9_]*[Dd]elete(Many)?\(' "$file" 2>/dev/null)
  done <<< "$files"
}

# 4. 详情/编辑/删除必须按 :id 路由
check_route_id() {
  local files
  files="$(find apps/api-service/src apps/cron-service/src -name '*.controller.ts' 2>/dev/null | grep -v node_modules || true)"
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    while IFS= read -r line; do
      [ -z "$line" ] && continue
      local param
      param="$(echo "$line" | sed -E 's/.*@(Get|Put|Delete)\(":([^"\/]+).*/\2/')"
      if [ -n "$param" ] && [ "$param" != "id" ]; then
        error "$file" "详情/编辑/删除路由必须用 :id（自增主键），检测到 :$param"
      fi
    done < <(grep -nE '@(Get|Put|Delete)\(":' "$file" 2>/dev/null)
  done <<< "$files"
}

# 5. @Param("id") 必须经 ParseIntPipe
check_param_pipe() {
  local files
  files="$(find apps/api-service/src apps/cron-service/src -name '*.controller.ts' 2>/dev/null | grep -v node_modules || true)"
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    while IFS= read -r line; do
      [ -z "$line" ] && continue
      error "$file" "@Param(\"id\") 必须使用 ParseIntPipe 转 number: $(echo "$line" | sed 's/^[0-9]*: *//')"
    done < <(grep -nE '@Param\("id"\)' "$file" 2>/dev/null)
  done <<< "$files"
}

# 6. dev 环境 Swagger
check_swagger() {
  local main
  for main in apps/api-service/src/main.ts apps/cron-service/src/main.ts; do
    [ -f "$main" ] || continue
    if ! grep -q 'SwaggerModule.setup' "$main" 2>/dev/null; then
      error "$main" "缺少 SwaggerModule.setup（dev 环境需暴露 Swagger UI）"
    fi
  done
}

# 7. NestJS 三层：功能模块必须有 Module；含 Controller 必须有 Service
check_nestjs_modules() {
  local roots="apps/api-service/src/modules apps/cron-service/src/modules"
  local dir controllers services modules
  while IFS= read -r dir; do
    [ -z "$dir" ] && continue
    modules="$(find "$dir" -maxdepth 1 -name '*.module.ts' 2>/dev/null | wc -l | tr -d ' ')"
    controllers="$(find "$dir" -name '*.controller.ts' 2>/dev/null | wc -l | tr -d ' ')"
    services="$(find "$dir" -name '*.service.ts' 2>/dev/null | wc -l | tr -d ' ')"
    if [ "$modules" -eq 0 ]; then
      error "$dir" "缺少 NestJS Module（<feature>.module.ts）"
    fi
    if [ "$controllers" -gt 0 ] && [ "$services" -eq 0 ]; then
      error "$dir" "含 Controller 但缺少 Service（*.service.ts）"
    fi
  done < <(find $roots -mindepth 1 -maxdepth 1 -type d 2>/dev/null)
}

# 8. Controller 层不得直连 Prisma / 手动 new Service
check_controller_layer() {
  local files
  files="$(find apps/api-service/src apps/cron-service/src -name '*.controller.ts' 2>/dev/null | grep -v node_modules || true)"
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    if grep -q 'DATABASE_CLIENT' "$file" 2>/dev/null; then
      error "$file" "Controller 禁止直连 Prisma（DATABASE_CLIENT），请下沉到 Service"
    fi
    while IFS= read -r line; do
      [ -z "$line" ] && continue
      error "$file" "Controller 禁止手动 new Service，改用 Module 依赖注入: $(echo "$line" | sed 's/^[0-9]*: *//')"
    done < <(grep -nE 'new [A-Za-z0-9_]+Service\(' "$file" 2>/dev/null)
  done <<< "$files"
}

# 9. 统一返回格式：Controller 必须经 ok()/page()，禁止直接写响应
check_response_format() {
  local files
  files="$(find apps/api-service/src apps/cron-service/src -name '*.controller.ts' 2>/dev/null | grep -v node_modules || true)"
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    if ! grep -q 'common/response/api-response' "$file" 2>/dev/null; then
      error "$file" "Controller 必须通过 ok()/page() 统一返回格式"
    fi
    case "$file" in
      */auth/*) continue ;;
    esac
    while IFS= read -r line; do
      [ -z "$line" ] && continue
      error "$file" "禁止直接写响应（res.json/res.send），统一用 ok()/page(): $(echo "$line" | sed 's/^[0-9]*: *//')"
    done < <(grep -nE '\.json\(|\.send\(' "$file" 2>/dev/null)
  done <<< "$files"
}

# 10. 列表与统计读查询必须过滤 deletedAt: null
# 实现见 scripts/lib/check-soft-delete-filter.mjs：需把 `const where = {...}` 的引用解析回声明再判断，
# 否则会把 `findMany({ where })` 这类正确写法误报。findUnique 不检查——软删除记录的恢复/重建
# 流程必须能查到已删除行，属合法例外。
check_soft_delete_filter() {
  local files line file rest
  files="$(find apps/api-service/src apps/cron-service/src -name '*.repository.ts' 2>/dev/null | grep -v node_modules || true)"
  [ -z "$files" ] && return
  if ! command -v node >/dev/null 2>&1; then
    error "scripts/lib/check-soft-delete-filter.mjs" "node 不可用，读查询软删除过滤检查无法执行，不得静默跳过"
    return
  fi
  while IFS= read -r line; do
    [ -z "$line" ] && continue
    file="${line%%:*}"
    rest="${line#*:}"
    error "$file" "读查询缺少 deletedAt: null 过滤（$(echo "$rest" | sed 's/^[0-9]*: *//')）"
  done < <(node scripts/lib/check-soft-delete-filter.mjs $files 2>/dev/null)
}

# 11. Swagger 注解：Controller 必须有 @ApiTags，每个路由必须有 @ApiOperation / 响应注解，含 DTO 必须有 @ApiProperty
check_swagger_annotations() {
  local files
  files="$(find apps/api-service/src apps/cron-service/src -name '*.controller.ts' 2>/dev/null | grep -v node_modules || true)"
  local file routes ops responses
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    if ! grep -q '@ApiTags(' "$file" 2>/dev/null; then
      error "$file" "Controller 缺少 @ApiTags（Swagger 接口分模块）"
    fi
    routes="$(grep -cE '@(Get|Post|Put|Delete)\(' "$file" 2>/dev/null)"
    ops="$(grep -c '@ApiOperation(' "$file" 2>/dev/null)"
    responses="$(grep -cE '@Api(OkResponse|CreatedResponse)\(' "$file" 2>/dev/null)"
    routes="${routes:-0}"
    ops="${ops:-0}"
    responses="${responses:-0}"
    if [ "$ops" -lt "$routes" ]; then
      error "$file" "有 $routes 个路由但只有 $ops 个 @ApiOperation，请为每个接口补中文名"
    fi
    if [ "$responses" -lt "$routes" ]; then
      error "$file" "有 $routes 个路由但只有 $responses 个 @ApiOkResponse/@ApiCreatedResponse，请为每个接口补返回值说明"
    fi
    if grep -qE 'class [A-Za-z0-9_]+Dto' "$file" 2>/dev/null && ! grep -q '@ApiProperty' "$file" 2>/dev/null; then
      error "$file" "含 DTO 但缺少 @ApiProperty（请补入参中文字段说明）"
    fi
  done <<< "$files"
}

# 12. Swagger JWT：api-service 必须配置 Bearer 方案，且 JWT 守卫接受 Authorization: Bearer
check_swagger_jwt() {
  local main="apps/api-service/src/main.ts"
  local guard="apps/api-service/src/modules/auth/application/jwt-auth.guard.ts"
  if [ -f "$main" ] && ! grep -q 'addBearerAuth' "$main" 2>/dev/null; then
    error "$main" "Swagger 缺少 addBearerAuth（需配置 JWT Bearer 方案）"
  fi
  if [ -f "$guard" ] && ! grep -qi 'authorization' "$guard" 2>/dev/null; then
    error "$guard" "JWT 守卫未接受 Authorization: Bearer 头"
  fi
}

# 13. 统一错误日志：异常过滤器必须用 Logger 记录
check_error_logging() {
  local file
  for file in \
    apps/api-service/src/common/response/api-exception.filter.ts \
    apps/cron-service/src/common/response/api-exception.filter.ts; do
    [ -f "$file" ] || continue
    if ! grep -q 'Logger' "$file" 2>/dev/null || ! grep -qE 'logger\.(error|warn)' "$file" 2>/dev/null; then
      error "$file" "异常过滤器必须统一记录错误日志（Logger error / warn）"
    fi
  done
}

check_schema
check_hard_delete
check_route_id
check_param_pipe
check_swagger
check_nestjs_modules
check_controller_layer
check_response_format
check_soft_delete_filter
check_swagger_annotations
check_swagger_jwt
check_error_logging

echo "check-backend-rules.sh: ERROR=$ERROR_COUNT"
if [ "$ERROR_COUNT" -gt 0 ]; then
  exit 1
fi
exit 0
