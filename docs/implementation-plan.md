# Owl 项目实施计划（分阶段）

> 基于 `docs/grill-mvp-decisions.md` 的 MVP 决策集制定
> 交付形态：单仓库 monorepo + GitHub Actions CI/CD，5 个服务（api-service / cron-service / owl-web / admin-web / cron-web），K8s 命名空间 `owl`
> 投入：开发 1-2 人。总工期预估 8-11 周。

---

## 阶段总览

| 阶段                    | 周期   | 内容                                         | 关键产出                          |
| ----------------------- | ------ | -------------------------------------------- | --------------------------------- |
| Phase 0 工程脚手架      | 1-2 周 | monorepo、基础设施、Harness、CI/CD           | 空仓库能跑全套环境，CI 绿         |
| Phase 1 认证与权限底座  | 1-2 周 | 飞书登录、RBAC、审计、SSO                    | 一个登录态贯穿 3 前端             |
| Phase 2 业务主干 MVP    | 3-4 周 | 13 阶段流水线、管道看板、利润聚合            | 一条机会闭环到利润核算            |
| Phase 3 底座补全 + Cron | 1-2 周 | notification/file/config/mcp + cron 同步测试 | 底座 10 模块全交付，cron 管道验证 |
| Phase 4 部署与交付      | 1 周   | K3s 部署、冒烟验证、文档                     | 系统可交付业务 3 人正式使用       |

---

## Phase 0：工程脚手架与基础设施

**目标**：从空仓库起步，一条命令起全套本地环境；GitHub Actions 门禁全绿；3 个前端可访问；为后续开发建立不可违反的工程护栏。

### 功能清单

1. **Monorepo 初始化**
   - pnpm workspaces：`apps/{api-service,cron-service,owl-web,admin-web,cron-web}` + `packages/{shared,database}`
   - 根配置 6 件套：`pnpm-workspace.yaml`、`package.json`、`tsconfig.json`、`.gitignore`、`.prettierrc`、`.editorconfig`
   - `packages/shared`（@owl/shared）：types/auth.types、types/api.types、constants/、纯函数 utils
   - `packages/database`（@owl/database）：Prisma schema 基础表 + 迁移脚本
2. **Harness 工程护栏**（对 MD 第 13 章适配 Owl）
   - `scripts/check-architecture.sh`（16 项：跨模块导入/DDD 依赖方向/MCP 受限导入/共享包纯净/文件行数/生成文件保护/deprecated 命名/临时文件/ScheduleModule 单例/多前端边界/前端代码规范/旧前端冻结/路由去重/裸装饰器/菜单死链/模块隔离）
   - `scripts/scan-ai-residue.sh`（console.log/magic number/any/内联业务逻辑/未处理 Promise/TODO-FIXME）
   - `scripts/check-typecheck.sh`、`scripts/check-lint.sh`、`scripts/verify.sh`
   - `.husky/pre-commit`、`.husky/pre-push`
   - `AGENTS.md`（SSOT 规则）
3. **本地基础设施**
   - `docker/docker-compose.yml`：PostgreSQL 18、Redis 7、RabbitMQ 3、MinIO
   - `docker/`：5 个 Dockerfile（api、cron-service、owl、admin、cron）
4. **CI/CD**
   - `.github/workflows/ci.yml`（PR：lint/typecheck/arch/单测）
   - `.github/workflows/cd.yml`（push main 版本变更检测，只部署变更服务）
   - `.github/workflows/cd-manual.yml`（workflow_dispatch 手动选择）
5. **3 前端骨架**
   - owl-web / admin-web / cron-web 各自 Vite 项目起得来，指向同一 auth 底座

### 验收标准

- [x] `docker compose up` 一次性拉起 PG/Redis/RabbitMQ/MinIO，端口连通
- [x] 5 个 app 的 dev server 都能启动，3 个前端页面可访问
- [x] 新写一个含跨模块违规的测试文件 → `scripts/check-architecture.sh` 报 ERROR 并 exit 1
- [x] `.husky/pre-commit` 门禁生效：违规代码 commit 被阻止
- [ ] 提交到 GitHub 触发 `ci.yml`，全绿通过
- [x] `npm run verify:quick`（typecheck→lint→format→arch）全绿
- [x] `AGENTS.md` 已就位，包含铁律、DDD 分层、禁止行为、验证命令

---

## Phase 1：认证与权限底座

**目标**：飞书 OAuth 登录 + JWT 双 token 无感刷新 + RBAC（业务用户/只读）+ 操作审计；**一个登录态跨 3 前端**（同一路由域，owl/ admin/ cron/ 前缀各自指向对应前端）。

### 功能清单

1. **认证（api-service · auth 模块）**
   - 飞书 OAuth 登录（前端跳转授权 → 回调 code → 换用户身份 → 签发 JWT）
   - JWT 双 token：access 2h + refresh 3d，无感刷新（401 自动 refresh）
   - Redis 会话缓存 + JWT 黑名单/吊销；登出
   - SSO：3 前端共用同一登录态，前端按路由前缀分发
2. **用户/角色/权限（api-service · user/role/permission 模块）**
   - 用户 CRUD（飞书组织同步）
   - 角色 CRUD；权限点 CRUD
   - 种子数据：`业务用户`（全量）、`只读`（只读全系统）
   - JwtAuthGuard + PermissionGuard + `@RequirePermission` 装饰器
3. **审计（api-service · audit-log 模块）**
   - 写操作拦截器自动记录（操作人/时间/动作/前后值/IP/结果）
4. **前端接入**
   - 登录页 + 路由守卫 + axios 拦截器（无感刷新）
   - admin-web：用户管理页、角色管理页（配用户→角色）

### 验收标准

- [ ] 未登录访问任意前端路由 → 跳飞书登录；登录后 3 前缀路由均可访问且同一会话
- [ ] access token 过期 → 无感刷新成功（页面无感知）；refresh 过期 → 重新登录
- [ ] 登出后 token 立即失效，Redis 会话被清除
- [ ] admin-web 可创建用户、分配「业务用户/只读」角色
- [ ] `只读` 角色用户访问写接口 → 403；页面不可见写操作
- [ ] 任意写操作（创建/更新/删除）自动落 `audit_log`，可查询
- [ ] 双 token 登录流程通过冒烟测试（`verify:full` smoke 覆盖）

---

## Phase 2：业务主干 MVP

**目标**：13 阶段流水线跑通，管道看板 + 利润自动聚合——3 个业务人能完整走完一条机会从「机会判断」到「利润核算」，系统回答「这个产品赚不赚钱」。

### 功能清单

1. **project 模块（api-service）**
   - `opportunity_object` 单对象 + 线性状态机（13 阶段 + 投决通过/否决 + 经营层新品/老品/成熟维护/退市）
   - 三段分组：开发验证期 / 上市执行期 / 经营层
   - 阶段推进：自由推进、可回退、数据可改（改完全链利润重算）
   - 投决：通过 → 产品优化；否决 → 终态不可再动
   - 基础字段：产品名、市场（自由文本）、品类、备注
2. **8 个结构化阶段表单**（字段集见 `grill-mvp-decisions.md` 二章）
   - 投入验证：投入成本
   - GTM投流验证 / GTM投流：广告成本、销售额（毛额）
   - 供应链小批量履约 / 供应链履约：产品成本、履约成本
   - VOC售后验证 / VOC售后：退款额、售后成本
   - 财务利润测算：预计收入/成本/利润（手工）
   - 利润核算：自动聚合展示
   - 其余阶段（机会判断、投决、产品优化、产品上市）：仅状态推进 + 备注
3. **利润聚合纯函数（packages/shared）**
   - `利润 = Σ销售额 − Σ广告成本 − Σ产品成本 − Σ履约成本 − 投入成本 − Σ退款额 − Σ售后成本`
   - 全生命周期口径（验证期 + 执行期）；单元测试覆盖
4. **管道看板（owl-web 主页面）**
   - 列表：每条机会显示 当前阶段 / 投决结果 / 实时聚合利润 / 经营状态
   - 详情页：阶段推进按钮 + 各阶段表单 + 推进历史
   - 状态分组展示（三段）

### 验收标准

- [ ] 创建机会对象 → 沿 13 阶段推进到「利润核算」，阶段状态正确流转
- [ ] 在投流/履约/VOC 阶段录入数据后，利润核算自动算出正确数值（用已知数据手工核对）
- [ ] 回退到任一已录阶段改金额 → 利润实时重算
- [ ] 投决「否决」→ 对象进入终态，前端不可再推进、后端接口拒绝
- [ ] 投决「通过」→ 进入产品优化；经营状态可切换新品期/老品期/成熟期维护/退市（退市后终态）
- [ ] 管道看板实时反映每条机会的当前阶段与利润
- [ ] `只读` 角色可查看但不可推进/录入
- [ ] 纯函数单测覆盖利润公式边界（零成本/空数据/负值）
- [ ] 一条完整机会全流程 E2E 冒烟通过（`verify:full`）

---

## Phase 3：底座补全 + Cron 管道

**目标**：补齐剩余底座模块（notification / file / system-config / mcp），实现 cron-service + cron-web 的「飞书多维表格→系统」定时同步任务（纯管道测试），验证任务中心与 MQ 全链路。

### 功能清单

1. **剩余底座模块（api-service）**
   - notification：系统通知 + 飞书机器人 Webhook
   - file：MinIO 上传/下载（预签名 URL）；桶规划 creatives/images/attachments/exports
   - system-config：系统配置、字典
   - mcp：工具注册表 + 会话 + 鉴权 + adapter；**只读口径**（附录 C 7 个查询工具：get_opportunity/list_gates/get_creative/get_ad_test_result/get_voc_summary/get_ledger_summary/get_red_line_alerts）
2. **cron-service（独立 NestJS）**
   - 任务中心：`task_definition` / `task_run` 表 + cron 触发 → RabbitMQ → worker 消费 → 重试/死信/超时/幂等
   - MVP 单任务：**飞书多维表格 → 系统** 定时同步（纯管道测试，飞书表格 API 读测试表 → 写入对应表）
3. **cron-web**
   - 任务定义列表 / 执行记录 / 手动触发 / 死信视图
4. **cron 管理页审计**：任务启停/手动触发/重入队写 audit_log

### 验收标准

- [ ] notification：触发写操作/红线事件可发飞书机器人通知（测试 webhook）
- [ ] MinIO 上传文件 → 返回预签名 URL → 可下载；桶策略正确
- [ ] system-config 读写在 Redis 缓存生效
- [ ] MCP 7 个只读工具可经 adapter 调用返回正确数据；未授权工具返回 PERMISSION_DENIED；只读工具不触写接口
- [ ] cron 同步任务按 cron 表达式触发 → RabbitMQ → worker 消费 → `task_run` 状态正确记录
- [ ] 模拟失败 → 重试 3 次指数退避 → 超限进死信队列 → cron-web 可见死信并可重投
- [ ] 同步任务幂等（重复消息不重复写库）
- [ ] cron-web 可手动触发任务、查看执行日志；启停操作落审计
- [ ] MCP 只读口径通过架构检查（无写工具注册）

---

## Phase 4：部署与交付

**目标**：系统整体部署到 K3s（命名空间 `owl`），全链路验证通过，交付业务 3 人正式使用。

### 功能清单

1. **K3s 部署**
   - 5 个 Deployment + Service（api-service / cron-service / owl-web / admin-web / cron-web）
   - ConfigMap/Secret：DB、Redis、RabbitMQ、MinIO、飞书、JWT 密钥
   - Ingress / 端口转发：`owl/`、`admin/`、`cron/` 路由前缀
2. **CI/CD 打通**
   - push main → 构建变更服务镜像 → 推到镜像仓库 → 更新 K3s 清单
3. **端到端验证**
   - `verify:full`（typecheck→lint→format→arch→smoke 冒烟）在 CI 全绿
   - 一条机会对象在 K3s 环境走完全生命周期
4. **文档与交付物**
   - `AGENTS.md` 定稿；部署文档；README；`.env.example`
   - 种子数据核验（2 角色 + 初始化管理员）

### 验收标准

- [ ] 5 个服务在 K3s 全部 Running；健康检查通过
- [ ] 3 前端通过统一入口（路由前缀）可访问，登录态在 K8s 环境正常
- [ ] push main 自动部署变更服务，未变更服务不重建
- [ ] 冒烟脚本（`scripts/smoke.sh`：/health + 核心 API 断言 200 与数据形状）全绿
- [ ] 生产环境走通一条完整机会（创建→13 阶段→利润核算）
- [ ] 数据库迁移在空库上可重放；备份/恢复脚本存在
- [ ] 交付文档齐全，业务 3 人可自行登录使用

---

## 风险与依赖

| 风险                                      | 对策                                                                                                   |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 业务 MVP 砍掉门禁/验证协议，MD 远景不一致 | 本计划显式列出 Phase 2 待补清单（见 grill-mvp-decisions.md 第四章），验收时明确「本次交付 = 主干闭环」 |
| 底座 10 模块全做拖慢业务主线              | 关键路径为 Phase 2；Phase 3 的 file/notification/mcp 可与 Phase 2 并行开发                             |
| 3 前端 + 单登录态复杂度                   | SSO 通过同一域名路由前缀实现；若域名受限，退化为 3 前端各自登录但共用 refresh 会话                     |
| 飞书多维表格同步任务受 API 限制           | 纯管道测试用最小测试表；限流/幂等按任务中心规范落地                                                    |
| 1-2 人开发资源紧张                        | 严格按阶段退出标准推进，未达验收不进下一阶段                                                           |

## 里程碑

| 里程碑 | 时间       | 定义                           |
| ------ | ---------- | ------------------------------ |
| M1     | Phase 0 末 | 脚手架 + 基础设施 + CI 可用    |
| M2     | Phase 1 末 | 登录/RBAC/审计/SSO 可用        |
| M3     | Phase 2 末 | 业务主干闭环（关键里程碑）     |
| M4     | Phase 3 末 | 底座 10 模块 + cron 管道全交付 |
| M5     | Phase 4 末 | K3s 上线，交付业务使用         |
