# 014: 飞书同步孤儿部门硬删（局部例外于 006 软删除）

- 日期：2026-09-21
- 背景：
  - 006 规定全表软删除，禁止 `prisma.*.delete()` / `deleteMany()`；`department` 全量同步曾改为「upsert + 缺失项软删」。
  - 组织同步修正（P1-2）要求：不在当前组织的**人员**软删除（保留审计与会话历史）；同步产生的**孤儿部门**（飞书已不存在）属可再生冗余数据，长期堆积软删行会干扰部门树与唯一约束语义。
  - 用户明确要求：「离职软删除，冗余数据硬删除」——冗余数据范围限定为同步产生的孤儿部门。
- 决策：
  1. **离职人员**：同步拉取全量用户后，本地 `deletedAt IS NULL` 且本次未出现的 `user` 记录一律软删；再次出现时 upsert 复活（`deletedAt: null`）。**不硬删用户**。
  2. **孤儿部门**：`feishu-sync` 同步中，本地存在、本次飞书全量部门树未包含的 `department` 记录 **硬删**（`deleteMany`）。此为 006 的**唯一书面例外**，仅限 `apps/cron-service/src/modules/feishu-sync/infrastructure/prisma-department.repository.ts`。
  3. **空结果保护**：飞书返回空部门列表或空用户列表时**中止同步**，禁止据此清空本地数据。
  4. **Harness**：`scripts/check-backend-rules.sh` 的 `check_hard_delete` 对上述唯一路径放行；其余文件仍禁止硬删。
  5. **部门树**：同步改为自根递归拉取全树（P1-2），避免只拉根层导致子部门被误判为孤儿而硬删。
- 后果：
  - FK `user.department_id` / `department.parent_id` 对 `feishu_department_id` 为 `ON DELETE SET NULL`，硬删孤儿部门会自动清空仍指向它的引用，无需先改 schema。
  - 孤儿部门不可恢复；人员离职仍可追溯（软删行保留）。
  - 若未来放宽为「任意冗余表硬删」，须新开更高编号 ADR，不得直接扩大本例外。
- 关联：`docs/decisions/006-int-id-and-soft-delete.md`（部分取代其「department 缺失项软删」结论）、`scripts/check-backend-rules.sh`、`docs/backend-rules.md`、`docs/implementation-plan.md` P1-2。
