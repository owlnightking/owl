# 006: 全表自增 id 主键 + 全表软删除 + 后端规范 Harness

- 日期：2026-09-20
- 背景：
  - 原有数据表主键为 `String @id @default(uuid())`，各模块删除/详情/编辑定位键不统一（有的用 uuid、有的用 name/code/key），AI 生成代码时容易用业务键定位，破坏一致性。
  - 删除普遍是 `prisma.*.delete()` 硬删除，误删不可恢复，审计与追溯困难。
  - 前端已有 `docs/frontend-rules.md` + `pnpm frontend:check` 的 Harness，后端缺对应物；Swagger 也未在 dev 暴露，本地联调不便。
- 决策：
  1. **主键规范**：所有数据表主键统一为 `id Int @id @default(autoincrement())`，关联外键与关联表（`role_permission`/`user_role`）同步为 `Int`；uuid/业务键不得作为详情、编辑、删除的定位键。
  2. **软删除规范**：所有数据表增加 `deletedAt DateTime? @map("deleted_at")`，删除一律为更新 `deletedAt`，禁止 `prisma.*.delete()` / `deleteMany()`；读查询默认过滤 `deletedAt: null`。
  3. **迁移方式**：用两条增量迁移（`20260920120000_int_id_and_soft_delete`、`20260920120100_restore_converted_unique_indexes`）以"新增临时列→按旧 uuid 回填→删除旧列→重命名→重建约束"的方式保全存量数据，未使用 `migrate reset` / `db push --accept-data-loss`。
  4. **后端 Harness**：新增 `docs/backend-rules.md` 与 `scripts/check-backend-rules.sh`（`pnpm backend:check`），校验自增 id、软删除、按 id 路由（`ParseIntPipe`）、dev Swagger，并接入 `verify:quick` 与 pre-commit。
  5. **Swagger**：`api-service` / `cron-service` 在非生产环境暴露 Swagger UI，启动日志打印 `http://localhost:<port>/<prefix>/docs`。
- 后果：
  - 全仓 id 由字符串改为数字：后端端口/用例/控制器/DTO、前端 API 类型与调用、seed 均已适配；`system-config` 与 `field-config` 的详情/编辑/删除由业务键改为 `/:id`，`field-config` 列表改为 `?category=` 并新增 `POST` 创建。
  - 软删除记录仍占用唯一约束，重建同名记录需复活（`upsert` 置 `deletedAt: null`）；已在仓储层处理。
  - 迁移前签发的 JWT / Redis 会话中 `sub` 为旧 uuid，部署后存量会话失效需重新登录。
  - `department` 全量同步由"删除重建"改为"按 `feishuDepartmentId` upsert + 缺失项软删"，保持幂等且主键稳定。
- 关联：`docs/backend-rules.md`、`scripts/check-backend-rules.sh`、`packages/database/prisma/migrations/20260920120000_int_id_and_soft_delete`、`AGENTS.md` 第十三节。
