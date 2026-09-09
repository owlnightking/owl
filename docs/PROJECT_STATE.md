# PROJECT STATE — Owl 项目当前状态快照

> AI/人开工前先读本文件（1 屏内拿全局，避免重扫全仓）。
> 规则见 `AGENTS.md`；阶段规划与验收见 `docs/implementation-plan.md`；决策日志见 `docs/decisions/`。
> `### 自动 ###` 段由 `bash scripts/update-state.sh` 生成，禁止手改；人工段随每次代码改动同步更新。

## 当前阶段

- 领域地图（ADR 002）：主领域 = 自研产品跨境电商 13 阶段流水线（远期保留）；组织支撑域 = 认可中心/人才中心/智能客服+知识库/基础配置监控（当前主线）；副业域 = 付费知识 md 文档库
- 开发顺序：先组织支撑域、再副业域、后主领域（详见 implementation-plan）
- 里程碑 2'（当前目标）：S0 支撑域底座 ✅ 已完成（PrismaClient 全局单例 / system-config / mock 登录 / permission / notification / file / admin 二级菜单 + 权限渲染）；下一步 S1 认可中心闭环
- Phase 1 (M1') 认证与权限底座：代码基本完成，验收项未全部勾选
- 后续阶段：S2 人才中心 / S3 智能客服+知识库 / S4 基础配置监控 / B1 付费知识 / M0 主领域流水线 —— 未开始
- 部署：K3s 已部署；mobile-web（飞书 OAuth，k8s NodePort 9263）已上线但页面全 mock
- CI/CD：CD 为 main push 触发（paths 命中 package.json + 版本门禁），`v*` tag 仅作版本标记

## 已知缺口（开工前确认，做完一项划一项）

- [x] ~~PrismaClient 每模块各自 new，模块多时需收敛全局单例~~（S0 T1 已完成）
- [x] ~~permission 模块空壳，无按钮级四层 RBAC~~（S0 T4 已完成：CRUD + controller + 集成）
- [x] ~~admin 菜单仅一级平铺，缺一级分组 + 二级菜单及按角色权限派生渲染~~（S0 T7 已完成）
- [x] ~~notification / file / system-config 空壳~~（S0 T2/T5/T6 已完成：CRUD + 集成）
- [x] ~~本地飞书应用未配置，SSO 本地无法真实跑通~~（S0 T3 mock 登录通道已完成）
- [ ] 组织支撑域与副业域领域模块均未建：认可（徽章/认可贴/币账户/币流水/兑换单/商品）、人才、知识库、付费知识文档库、使用统计/消息推送监控/数据监控（规划见 implementation-plan S1-S4/B1）
- [ ] mobile-web 四个 Tab 与个人中心全为 mock 数据，无真实接口；「我的」md 编写文档模块未建
- [ ] 测试覆盖仅 auth.use-case 1 个 spec，user/role/permission/system-config/notification/file 无单测
- [ ] cron-service 仅 health + ScheduleModule，任务中心未建（人才表单同步 / 数据监控探针后续挂靠）
- [ ] 主领域（13 阶段流水线）领域后移，project 模块空壳（M0 重启时建）

## ### 自动 ### 应用清单

<!-- AUTO-APPS-BEGIN -->

| app          | 类型 | 版本   | 描述 |
| ------------ | ---- | ------ | ---- |
| admin-web    | 前端 | 0.2.35 |      |
| api-service  | 后端 | 0.2.36 |      |
| cron-service | 后端 | 0.2.35 |      |
| cron-web     | 前端 | 0.2.35 |      |
| mobile-web   | 前端 | 0.2.35 |      |
| owl-web      | 前端 | 0.2.35 |      |
| portal       | 前端 | 0.2.35 |      |

<!-- AUTO-APPS-END -->

## ### 自动 ### api-service 模块清单

<!-- AUTO-MODULES-BEGIN -->

| 模块          | app | dom | infra | pres | 状态    |
| ------------- | --- | --- | ----- | ---- | ------- |
| audit-log     | 1   | 1   | 1     | 1    | ✅ 完整 |
| auth          | 3   | 1   | 5     | 2    | ✅ 完整 |
| field-config  | 1   | 1   | 1     | 1    | ✅ 完整 |
| file          | 1   | 1   | 1     | 1    | ✅ 完整 |
| mcp           | 0   | 0   | 0     | 0    | ❌ 空壳 |
| md-doc        | 1   | 1   | 1     | 1    | ✅ 完整 |
| notification  | 1   | 1   | 1     | 1    | ✅ 完整 |
| permission    | 1   | 1   | 1     | 1    | ✅ 完整 |
| project       | 0   | 0   | 0     | 0    | ❌ 空壳 |
| recognition   | 6   | 6   | 6     | 4    | ✅ 完整 |
| role          | 1   | 1   | 1     | 1    | ✅ 完整 |
| system-config | 1   | 1   | 1     | 1    | ✅ 完整 |
| user          | 1   | 1   | 1     | 1    | ✅ 完整 |

<!-- AUTO-MODULES-END -->

### 模块说明（人工维护，改代码时同步）

| 模块          | 说明                                                                             |
| ------------- | -------------------------------------------------------------------------------- |
| auth          | 飞书 OAuth 登录 / JWT 双 token / Redis 会话与黑名单 / 无感刷新 / SSO Cookie      |
| user          | 用户 CRUD、角色分配、启停用；本地 mock 登录切用户/角色通道列入 S0                |
| role          | 角色 CRUD + 权限绑定                                                             |
| permission    | 空壳 → S0 填实：权限点管理 API + 按钮级四层 RBAC 校验（菜单/页面/按钮/接口）     |
| audit-log     | 全局写操作拦截器 → audit_log（操作日志，已有）                                   |
| field-config  | 动态字段配置（已有）；候选人之类动态表单复用                                     |
| notification  | 空壳 → S0 填实：内站消息（轮询拉取/已读/事件触发），移动端消息中心与审批通知依赖 |
| file          | 空壳 → S0 填实：MinIO 预签名上传下载，桶规划（徽章/商品图/头像/md 附件）         |
| system-config | 空壳 → S0 填实：可配参数（认可币额/体力上限等）+ 字典                            |
| mcp           | 空壳 → S4：工具注册/会话/调用日志管理台                                          |
| project       | 空壳 → M0（主领域 13 阶段流水线，远期重启）                                      |

规划新增领域模块（S1 起，未建，落代码后由 update-state.sh 自动入上表）：recognition（徽章/认可贴/币账户/币流水/兑换单/商品）、talent（候选人/面试/员工档案）、knowledge（内部知识库）、paid-knowledge / md-doc（副业文档库）、usage-stats / push-monitor / data-monitor（S4）。

## ### 自动 ### 数据模型

<!-- AUTO-MODELS-BEGIN -->

| 模型            | 说明 |
| --------------- | ---- |
| User            |      |
| Department      |      |
| SyncLog         |      |
| Role            |      |
| Permission      |      |
| RolePermission  |      |
| UserRole        |      |
| AuthSession     |      |
| AuditLog        |      |
| Notification    |      |
| File            |      |
| SystemConfig    |      |
| FieldConfig     |      |
| McpTool         |      |
| McpSession      |      |
| McpToolLog      |      |
| SchedulerConfig |      |
| SchedulerRun    |      |
| Badge           |      |
| Recognition     |      |
| RecognitionLike |      |
| CoinAccount     |      |
| CoinTransaction |      |
| StaminaAccount  |      |
| Product         |      |
| ExchangeOrder   |      |
| MdDoc           |      |
| MdDocImage      |      |

<!-- AUTO-MODELS-END -->

## ### 自动 ### 迁移

<!-- AUTO-MIGRATIONS-BEGIN -->

| 迁移                                                 | 说明 |
| ---------------------------------------------------- | ---- |
| 20260813021549_init                                  |      |
| 20260902075136_add_department_sync_log               |      |
| 20260902085837_add_tags_module_to_scheduler          |      |
| 20260902094247_add_field_config                      |      |
| 20260902100000_remove_field_type_from_field_config   |      |
| 20260903085852_fix_department_relation               |      |
| 20260904000000_remove_sync_log                       |      |
| 20260904010000_add_env_to_scheduler_config           |      |
| 20260904020000_make_scheduler_run_config_id_nullable |      |
| 20260904030000_add_env_to_scheduler_run              |      |
| 20260904040000_restore_sync_log                      |      |
| 20260908000000_add_md_doc                            |      |

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

| 模块          | 方法   | 路径                                         |
| ------------- | ------ | -------------------------------------------- |
| field-config  | Delete | /api/field-config/:category/:module          |
| file          | Delete | /api/files/:id                               |
| md-doc        | Delete | /api/md-docs/:id                             |
| permission    | Delete | /api/permissions/:id                         |
| recognition   | Delete | /api/recognition/badges/:id                  |
| recognition   | Delete | /api/recognition/products/:id                |
| role          | Delete | /api/roles/:id                               |
| system-config | Delete | /api/system-config/:key                      |
| audit-log     | Get    | /api/audit-logs                              |
| auth          | Get    | /api/auth/feishu/callback                    |
| auth          | Get    | /api/auth/feishu/login                       |
| auth          | Get    | /api/auth/me                                 |
| auth          | Get    | /api/auth/mock-users                         |
| field-config  | Get    | /api/field-config/:category                  |
| field-config  | Get    | /api/field-config/:category/:module          |
| file          | Get    | /api/files                                   |
| file          | Get    | /api/files/:id                               |
| md-doc        | Get    | /api/md-docs                                 |
| md-doc        | Get    | /api/md-docs/:id                             |
| notification  | Get    | /api/notifications                           |
| notification  | Get    | /api/notifications/unread-count              |
| permission    | Get    | /api/permissions                             |
| permission    | Get    | /api/permissions/:id                         |
| recognition   | Get    | /api/recognition                             |
| recognition   | Get    | /api/recognition/badges                      |
| recognition   | Get    | /api/recognition/badges/:id                  |
| recognition   | Get    | /api/recognition/exchange/coin-account       |
| recognition   | Get    | /api/recognition/exchange/coin-transactions  |
| recognition   | Get    | /api/recognition/exchange/orders             |
| recognition   | Get    | /api/recognition/exchange/pending-count      |
| recognition   | Get    | /api/recognition/exchange/stamina            |
| recognition   | Get    | /api/recognition/feed                        |
| recognition   | Get    | /api/recognition/level                       |
| recognition   | Get    | /api/recognition/pending-count               |
| recognition   | Get    | /api/recognition/products                    |
| recognition   | Get    | /api/recognition/products/:id                |
| role          | Get    | /api/roles                                   |
| role          | Get    | /api/roles/permissions                       |
| system-config | Get    | /api/system-config/:key                      |
| user          | Get    | /api/users                                   |
| user          | Get    | /api/users/:id/roles                         |
| user          | Get    | /api/users/roles                             |
| auth          | Post   | /api/auth/logout                             |
| auth          | Post   | /api/auth/mock-login                         |
| auth          | Post   | /api/auth/refresh                            |
| md-doc        | Post   | /api/md-docs                                 |
| md-doc        | Post   | /api/md-docs/upload-image                    |
| notification  | Post   | /api/notifications                           |
| permission    | Post   | /api/permissions                             |
| recognition   | Post   | /api/recognition                             |
| recognition   | Post   | /api/recognition/:id/like                    |
| recognition   | Post   | /api/recognition/badges                      |
| recognition   | Post   | /api/recognition/exchange/orders             |
| recognition   | Post   | /api/recognition/products                    |
| role          | Post   | /api/roles                                   |
| field-config  | Put    | /api/field-config/:category/:module          |
| md-doc        | Put    | /api/md-docs/:id                             |
| notification  | Put    | /api/notifications/:id/read                  |
| notification  | Put    | /api/notifications/read-all                  |
| permission    | Put    | /api/permissions/:id                         |
| recognition   | Put    | /api/recognition/:id/approve                 |
| recognition   | Put    | /api/recognition/:id/pin                     |
| recognition   | Put    | /api/recognition/:id/reject                  |
| recognition   | Put    | /api/recognition/badges/:id                  |
| recognition   | Put    | /api/recognition/exchange/coin-adjust        |
| recognition   | Put    | /api/recognition/exchange/orders/:id/approve |
| recognition   | Put    | /api/recognition/exchange/orders/:id/fulfill |
| recognition   | Put    | /api/recognition/exchange/orders/:id/reject  |
| recognition   | Put    | /api/recognition/products/:id                |
| role          | Put    | /api/roles/:id                               |
| system-config | Put    | /api/system-config/:key                      |
| user          | Put    | /api/users/:id/roles                         |
| user          | Put    | /api/users/:id/status                        |

<!-- AUTO-API-END -->
