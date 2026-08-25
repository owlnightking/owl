# PROJECT STATE — Owl 项目当前状态快照

> AI/人开工前先读本文件（1 屏内拿全局，避免重扫全仓）。
> 规则见 `AGENTS.md`；阶段规划与验收见 `docs/implementation-plan.md`；决策日志见 `docs/decisions/`。
> `### 自动 ###` 段由 `bash scripts/update-state.sh` 生成，禁止手改；人工段随每次代码改动同步更新。

## 当前阶段

- Phase 1 (M2) 认证与权限底座：代码基本完成，验收项未全部勾选
- Phase 2 (M3) 业务主干 MVP（关键里程碑）：未开始
- Phase 3 (M4) 底座补全 + Cron：未开始
- Phase 4 (M5) 部署交付：K3s 已部署，文档验收未走完
- 范围扩张：mobile-web（飞书 OAuth，k8s NodePort 9263）已上线
- CI/CD：CD 已改为 main push 触发（paths 命中 package.json + 版本门禁），`v*` tag 仅作版本标记

## 已知缺口（开工前确认，做完一项划一项）

- [ ] PermissionModule 空壳，权限点无管理 API/页面（权限数据靠 seed）
- [ ] 测试覆盖仅 auth.use-case 1 个 spec，user/role 无单测
- [ ] cron-service 仅 health + ScheduleModule，无任务中心
- [ ] 本地飞书应用未配置（FEISHU_APP_ID/SECRET 空），SSO 登录本地无法真实跑通
- [ ] PrismaClient 每模块各自 new，模块多时需收敛全局单例

## ### 自动 ### 应用清单

<!-- AUTO-APPS-BEGIN -->

| app          | 类型 | 版本   | 描述 |
| ------------ | ---- | ------ | ---- |
| admin-web    | 前端 | 0.1.32 |      |
| api-service  | 后端 | 0.1.33 |      |
| cron-service | 后端 | 0.1.27 |      |
| cron-web     | 前端 | 0.1.32 |      |
| mobile-web   | 前端 | 0.1.3  |      |
| owl-web      | 前端 | 0.1.37 |      |
| portal       | 前端 | 0.1.0  |      |

<!-- AUTO-APPS-END -->

## ### 自动 ### api-service 模块清单

<!-- AUTO-MODULES-BEGIN -->

| 模块          | app | dom | infra | pres | 状态    |
| ------------- | --- | --- | ----- | ---- | ------- |
| audit-log     | 1   | 1   | 1     | 1    | ✅ 完整 |
| auth          | 3   | 1   | 5     | 2    | ✅ 完整 |
| file          | 0   | 0   | 0     | 0    | ❌ 空壳 |
| mcp           | 0   | 0   | 0     | 0    | ❌ 空壳 |
| notification  | 0   | 0   | 0     | 0    | ❌ 空壳 |
| permission    | 0   | 0   | 0     | 0    | ❌ 空壳 |
| project       | 0   | 0   | 0     | 0    | ❌ 空壳 |
| role          | 1   | 1   | 1     | 1    | ✅ 完整 |
| system-config | 0   | 0   | 0     | 0    | ❌ 空壳 |
| user          | 1   | 1   | 1     | 1    | ✅ 完整 |

<!-- AUTO-MODULES-END -->

### 模块说明（人工维护，改代码时同步）

| 模块                                                | 说明                                                                        |
| --------------------------------------------------- | --------------------------------------------------------------------------- |
| auth                                                | 飞书 OAuth 登录 / JWT 双 token / Redis 会话与黑名单 / 无感刷新 / SSO Cookie |
| user                                                | 用户 CRUD、角色分配、启停用                                                 |
| role                                                | 角色 CRUD + 权限绑定                                                        |
| permission                                          | 空壳，权限点数据靠 seed                                                     |
| audit-log                                           | 全局写操作拦截器 → audit_log                                                |
| project / notification / file / system-config / mcp | 空壳，待 Phase 2/3                                                          |

## ### 自动 ### 数据模型

<!-- AUTO-MODELS-BEGIN -->

| 模型            | 说明 |
| --------------- | ---- |
| User            |      |
| Role            |      |
| Permission      |      |
| RolePermission  |      |
| UserRole        |      |
| AuthSession     |      |
| AuditLog        |      |
| Notification    |      |
| File            |      |
| SystemConfig    |      |
| McpTool         |      |
| McpSession      |      |
| McpToolLog      |      |
| SchedulerConfig |      |
| SchedulerRun    |      |

<!-- AUTO-MODELS-END -->

## ### 自动 ### 迁移

<!-- AUTO-MIGRATIONS-BEGIN -->

| 迁移                | 说明 |
| ------------------- | ---- |
| 20260813021549_init |      |

<!-- AUTO-MIGRATIONS-END -->

## ### 自动 ### 测试覆盖

<!-- AUTO-TESTS-BEGIN -->

| 目录             | spec 数量 |
| ---------------- | --------- |
| apps/api-service | 1         |
| **合计**         | **1**     |

<!-- AUTO-TESTS-END -->

## ### 自动 ### API 路由

<!-- AUTO-API-BEGIN -->

| 模块      | 方法   | 路径                      |
| --------- | ------ | ------------------------- |
| role      | Delete | /api/roles/:id            |
| audit-log | Get    | /api/audit-logs           |
| auth      | Get    | /api/auth/feishu/callback |
| auth      | Get    | /api/auth/feishu/login    |
| auth      | Get    | /api/auth/me              |
| role      | Get    | /api/roles                |
| role      | Get    | /api/roles/permissions    |
| user      | Get    | /api/users                |
| user      | Get    | /api/users/:id/roles      |
| user      | Get    | /api/users/roles          |
| auth      | Post   | /api/auth/logout          |
| auth      | Post   | /api/auth/refresh         |
| role      | Post   | /api/roles                |
| role      | Put    | /api/roles/:id            |
| user      | Put    | /api/users/:id/roles      |
| user      | Put    | /api/users/:id/status     |

<!-- AUTO-API-END -->
