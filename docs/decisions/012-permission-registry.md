# 012: 权限码表单源与四层校验

- 日期：2026-11-11
- 背景：
  - 现有权限码分裂为三套：种子表 21 个（`user:read`、`role:read`…）、后端 `@RequirePermission` 23 个（`system:permission:read`、`common:file:read`…）、前端菜单 10 个（`system:user:read`、`system:role:read`…）。其中 `system:user:read`、`system:role:read`、`system:field:read`、`system:audit:read`、`md-doc:md-doc:read` 在种子表中不存在。
  - 后果：管理台多数菜单对所有人（含 admin）不可见；角色页无法分配这些权限点；主链模块（ipd/gtm/isc/voc/exchange-rate/md-doc）接口完全没有权限校验；页面路由无守卫，改 URL 可直达。
  - P1 后续的人才中心与财务中心所有页面都要挂在这套码上，必须先统一。
- 决策：
  1. **单一事实源**：`packages/permission` 定义权限注册表（`code` / 中文名 / 模块 / 类型 menu|action / 父级 / 排序）。种子、后端装饰器、前端菜单、路由守卫、按钮组件全部从该注册表派生，禁止再出现字面量权限码。
  2. **命名规范**：`<module>:<resource>:<action>`，action 收敛为 `read` / `write` / `delete` / `approve` / `create` 等有限集合。跨模块公共能力归 `common`（如 `common:file:read`）。
  3. **四层校验**：菜单可见（前端过滤）→ 路由可进（路由守卫）→ 按钮可点（`<Can>` 组件）→ 接口拒绝（`PermissionGuard`）。任一层缺失即视为未实现。
  4. **超管语义**：拥有 `system:super` 标识的用户跳过所有校验；`admin` 角色通过种子获得全部权限点，但不依赖"角色 code = admin"的硬编码。
  5. **种子幂等**：按 code upsert；注册表中已移除的 code 标记软删除；角色-权限按注册表重建，保证重复执行结果一致。
  6. **缓存**：权限码按 userId 缓存在 Redis，角色或角色权限变更时主动失效；失效失败时以 TTL 兜底。
  7. **数据范围暂不做**：本 ADR 只解决"能不能调/能不能看页面"，不做行级过滤；「我的」类接口按当前用户过滤属于业务实现，不在此列。
- 后果：
  - 正向：权限码只有一处定义，改一处全局生效；管理台菜单恢复正确；主链数据不再对任意登录用户开放。
  - 负向：需要一次性迁移后端 60+ 处装饰器与前端菜单；旧权限数据需重新 seed。
  - 约束：新增模块必须先向注册表登记权限点，否则无法授权；删除权限点只能软删除，避免历史角色授权悬空。
- 关联：`packages/permission/src/permissions.ts`、`packages/database/prisma/seed.ts`、`apps/api-service/src/modules/**/presentation/*.controller.ts`、`apps/admin-web/src/components/Layout/index.tsx`、`apps/admin-web/src/pages/RolesPage.tsx`
