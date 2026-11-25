# PROJECT STATE — Owl 项目当前状态快照

> AI/人开工前先读本文件（1 屏内拿全局，避免重扫全仓）。
> 规则见 `AGENTS.md`；阶段规划与验收见 `docs/implementation-plan.md`；决策日志见 `docs/decisions/`。
> `### 自动 ###` 段由 `bash scripts/update-state.sh` 生成，禁止手改；人工段随每次代码改动同步更新。

## 当前阶段

- 实施顺序（ADR 013，唯一排期事实源 `docs/implementation-plan.md`）：**P1 系统基座 → P2 人才中心 → P3 财务一期 → P4 业务链路跑通**；SaaS 后置。
- 当前目标：**P1-1 权限码表统一 + 角色授权**（实施中）。P1 其余批次：组织同步修正、登录兜底、审批记录同步、编号/导出/字典/审计小件。
- 已完成历史基线：Phase 0 工程护栏与 CI/CD；Phase 1 飞书 OAuth + JWT 双 token；S0 支撑域底座（Prisma 单例 / system-config / permission / notification / file / 二级菜单 / mock 登录）；S1 认可中心闭环（Badge/Recognition/Coin/Stamina/Product/Exchange）；B1 付费知识 md 文档库；M0-v1 产品线骨架（IPD 五期 + SPU/SKU + GTM/ISC/VOC + 汇率）。
- P2 人才中心 / P3 财务一期 / P4 业务链路：未开始，范围见 implementation-plan。
- 部署：K3s 已部署；mobile-web（飞书 OAuth，k8s NodePort 9263）已上线但页面全 mock。
- CI/CD：CD 为 main push 触发（paths 命中 package.json + 版本门禁），`v*` tag 仅作版本标记。

## 已知缺口（开工前确认，做完一项划一项）

- [x] ~~PrismaClient 每模块各自 new，模块多时需收敛全局单例~~（S0 T1 已完成）
- [x] ~~permission 模块空壳，无按钮级四层 RBAC~~（S0 T4 已完成 CRUD；P1-1 补齐码表单源与四层校验）
- [x] ~~admin 菜单仅一级平铺，缺一级分组 + 二级菜单及按角色权限派生渲染~~（S0 T7 已完成）
- [x] ~~notification / file / system-config 空壳~~（S0 T2/T5/T6 已完成：CRUD + 集成）
- [x] ~~本地飞书应用未配置，SSO 本地无法真实跑通~~（S0 T3 mock 登录通道已完成）
- [x] ~~组织支撑域与副业域领域模块均未建~~（S1 认可中心与 B1 md 文档库已完成）
- [x] ~~mobile-web 四个 Tab 与个人中心全为 mock 数据~~（S1 认可中心 Feed/消息/商城/我的已接入真实接口）
- [ ] **P1-1** 权限码三套不一致：种子 21 个、后端 23 个、菜单 10 个；`system:user:read` 等菜单码在种子中不存在，管理台多数菜单对所有人不可见
- [ ] **P1-1** `ipd` / `gtm` / `isc` / `voc` / `exchange-rate` / `md-doc` 接口零权限校验，任意登录用户可增删改
- [ ] **P1-1** 前端无路由守卫、无按钮级权限组件；权限每次请求查库，角色变更不即时生效
- [ ] **P1-2** 飞书组织同步只拉根部门一层、`replaceAll` 重建部门、用户缺工号/职务/职级/上级/入职日/在职状态、离职不处理、同步统计失真
- [ ] **P1-3** 登录兜底未建：本地无此人不会实时拉飞书单人建号；离职/停用登录拦截未做
- [ ] **P1-4** 飞书审批记录同步未建（定义 / 实例 / 时间线 / 表单字段）
- [ ] **P1-5** 统一单据编号、Excel 导出、业务字典、越权与导出审计未建
- [ ] 数据范围（本人/本部门/下级/全部）按口径暂不做；「我的」接口仍需按当前用户过滤
- [ ] 单测覆盖低：user/role/permission/system-config/notification/file 缺少成功 + 失败路径
- [ ] cron-service 任务中心未建（同步任务 / 审批轮询 / 失败告警待挂靠）
- [ ] `project` 模块空壳：P4 并入 `ipd`，届时删除模块壳

## ### 自动 ### 应用清单

<!-- AUTO-APPS-BEGIN -->

| app          | 类型 | 版本   | 描述 |
| ------------ | ---- | ------ | ---- |
| admin-web    | 前端 | 0.2.53 |      |
| api-service  | 后端 | 0.2.54 |      |
| cron-service | 后端 | 0.2.53 |      |
| cron-web     | 前端 | 0.2.53 |      |
| mobile-web   | 前端 | 0.2.53 |      |
| owl-web      | 前端 | 0.2.53 |      |
| portal       | 前端 | 0.2.53 |      |

<!-- AUTO-APPS-END -->

## ### 自动 ### api-service 模块清单

<!-- AUTO-MODULES-BEGIN -->

| 模块          | app | dom | infra | pres | 状态    |
| ------------- | --- | --- | ----- | ---- | ------- |
| audit-log     | 2   | 2   | 3     | 2    | ✅ 完整 |
| auth          | 3   | 1   | 6     | 3    | ✅ 完整 |
| exchange-rate | 1   | 1   | 1     | 2    | ✅ 完整 |
| field-config  | 1   | 1   | 1     | 2    | ✅ 完整 |
| file          | 1   | 3   | 2     | 2    | ✅ 完整 |
| gtm           | 1   | 1   | 1     | 2    | ✅ 完整 |
| ipd           | 3   | 4   | 3     | 4    | ✅ 完整 |
| isc           | 1   | 1   | 1     | 2    | ✅ 完整 |
| mcp           | 0   | 0   | 0     | 0    | ❌ 空壳 |
| md-doc        | 1   | 1   | 1     | 2    | ✅ 完整 |
| notification  | 1   | 1   | 1     | 2    | ✅ 完整 |
| permission    | 1   | 1   | 1     | 2    | ✅ 完整 |
| project       | 0   | 0   | 0     | 0    | ❌ 空壳 |
| recognition   | 6   | 6   | 6     | 8    | ✅ 完整 |
| role          | 1   | 1   | 1     | 2    | ✅ 完整 |
| system-config | 1   | 1   | 1     | 2    | ✅ 完整 |
| system-log    | 1   | 1   | 1     | 2    | ✅ 完整 |
| user          | 1   | 1   | 1     | 2    | ✅ 完整 |
| user-group    | 1   | 1   | 1     | 2    | ✅ 完整 |
| voc           | 1   | 1   | 1     | 1    | ✅ 完整 |

<!-- AUTO-MODULES-END -->

### 模块说明（人工维护，改代码时同步）

| 模块          | 说明                                                                                                 |
| ------------- | ---------------------------------------------------------------------------------------------------- |
| auth          | 飞书 OAuth 登录 / JWT 双 token / Redis 会话与黑名单 / 无感刷新 / SSO Cookie；P1-1 增加超管与权限缓存 |
| user          | 用户查询、角色分配、启停用；组织字段由飞书同步维护（P1-2）                                           |
| role          | 角色 CRUD + 权限绑定；已并入管理台「权限配置 · 配置 Tab」（左侧角色、右侧权限树）                    |
| permission    | 权限点管理 + P1-1 单一注册表（`packages/permission`）派生种子/菜单/路由/按钮/接口                    |
| audit-log     | 全局写操作拦截器 → audit_log；P1-5 增加越权与导出审计                                                |
| field-config  | 动态字段配置；业务字典 P1-5 补齐                                                                     |
| notification  | 内站消息（轮询拉取/已读/事件触发）；飞书机器人推送待补                                               |
| file          | MinIO 预签名上传下载，桶规划（徽章/商品图/头像/md 附件）；P1-1 补上传权限                            |
| system-config | 可配参数（认可币额/体力上限/绩效系数等）+ 字典                                                       |
| system-log    | 系统日志查询（与 audit-log 分列）                                                                    |
| exchange-rate | 汇率体系：cron 每日抓取 + 人工校验；菜单码 P1-1 修正                                                 |
| ipd           | 产品线 / SPU / SKU / IPD 五期记录；P4 立项、设计、手办样主线                                         |
| gtm           | campaign / KOL / 社群反馈 / 预售；P4 增加 tiktok_shop 平台与 SPU 关联                                |
| isc           | 供应商 / 报价 / 生产批次 / 头程；P4 串联试单链路                                                     |
| voc           | 工单（五渠道）；SLA/知识库二期                                                                       |
| md-doc        | 付费知识文档库，已停止扩展                                                                           |
| mcp           | 空壳，暂不投入                                                                                       |
| project       | 空壳，P4 并入 `ipd` 后删除                                                                           |

## ### 自动 ### 数据模型

<!-- AUTO-MODELS-BEGIN -->

| 模型              | 说明 |
| ----------------- | ---- |
| User              |      |
| Department        |      |
| SyncLog           |      |
| Role              |      |
| UserGroup         |      |
| UserGroupMember   |      |
| RoleGroup         |      |
| Permission        |      |
| RolePermission    |      |
| AuthSession       |      |
| AuditLog          |      |
| Notification      |      |
| File              |      |
| SystemConfig      |      |
| FieldConfig       |      |
| McpTool           |      |
| McpSession        |      |
| McpToolLog        |      |
| SchedulerConfig   |      |
| SchedulerRun      |      |
| Badge             |      |
| Recognition       |      |
| RecognitionLike   |      |
| CoinAccount       |      |
| CoinTransaction   |      |
| StaminaAccount    |      |
| Product           |      |
| ExchangeOrder     |      |
| MdDoc             |      |
| MdDocCollaborator |      |
| MdDocImage        |      |
| SystemLog         |      |
| ProductLine       |      |
| Spu               |      |
| Sku               |      |
| IpdResearch       |      |
| DesignTask        |      |
| PrototypeReview   |      |
| InvestDecision    |      |
| RoiReview         |      |
| GtmCampaign       |      |
| Kol               |      |
| CommunityFeedback |      |
| PresaleBatch      |      |
| Supplier          |      |
| SupplierQuote     |      |
| ProductionBatch   |      |
| ShipmentOrder     |      |
| VocTicket         |      |
| ExchangeRate      |      |

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
| 20260920000000_add_audit_log_system_module           |      |
| 20260920120000_int_id_and_soft_delete                |      |
| 20260920120100_restore_converted_unique_indexes      |      |
| 20260920130000_unify_timestamps                      |      |
| 20260921000000_add_system_log                        |      |
| 20261015000000_add_product_line_pipeline             |      |
| 20261023000000_add_md_doc_collaborators              |      |
| 20261111000000_add_user_group_and_permission_tree    |      |

<!-- AUTO-MIGRATIONS-END -->

## ### 自动 ### 测试覆盖

<!-- AUTO-TESTS-BEGIN -->

| 目录              | spec 数量 |
| ----------------- | --------- |
| apps/api-service  | 7         |
| apps/cron-service | 2         |
| **合计**          | **9**     |

<!-- AUTO-TESTS-END -->

## ### 自动 ### API 路由

<!-- AUTO-API-BEGIN -->

| 模块          | 方法   | 路径                                                          |
| ------------- | ------ | ------------------------------------------------------------- |
| exchange-rate | Delete | /api/system/exchange-rates/:id                                |
| field-config  | Delete | /api/field-config/:id                                         |
| file          | Delete | /api/files/:id                                                |
| gtm           | Delete | /api/gtm/campaigns/:id                                        |
| gtm           | Delete | /api/gtm/campaigns/:id                                        |
| gtm           | Delete | /api/gtm/campaigns/:id                                        |
| gtm           | Delete | /api/gtm/campaigns/feedbacks/:id                              |
| ipd           | Delete | /api/ipd/design-tasks/:id                                     |
| ipd           | Delete | /api/ipd/product-lines/:id                                    |
| ipd           | Delete | /api/ipd/researches/:id                                       |
| ipd           | Delete | /api/ipd/reviews/:id                                          |
| ipd           | Delete | /api/ipd/skus/:id                                             |
| ipd           | Delete | /api/ipd/spus/:id                                             |
| isc           | Delete | /api/isc/suppliers/:id                                        |
| isc           | Delete | /api/isc/suppliers/:id                                        |
| isc           | Delete | /api/isc/suppliers/:id                                        |
| isc           | Delete | /api/isc/suppliers/quotes/:quoteId                            |
| md-doc        | Delete | /api/md-docs/:id                                              |
| permission    | Delete | /api/permissions/:id                                          |
| recognition   | Delete | /api/recognition/badges/:id                                   |
| recognition   | Delete | /api/recognition/products/:id                                 |
| role          | Delete | /api/roles/:id                                                |
| system-config | Delete | /api/system-config/:id                                        |
| user-group    | Delete | /api/user-groups/:id                                          |
| voc           | Delete | /api/voc/tickets/:id                                          |
| audit-log     | Get    | /api/audit-logs                                               |
| auth          | Get    | /api/auth/feishu/callback                                     |
| auth          | Get    | /api/auth/feishu/login                                        |
| auth          | Get    | /api/auth/me                                                  |
| auth          | Get    | /api/auth/mock-users                                          |
| exchange-rate | Get    | /api/system/exchange-rates                                    |
| exchange-rate | Get    | /api/system/exchange-rates/latest                             |
| field-config  | Get    | /api/field-config                                             |
| field-config  | Get    | /api/field-config/:id                                         |
| field-config  | Get    | /api/field-config/options                                     |
| file          | Get    | /api/files                                                    |
| file          | Get    | /api/files/:id                                                |
| gtm           | Get    | /api/gtm/campaigns                                            |
| gtm           | Get    | /api/gtm/campaigns                                            |
| gtm           | Get    | /api/gtm/campaigns                                            |
| gtm           | Get    | /api/gtm/campaigns/:id                                        |
| gtm           | Get    | /api/gtm/campaigns/gtm/feedbacks                              |
| gtm           | Get    | /api/gtm/campaigns/gtm/product-lines/:productLineId/feedbacks |
| ipd           | Get    | /api/ipd/product-lines                                        |
| ipd           | Get    | /api/ipd/product-lines/:id                                    |
| ipd           | Get    | /api/ipd/product-lines/:id/decision                           |
| ipd           | Get    | /api/ipd/product-lines/:id/design-tasks                       |
| ipd           | Get    | /api/ipd/product-lines/:id/prototype                          |
| ipd           | Get    | /api/ipd/product-lines/:id/researches                         |
| ipd           | Get    | /api/ipd/product-lines/:id/reviews                            |
| ipd           | Get    | /api/ipd/product-lines/:productLineId/spus                    |
| ipd           | Get    | /api/ipd/spus                                                 |
| ipd           | Get    | /api/ipd/spus/:id                                             |
| ipd           | Get    | /api/ipd/spus/:id/skus                                        |
| isc           | Get    | /api/isc/suppliers                                            |
| isc           | Get    | /api/isc/suppliers                                            |
| isc           | Get    | /api/isc/suppliers                                            |
| isc           | Get    | /api/isc/suppliers/:id                                        |
| isc           | Get    | /api/isc/suppliers/:id/quotes                                 |
| isc           | Get    | /api/isc/suppliers/quotes/list                                |
| md-doc        | Get    | /api/md-docs                                                  |
| md-doc        | Get    | /api/md-docs/:id                                              |
| md-doc        | Get    | /api/md-docs/:id/collaborators                                |
| md-doc        | Get    | /api/md-docs/collaborator-candidates                          |
| notification  | Get    | /api/notifications                                            |
| notification  | Get    | /api/notifications/unread-count                               |
| permission    | Get    | /api/permissions                                              |
| permission    | Get    | /api/permissions/tree                                         |
| recognition   | Get    | /api/recognition                                              |
| recognition   | Get    | /api/recognition/badges                                       |
| recognition   | Get    | /api/recognition/badges/:id                                   |
| recognition   | Get    | /api/recognition/badges/options                               |
| recognition   | Get    | /api/recognition/exchange/coin-account                        |
| recognition   | Get    | /api/recognition/exchange/coin-transactions                   |
| recognition   | Get    | /api/recognition/exchange/orders                              |
| recognition   | Get    | /api/recognition/exchange/pending-count                       |
| recognition   | Get    | /api/recognition/exchange/stamina                             |
| recognition   | Get    | /api/recognition/feed                                         |
| recognition   | Get    | /api/recognition/level                                        |
| recognition   | Get    | /api/recognition/pending-count                                |
| recognition   | Get    | /api/recognition/products                                     |
| recognition   | Get    | /api/recognition/products/:id                                 |
| role          | Get    | /api/roles                                                    |
| role          | Get    | /api/roles/:id/groups                                         |
| role          | Get    | /api/roles/options                                            |
| system-config | Get    | /api/system-config/:id                                        |
| system-log    | Get    | /api/system-logs                                              |
| user          | Get    | /api/users                                                    |
| user          | Get    | /api/users/groups                                             |
| user-group    | Get    | /api/user-groups                                              |
| user-group    | Get    | /api/user-groups/:id/members                                  |
| user-group    | Get    | /api/user-groups/options                                      |
| voc           | Get    | /api/voc/tickets                                              |
| voc           | Get    | /api/voc/tickets/:id                                          |
| auth          | Post   | /api/auth/logout                                              |
| auth          | Post   | /api/auth/mock-login                                          |
| auth          | Post   | /api/auth/refresh                                             |
| exchange-rate | Post   | /api/system/exchange-rates                                    |
| field-config  | Post   | /api/field-config                                             |
| file          | Post   | /api/files/upload                                             |
| gtm           | Post   | /api/gtm/campaigns                                            |
| gtm           | Post   | /api/gtm/campaigns/product-lines/:productLineId               |
| gtm           | Post   | /api/gtm/campaigns/product-lines/:productLineId/feedbacks     |
| gtm           | Post   | /api/gtm/campaigns/spus/:spuId                                |
| ipd           | Post   | /api/ipd/product-lines                                        |
| ipd           | Post   | /api/ipd/product-lines/:id/design-tasks                       |
| ipd           | Post   | /api/ipd/product-lines/:id/researches                         |
| ipd           | Post   | /api/ipd/product-lines/:id/reviews                            |
| ipd           | Post   | /api/ipd/product-lines/:productLineId/spus                    |
| ipd           | Post   | /api/ipd/spus/:id/skus                                        |
| isc           | Post   | /api/isc/suppliers                                            |
| isc           | Post   | /api/isc/suppliers                                            |
| isc           | Post   | /api/isc/suppliers/quotes                                     |
| isc           | Post   | /api/isc/suppliers/spus/:spuId                                |
| md-doc        | Post   | /api/md-docs                                                  |
| md-doc        | Post   | /api/md-docs/upload-image                                     |
| notification  | Post   | /api/notifications                                            |
| permission    | Post   | /api/permissions                                              |
| permission    | Post   | /api/permissions/sync                                         |
| recognition   | Post   | /api/recognition                                              |
| recognition   | Post   | /api/recognition/:id/like                                     |
| recognition   | Post   | /api/recognition/badges                                       |
| recognition   | Post   | /api/recognition/exchange/orders                              |
| recognition   | Post   | /api/recognition/products                                     |
| role          | Post   | /api/roles                                                    |
| user-group    | Post   | /api/user-groups                                              |
| voc           | Post   | /api/voc/tickets                                              |
| exchange-rate | Put    | /api/system/exchange-rates/:id                                |
| field-config  | Put    | /api/field-config/:id                                         |
| gtm           | Put    | /api/gtm/campaigns/:id                                        |
| gtm           | Put    | /api/gtm/campaigns/:id                                        |
| gtm           | Put    | /api/gtm/campaigns/:id                                        |
| gtm           | Put    | /api/gtm/campaigns/feedbacks/:id                              |
| ipd           | Put    | /api/ipd/design-tasks/:id                                     |
| ipd           | Put    | /api/ipd/product-lines/:id                                    |
| ipd           | Put    | /api/ipd/product-lines/:id/decision                           |
| ipd           | Put    | /api/ipd/product-lines/:id/prototype                          |
| ipd           | Put    | /api/ipd/product-lines/:id/stages                             |
| ipd           | Put    | /api/ipd/researches/:id                                       |
| ipd           | Put    | /api/ipd/reviews/:id                                          |
| ipd           | Put    | /api/ipd/skus/:id                                             |
| ipd           | Put    | /api/ipd/spus/:id                                             |
| isc           | Put    | /api/isc/suppliers/:id                                        |
| isc           | Put    | /api/isc/suppliers/:id                                        |
| isc           | Put    | /api/isc/suppliers/:id                                        |
| isc           | Put    | /api/isc/suppliers/quotes/:quoteId                            |
| md-doc        | Put    | /api/md-docs/:id                                              |
| md-doc        | Put    | /api/md-docs/:id/collaborators                                |
| notification  | Put    | /api/notifications/:id/read                                   |
| notification  | Put    | /api/notifications/read-all                                   |
| permission    | Put    | /api/permissions/:id                                          |
| recognition   | Put    | /api/recognition/:id/approve                                  |
| recognition   | Put    | /api/recognition/:id/pin                                      |
| recognition   | Put    | /api/recognition/:id/reject                                   |
| recognition   | Put    | /api/recognition/badges/:id                                   |
| recognition   | Put    | /api/recognition/exchange/coin-adjust                         |
| recognition   | Put    | /api/recognition/exchange/orders/:id/approve                  |
| recognition   | Put    | /api/recognition/exchange/orders/:id/fulfill                  |
| recognition   | Put    | /api/recognition/exchange/orders/:id/reject                   |
| recognition   | Put    | /api/recognition/products/:id                                 |
| role          | Put    | /api/roles/:id                                                |
| role          | Put    | /api/roles/:id/groups                                         |
| system-config | Put    | /api/system-config/:id                                        |
| user          | Put    | /api/users/:id/status                                         |
| user-group    | Put    | /api/user-groups/:id                                          |
| user-group    | Put    | /api/user-groups/:id/members                                  |
| user-group    | Put    | /api/user-groups/:id/roles                                    |
| voc           | Put    | /api/voc/tickets/:id                                          |

<!-- AUTO-API-END -->
