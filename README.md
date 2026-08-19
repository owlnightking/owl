# Owl

跨境电商内网管理系统（monorepo）。

Owl 以「一条机会从机会判断到利润核算」为核心业务闭环：13 阶段单对象线性流水线，覆盖投入验证、GTM 投流、供应链履约、VOC 售后、财务利润测算与自动利润核算。提供管理后台、内部业务工作台与定时任务控制台三套前端，同一登录态（SSO）贯穿。

> 项目形态与阶段规划见 `docs/grill-mvp-decisions.md`（MVP 决策集）与 `docs/implementation-plan.md`（分阶段实施计划）。

---

## 一、架构

### 仓库结构

```
owl/
├── apps/                       # 应用（互不依赖）
│   ├── api-service/            # 主服务（NestJS）— 认证/RBAC/审计/业务 pipeline
│   ├── cron-service/           # 定时任务执行服务（NestJS + RabbitMQ）
│   ├── owl-web/                # 内部业务工作台（Vite + React + TS）:5173
│   ├── admin-web/              # 管理台（Vite + React + TS）:5174
│   └── cron-web/               # 定时任务控制台（Vite + React + TS）:5175
├── packages/                   # 共享包（被一切依赖的最底层）
│   ├── shared/                 # @owl/shared — 类型/常量/错误码/纯函数
│   └── database/               # @owl/database — Prisma schema + migrations + seeds
├── scripts/                    # 工程护栏脚本（typecheck/lint/arch/残渣扫描/冒烟/发版/状态文档）
├── docs/                       # PROJECT_STATE.md 状态快照 + decisions/ 决策日志（见 AGENTS.md 第八节）
├── .github/workflows/          # CI/CD（cd.yml）
├── docker-compose.yml          # 仅编排应用服务（中间件复用本机 docker）
└── AGENTS.md                   # 开发规范 SSOT（改动代码前必读）
```

### 分层依赖（严格单向）

```
packages/shared  → 类型 + 常量 + 错误码（DM 层）
packages/database → Prisma 数据契约（依赖 shared）

api-service 内聚圆（DDD）：
presentation → application → domain ← infrastructure
（controller/dto → use-case → 纯业务模型 ← Prisma/SDK 实现）

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

端口在根目录 `.env` 配置（`API_PORT`/`CRON_PORT`/`OWL_WEB_PORT`/`ADMIN_WEB_PORT`/`CRON_WEB_PORT`）。默认值：

| 服务         | 地址                      |
| ------------ | ------------------------- |
| api-service  | http://localhost:3000/api |
| owl-web      | http://localhost:5173     |
| admin-web    | http://localhost:5174     |
| cron-web     | http://localhost:5175     |
| cron-service | http://localhost:3001/api |

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

| 工作流   | 触发                                             | 作用                                                                    |
| -------- | ------------------------------------------------ | ----------------------------------------------------------------------- |
| `cd.yml` | push 版本 tag `v*`；`workflow_dispatch` 手动应急 | 版本变化检测 → lint 兜底 → 构建 Docker 镜像 → 部署到本地 k3s → 飞书通知 |

### 发版流程

```bash
# 1. 一键发版（verify:quick → version bump → commit → 打 tag，失败自动回滚）
pnpm version:all:patch          # 全部包 patch 升级
pnpm version:all:minor          # 全部包 minor 升级
pnpm version:api-service:patch  # 仅 api-service patch 升级
pnpm version:cron-service:minor # 仅 cron-service minor 升级

# 2. 确认后推送 main 与版本 tag（tag 触发 cd.yml）
git push origin main && git push origin v<new-version>
```

Push 版本 tag 后 `cd.yml` 自动触发（tag 由 release.sh 自动打，格式 `v<app>-<version>` 或 `v<version>`（all））：

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

| 阶段                    | 内容                                    | 里程碑     |
| ----------------------- | --------------------------------------- | ---------- |
| Phase 0 工程脚手架      | monorepo / 护栏 / CI / 3 前端骨架       | M1 已完成  |
| Phase 1 认证与权限底座  | 飞书登录 / RBAC / 审计 / SSO            | M2         |
| Phase 2 业务主干 MVP    | 13 阶段流水线 / 管道看板 / 利润聚合     | M3（关键） |
| Phase 3 底座补全 + Cron | notification/file/config/mcp + 定时同步 | M4         |
| Phase 4 部署与交付      | K3s 部署 / 全链路冒烟 / 文档            | M5         |
