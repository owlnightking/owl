# Owl

跨境电商内网管理系统（monorepo）。

Owl 先服务公司自用经营，按 **P1 系统基座 → P2 人才中心 → P3 财务一期 → P4 业务链路** 四期建设：权限与组织基座、人才全生命周期、记账/报销/出纳、产品立项到模拟渠道的纵向链路。SaaS 后置。

> 排期与范围的唯一事实源是 `docs/implementation-plan.md`；业务功能现状见 `docs/business-snapshot.md`；决策见 `docs/decisions/`。`docs/archive/grill-mvp-decisions.md` 已废弃，仅作历史记录。

---

## 一、架构

### 仓库结构

```
owl/
├── apps/                       # 应用（互不依赖）
│   ├── api-service/            # 主服务（NestJS）— 认证/RBAC/业务模块
│   ├── cron-service/           # 定时任务执行服务（NestJS + RabbitMQ）
│   ├── admin-web/              # 管理台（Vite + React + TS）
│   ├── owl-web/                # 内部业务工作台（Vite + React + TS）
│   ├── mobile-web/             # 移动端 H5（Vite + React + TS）
│   ├── cron-web/               # 定时任务控制台（Vite + React + TS）
│   └── portal/                 # 对外门户（Vite + React + TS）
├── packages/                   # 共享包（被一切依赖的最底层）
│   ├── shared/                 # @owl/shared — 类型/常量/错误码/纯函数
│   ├── permission/             # @owl/permission — 权限注册表（单一事实源）
│   ├── database/               # @owl/database — Prisma schema + migrations + seeds
├── scripts/                    # 工程护栏脚本（typecheck/lint/arch/残渣扫描/冒烟/发版/状态文档）
├── docs/                       # PROJECT_STATE.md 状态快照 + decisions/ 决策日志（见 AGENTS.md 第八节）
├── .github/workflows/          # CI/CD（cd.yml）
├── docker-compose.yml          # 仅编排应用服务（中间件复用本机 docker）
└── AGENTS.md                   # 开发规范 SSOT（改动代码前必读）
```

### 分层依赖（严格单向）

```
packages/shared / permission / database  → 类型、常量、权限码表、数据契约
api-service 内聚圆（模块级 DDD）：
presentation → application → domain ← infrastructure
（controller/dto → service → 纯业务模型 ← Prisma/SDK 实现）

apps 之间禁止互依；共享代码一律下沉到 packages/*。
依赖方向由 scripts/check-architecture.sh 强制校验，违规即 ERROR 阻断。
```

### 中间件

**项目不自起中间件**，统一复用本机已运行的 Docker 容器：

| 中间件                             | 容器名       | 端口 | 账号                |
| ---------------------------------- | ------------ | ---- | ------------------- |
| PostgreSQL (bitnami/postgresql:18) | `postgresql` | 5432 | admin / 123456      |
| Redis                              | `redis`      | 6379 | 密码 123456         |
| RabbitMQ                           | `rabbitmq`   | 5672 | admin / 123456      |
| MinIO                              | `minio`      | 9000 | admin / minio123456 |

连接配置见 `.env.example`（环境变量为唯一注入方式，禁止硬编码）。

---

## 二、快速开始

### 前置条件

- Node.js ≥ 22、pnpm ≥ 10（`corepack enable`）
- Docker（本机已运行上述 4 个中间件容器）

### 安装与初始化

```bash
# 1. 安装依赖
pnpm install

# 2. 配置环境变量（复制后按需修改；密钥不提交仓库）
cp .env.example .env

# 3. 数据库：生成 client → 迁移 → 种子（幂等）
export DATABASE_URL='postgresql://admin:123456@localhost:5432/owl'
pnpm -F @owl/database prisma:generate
pnpm -F @owl/database prisma:migrate deploy
pnpm -F @owl/database prisma:seed
```

### 一条命令启动

```bash
pnpm dev            # 并行拉起全部 5 个应用
pnpm dev api        # 仅 api-service
pnpm dev cron       # 仅 cron-service
pnpm dev owl        # 仅 owl-web 前端
pnpm dev admin      # 仅 admin-web 前端
pnpm dev cronweb    # 仅 cron-web 前端
```

端口在根目录 `.env` 配置（`API_PORT`/`CRON_PORT`/`WEB_GATEWAY_PORT`/`MOBILE_GATEWAY_PORT` 及各前端内部端口）。默认值：

| 入口 / 服务  | 地址                                                   |
| ------------ | ------------------------------------------------------ |
| Web 入口     | http://localhost:5172/（/portal、/owl、/admin、/cron） |
| Mobile 入口  | http://localhost:5173/                                 |
| api-service  | http://localhost:5100/api                              |
| cron-service | http://localhost:5101/cron                             |

### 一条命令停止

```bash
pnpm stop
```

按 `.env` 端口清理所有 dev 服务进程并释放端口（不影响共享中间件容器）。

容器化应用服务：

```bash
docker compose up -d --build   # 启动应用容器
docker compose down            # 停止并移除应用容器
```

> 中间件容器（postgresql/redis/rabbitmq/minio）是共享的，`docker compose down` 不影响它们。

### 验证

```bash
pnpm verify:quick   # typecheck + lint + format + arch 全绿
pnpm verify:full    # 以上 + 冒烟（build 后 /health 心跳断言）
```

---

## 三、CI/CD

GitHub Actions 工作流见 `.github/workflows/`：

| 工作流   | 触发                                                           | 作用                                                                           |
| -------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `cd.yml` | push main 且 `package.json` 变化；`workflow_dispatch` 手动应急 | 版本变化检测（门禁）→ lint 兜底 → 构建 Docker 镜像 → 部署到本地 k3s → 飞书通知 |

### 发版流程

```bash
# 1. 一键发版（verify:quick → version bump → commit → 打 tag，失败自动回滚）
pnpm version:all:patch          # 全部包 patch 升级
pnpm version:all:minor          # 全部包 minor 升级
pnpm version:api-service:patch  # 仅 api-service patch 升级
pnpm version:cron-service:minor # 仅 cron-service minor 升级

# 2. 确认后推送 main（CD 监听 main 的 package.json 变化，版本门禁决定是否部署）
git push origin main
```

Push main 且 package.json 有变化后 `cd.yml` 自动触发（`detect-release` 对比 HEAD 与 HEAD~1 版本号，无版本变化则跳过后续，仅版本 bump 会真正部署）：

1. **Check Version** — 对比 HEAD 与 HEAD~1 的 package.json version，确定需要部署的包
2. **Lint** — `pnpm verify:quick` 做最后兜底校验
3. **Build Backend** — 并行构建 api-service / cron-service Docker 镜像（tag 为版本号）
4. **Build Frontend** — 并行构建 admin-web / owl-web / cron-web / mobile-web Docker 镜像
5. **Deploy** — 从 k3s 容器提取 kubeconfig，`kubectl set image` 滚动更新现有 Deployment
6. **Notify** — 飞书群通知部署结果（绿/红卡片）

### 本地门禁（husky）

- **pre-commit**：暂存文件 prettier 检查 + AI 残渣增量扫描（`--staged`）
- **pre-push**：`pnpm verify:quick` + `pnpm feature:check`，任一失败阻断推送

提交信息遵循约定式提交：`feat/fix/refactor/chore/docs/test/...`。

---

## 四、工程护栏

| 脚本                             | 作用                                             |
| -------------------------------- | ------------------------------------------------ |
| `scripts/check-architecture.sh`  | 架构依赖方向（跨层依赖 → ERROR 阻断）            |
| `scripts/scan-ai-residue.sh`     | AI 残渣扫描（any/魔法数字/console/TODO 等 9 类） |
| `scripts/check-feature-rules.sh` | 业务特征规则（success 不进 vo 判断等）           |
| `scripts/release.sh`             | 版本发布（verify → bump → commit，失败回滚）     |
| `scripts/verify.sh`              | 完整验证流水线聚合                               |

完整开发规范见 **`AGENTS.md`**。

---

## 五、阶段规划

| 期  | 内容                                                                                                   | 状态   |
| --- | ------------------------------------------------------------------------------------------------------ | ------ |
| P1  | 系统基座：权限码表单源 + 四层校验、角色授权、飞书组织同步、登录兜底、飞书审批记录、编号/导出/字典/审计 | 进行中 |
| P2  | 人才中心：招聘面试、员工档案、异动、免打卡考勤、薪酬、绩效三档、奖惩、员工自助                         | 规划   |
| P3  | 财务一期：记账内核、资金出纳、报销与费用（飞书填单解析）、工资/社保/个税入账                           | 规划   |
| P4  | 业务链路：立项 → 研发设计 → 手办样 → 供应链 → 营销 → TikTok Shop 模拟数据，跑通即可                    | 规划   |

历史基线：Phase 0 工程护栏、Phase 1 飞书登录与 RBAC、S0 支撑域底座、S1 认可中心、B1 md 文档库、M0-v1 产品线骨架。

详细批次、验收与二期范围见 `docs/implementation-plan.md`。
