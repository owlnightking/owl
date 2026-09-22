# 007: 全表统一时间戳（createdAt / updatedAt，精确到秒）

- 日期：2026-09-20
- 背景：
  - 原有数据表时间字段不统一：部分表只有 `createdAt`（如 `permission` / `file` / `notification`），部分表只有 `updatedAt`（如 `system_config` / `coin_account`），关联表 `role_permission` / `user_role` 两者皆无。
  - 时间字段为毫秒精度（`TIMESTAMP(3)`），而业务展示与审计只需要年月日时分秒。
- 决策：
  1. 所有数据表统一具备 `createdAt` 与 `updatedAt`：`createdAt DateTime @default(now()) @db.Timestamp(0)`、`updatedAt DateTime @default(now()) @updatedAt @db.Timestamp(0)`。
  2. 所有 `DateTime` 字段精度统一为秒，即 `@db.Timestamp(0)`，禁止毫秒。
  3. 迁移 `20260920130000_unify_timestamps`：缺失列以 `DEFAULT CURRENT_TIMESTAMP` 回填，已有时间列降为 `TIMESTAMP(0)`，并统一 `created_at` / `updated_at` 的数据库默认值；未使用破坏性命令。
  4. `scripts/check-backend-rules.sh` 与 `docs/backend-rules.md` / `AGENTS.md` 第十三节同步增加时间戳校验。
- 后果：
  - 时间列由 `timestamp(3)` 变为 `timestamp(0)`，毫秒被舍入；历史数据保留。
  - `updatedAt` 带数据库默认值，`createMany` 等批量写入不会出现非空约束失败。
  - 软删除 `deletedAt` 同为零秒精度。
- 关联：`packages/database/prisma/migrations/20260920130000_unify_timestamps`、`docs/backend-rules.md` 第二节、`scripts/check-backend-rules.sh`。
