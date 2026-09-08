# AGENTS.md — Owl Monorepo 开发规范

Owl 是跨境电商内网管理系统 monorepo。本文件约束所有代码变更，Agent 在改动任何文件前必须先读本文件。

## 一、适用与校验命令（提交前必须全绿）

```bash
pnpm typecheck        # 全仓 TS 类型检查
pnpm lint             # ESLint
pnpm format:check     # Prettier 格式校验
pnpm arch:check       # 架构依赖方向校验
pnpm doc:check        # 文档新鲜度（PROJECT_STATE.md 是否落后于源码）
pnpm state:update     # 重新生成 PROJECT_STATE.md 自动段（改代码后必须跑）
pnpm business:update  # 更新 business-snapshot.md 最近更新记录（改业务需求/计划后必须跑，可带摘要）
pnpm business:check   # 业务快照新鲜度（implementation-plan/decisions 有更新未同步快照 → ERROR）
pnpm verify:quick     # = 以上五项 + 业务快照 + 残渣扫描 + 特征规则检查，CI / pre-commit / pre-push 使用
pnpm verify:full      # = verify:quick + smoke
pnpm test             # 单元测试
```

阶段验收/提交前：`pnpm verify:quick` 必须通过。任何一步失败即为阻断。

## 二、语言与风格约定

- **TypeScript strict**：禁止 `any` 泄漏、`as any`、`as unknown as`。如需转义类型使用精确的窄化。
- **魔法数字**：禁止裸数字（3、500、86400 等）。HTTP 状态码用 `HttpStatus.*`，业务错误码用 `@owl/shared` 的 `ApiErrorCode`，阈值放入具名常量或环境配置。
- **命名**：禁止无意义占位名（a/b/tmp/xxx）。`data`/`result` 等通用名允许但优先语义化。
- **注释**：注释解释"为什么"，不写"做了什么"。禁止只有流水账式注释。
- **禁止 console.log 残留**：进程内日志用 NestJS `Logger` / 前端 console 按环境封装；唯一例外是各包入口 `main.ts` 的启动日志。
- **TODO/FIXME 必须带 @责任人**（如 `// TODO(@zhangsan): trailingItem 去重`）。禁止裸 TODO。
- **空 catch 禁止**：异常必须记录或重新抛出。
- **外部输入校验**：Controller 层入参必须经过 DTO + class-validator；禁止直接 `@Body() body: any`。
- **禁止颜文字/emoji**：源码中禁止直接使用 Unicode emoji 字符（如 📢✅❤️🚀⚙️ 等）。所有图标统一使用 UI 库的 Icon 组件（`@arco-design/web-react/icon` 或 `@arco-design/mobile-react/icon`）。
- **UI 组件库严格匹配应用类型**：`mobile-web` 必须使用 `@arco-design/mobile-react`，禁止导入 `@arco-design/web-react`；`admin-web`/`cron-web`/`owl-web`/`portal` 必须使用 `@arco-design/web-react`，禁止导入 `@arco-design/mobile-react`。

以上规则由 `scripts/scan-ai-residue.sh` 扫描兜底（`--staged` 用于 pre-commit 增量扫描）。

## 三、架构（严格分层，单向依赖）

```
packages/shared        → 类型 + 常量 + 错误码（DM 层，被一切依赖）
packages/database      → Prisma schema + migrations + seeds（依赖 shared）
apps/api-service/      → NestJS 主服务
  src/presentation/    → controllers / dto / guards / filters（只做参数接收与响应编排）
  src/application/     → use-case / 服务编排 / 事务边界（依赖 domain && infrastructure 接口）
  src/domain/          → 纯业务模型 / 领域事件 / 端口接口（零基础设施依赖）
  src/infrastructure/  → Prisma / 外部 SDK / redis 等实现（实现 domain 端口）
apps/admin-web/        → 管理台 Web（Vite + React + TS）
apps/cron-web/         → 定时任务控制台（Vite + React + TS）
apps/owl-web/          → 内部业务工作台（Vite + React + TS）
apps/cron-svc/         → 定时任务执行服务
apps/ow/               → CLI / 脚本工具
```

依赖方向规则：

- `presentation → application → domain ← infrastructure`（内聚圆）。同级、上层依赖下层；**禁止任何向下反向依赖**。
- 各 app 之间**禁止互相依赖**；共享代码一律下沉到 `packages/*`。
- `entrypoints（main.ts）→ app.module → 内部模块`；entrypoints 之间互不依赖。
- `packages/shared`、`packages/database` 为所有包可依赖的最底层公共包；禁止依赖任何 app。
- 校验由 `scripts/check-architecture.sh` 执行，模式支持 `import "owner"`、`index`、`src` 三种，默认递归 owner。任何跨层依赖立即报 ERROR。

## 四、根目录脚本（scripts/*）

| 脚本                        | 作用                                                                                    |
| --------------------------- | --------------------------------------------------------------------------------------- |
| check-typecheck.sh          | 逐包 tsc --noEmit，聚合退出码                                                           |
| check-lint.sh               | 逐包 eslint，聚合退出码                                                                 |
| check-architecture.sh       | 架构依赖方向检测（ERROR=0 才通过）                                                      |
| scan-ai-residue.sh          | AI 残渣扫描（9 类规则，ERROR 阻断 / WARN 提示；`--staged` 用于 pre-commit 增量扫描）    |
| check-feature-rules.sh      | 业务特征规则检查（success 不在 vo 判断、filter 不返回 entity、id 生成放 domain 等）     |
| smoke.sh                    | 冒烟验收（构建后启动心跳检查）                                                          |
| release.sh                  | 版本发布（verify:quick → version bump → commit，失败自动回滚）                          |
| verify.sh                   | 完整验证流水线聚合（typecheck → lint → format → arch → doc → 残渣 → test）              |
| update-state.sh             | 重新生成 `docs/PROJECT_STATE.md` 自动段（扫描源码，脚本管事实 / 人管"为什么"）          |
| check-doc-freshness.sh      | 代码改动但状态文档未同步 → ERROR（`--staged` 用于 pre-commit 增量检查；版本 bump 豁免） |
| update-business-snapshot.sh | 更新 `docs/business-snapshot.md`「最近更新」段并格式化（业务需求/计划变化后运行）       |
| check-business-freshness.sh | 计划/决策文档改动但业务快照未同步 → ERROR（`--staged` 用于 pre-commit 增量检查）        |

新增扫描/校验脚本：必须加入 `package.json` 对应脚本、`verify:quick`、pre-commit/pre-push 与 CI 工作流，保持入口一致。

## 五、数据库与本地中间件

- **中间件复用本机 Docker 容器**：PostgreSQL（`postgresql`，5432，admin/123456）、Redis（`redis`，6379，123456）、RabbitMQ（`rabbitmq`，5672，admin/123456）、MinIO（`minio`，9000，admin/minio123456）。本项目**不自起中间件**，连接配置见 `.env.example`。本机容器/镜像完整清单与保护规则见**第十一节**。
- Prisma Schema 为唯一数据契约，改动后必须 `pnpm -F @owl/database prisma:generate`。
- 迁移：`pnpm -F @owl/database prisma:migrate --name <描述>`（dev）；生产改动用 `prisma:migrate deploy`。
- 模型与命名：`camelCase` 字段、snake_case 表名（`@@map`），默认加 `createAt/updateAt` 审计时间戳。
- 种子：`pnpm -F @owl/database prisma:seed`，幂等（upsert）。
- **⚠️ 禁止破坏性 Prisma 命令（硬性规则）**：本项目共享单一 PostgreSQL 数据库，承载 api-service、cron-service 等多服务数据。以下命令**严禁在共享库上执行**，违规将清空全库所有服务数据且不可恢复：
  - `prisma migrate reset` — 会删除整个数据库并重建
  - `prisma db push --accept-data-loss` — 会丢弃不兼容的表数据
  - **唯一安全的迁移方式**：`prisma migrate dev --name <描述>`（增量迁移，保留数据）；生产环境用 `prisma migrate deploy`。
  - 如确实需要重置本地开发库，**必须先 `pg_dump` 备份**，且仅限个人开发环境，不得影响他人共享数据。

## 六、测试

- 单测放 `各包/src/**/*.spec.ts`，与实现同目录。
- 新增业务逻辑（application 层 use-case）必须附单测，覆盖成功路径与失败路径。
- 冒烟：`pnpm smoke` 构建后跑心跳；数据库相关冒烟依赖 docker-compose 起的 Postgres。

## 七、变更流程规范

1. 修改前读本文件与目标文件上下文，遵守现有模式。
2. 提交前：`pnpm verify:quick` 全绿。
3. husky：pre-commit 检测源码改动 → 自动重生成并暂存 `PROJECT_STATE.md` → prettier --check 暂存文件 → AI 残渣增量扫描 → 文档新鲜度增量检查 → 业务快照新鲜度检查（计划/决策改动需同 commit 同步 `business-snapshot.md`）；pre-push 跑 `pnpm verify:quick`。
4. 提交信息遵循约定式提交 `feat/fix/refactor/chore/docs/test/...`。
5. **发版（version bump）提交不带版本号**：`chore: bump <app> version`（单 app）或 `chore: bump frontend versions`（多前端一次提交）。禁止 `to 0.1.29` 这类带具体版本号的后缀。`release.sh` 会在 bump commit 后自动打版本 tag（`v<app>-<version>` 单 app / `v<version>` all）仅作版本标记；**CD 监听 main push 的 `package.json` 变化，由 `detect-release` 版本门禁决定是否部署（非版本变化自动跳过）**。
6. **禁止在代码中硬编码密钥/口令**；统一走环境变量（.env*，不入库）。

## 八、文档新鲜度（Documentation Harness）

**核心原则：文档分四层，各有防漂移机制；任何代码改动必须同 commit 更新状态文档，任何业务需求/计划变化必须同 commit 更新业务快照。**

1. **`docs/PROJECT_STATE.md` — 工程状态快照**：AI/人开工前先读这一个文件拿源码全局，避免重扫全仓。`### 自动 ###` 段由 `scripts/update-state.sh` 扫描源码生成（**禁止手改**），人工只维护"当前阶段 / 已知缺口 / 模块说明"三处。**pre-commit 检测到源码改动会自动重生成并暂存该文档**；人工维护段（如已知缺口）需手动编辑，随改动提交。也可随时 `pnpm state:update` 手动刷新。
2. **`docs/business-snapshot.md` — 业务功能现状 + 最新计划（快照，AI 读）**：记录各业务功能现状（规则/角色/入口/状态）与最新计划/排期，随业务需求与计划变化更新（不随源码）。「最近更新」段由 `scripts/update-business-snapshot.sh` 维护（**禁止手改**）；功能/计划内容人工维护。计划或决策文档更新后必须同步本文件并随改动提交。也可随时 `pnpm business:update "变更摘要"` 手动记录。
3. **`docs/decisions/NNN-<slug>.md` — 决策日志（ADR-lite）**：只追加、永不修改；决策变化就新开一条更高编号记录变更。字段：日期 / 背景 / 决策 / 后果 / 关联。
4. **`AGENTS.md` / `README.md` / `docs/implementation-plan.md` — 稳定规则与计划层**：低频更新；implementation-plan 变化须同步业务快照。

**防漂移门禁**：

- `scripts/check-doc-freshness.sh` 对比源码与 `PROJECT_STATE.md` 的最近提交时间，源码新 → ERROR（提示运行 `pnpm state:update`）；pre-commit 增量检查暂存区。
- `scripts/check-business-freshness.sh` 对比 `docs/implementation-plan.md` + `docs/decisions/` 与 `docs/business-snapshot.md` 的最近提交时间，计划/决策新 → ERROR（提示运行 `pnpm business:update`）；pre-commit 增量检查暂存区。
- **版本 bump（仅 package.json）豁免**。新增扫描/校验脚本时同步更新本条与 CI。

## 九、生产环境 Secret 管理（Rancher）

**生产环境 Secrets 由 Rancher 管理，严禁通过 CD 流水线或代码配置。**

### 架构

```
Rancher UI (https://localhost:8443)
  ↓ 管理
k3s-owl-prod 集群 → owl namespace → Secrets
  ↓ 注入
Pod 环境变量 (envFrom secretRef)
```

### Secret 清单

| Secret 名称           | Namespace | 用途                 | 数据项                                                                                           |
| --------------------- | --------- | -------------------- | ------------------------------------------------------------------------------------------------ |
| `api-service-secret`  | owl       | API 服务敏感配置     | DATABASE_URL, FEISHU_APP_SECRET, JWT_SECRET, MINIO_SECRET_KEY, POSTGRES_PASSWORD, REDIS_PASSWORD |
| `cron-service-secret` | owl       | 定时任务服务敏感配置 | DATABASE_URL, FEISHU_BUSINESS_APP_SECRET, POSTGRES_PASSWORD, REDIS_PASSWORD                      |

### 硬性规则

1. **禁止在 CD 流水线（cd.yml）中创建或管理 Secrets**：CD 只负责构建和部署应用，不涉及 Secret 配置。
2. **禁止在代码中硬编码任何敏感值**：所有敏感配置通过 K8s Secret 注入环境变量。
3. **Secret 变更必须通过 Rancher UI 操作**：登录 Rancher → k3s-owl-prod → Storage → Secrets → 选择 owl namespace → 编辑对应 Secret。
4. **新增 Secret 必须更新本文档**：添加新 Secret 时同步更新上方清单表。

### Rancher 访问信息

- URL: `https://localhost:8443`
- 用户名: `admin`
- 集群: `k3s-owl-prod`（Active）

### 操作流程

1. 登录 Rancher UI
2. 左侧导航选择 `k3s-owl-prod` 集群
3. 进入 `Storage` → `Secrets`
4. 选择 `owl` namespace
5. 点击 Secret 名称 → `Edit Config` 修改值
6. 修改后需重启对应 Pod 生效（Deployment 滚动更新）

## 十、CI/CD 工作流保护规则

`.github/workflows/cd.yml` 是本项目**唯一的 CD 工作流文件**，承担构建、部署、通知、清理等全部持续部署职责。

**AI Agent 硬性约束：**

1. **禁止私自改动 `cd.yml`**：任何对该文件的修改必须先向用户说明改动原因、具体变更内容，经用户明确同意后方可执行。未经许可的改动视为违规。
2. **禁止创建新的 `.github/workflows/*.yml` 文件**：CD 流水线统一由 `cd.yml` 管理，不允许新建其他 workflow 文件。如需新增 CI 流水线（如 PR 检查），须与用户确认后再操作。
3. **禁止删除或禁用 `cd.yml` 中的清理步骤**：Docker 镜像清理、缓存清理等步骤是磁盘空间保障机制，不得移除或跳过。
4. **修改 `cd.yml` 时必须保持 job 依赖关系正确**：改动 `needs` / `if` 条件前需确认不会破坏流水线拓扑（如并行变串行、遗漏必要依赖等）。

违反以上规则的提交将被阻断。

## 十一、本机容器与镜像清单（SSOT + 保护规则）

**本节固化本项目当前依赖的本机 Docker 容器/镜像——k3s、rancher、system 中间件组、actions-runner 四组，是容器与镜像事实的唯一权威来源。** 各容器运行/重建命令等细节以 **仓库外** 的 `~/Desktop/system/dockerData/README.md` 为准（dockerData 不属于 owl 仓库）；仓库内相关编排：`.github/actions-runner/`（CD runner）、根目录 `docker-compose.yml`（owl 应用容器）。

> 以下容器重启策略均为 `unless-stopped`。`k3s-net`（172.23.0.0/24，网关 172.23.0.1）承载 k3s / rancher / system 中间件，所有成员固定 IP，**Docker 重启后 IP 不变**，k3s pods 据此访问中间件。

### 1. k3s（单节点 K8s 集群）

| 项       | 值                                                                                                            |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| 容器     | `k3s`（`--privileged`，`docker run` 直启，非 compose）                                                        |
| 镜像     | `rancher/k3s:latest`                                                                                          |
| 网络     | `k3s-net` 固定 IP `172.23.0.2`；node IP 必须固定，变更会导致集群无法启动                                      |
| 宿主端口 | `6443`（API Server）、`9262`（NodePort 统一入口）、`9263`                                                     |
| 数据     | containerd 运行时走命名卷（宿主机 APFS bind 跑不动）；`server/db` bind 到 `dockerData/k3s/server/db`          |
| 说明     | 集群名 `k3s-owl-prod`，由 rancher 管理；重建必须带 `--node-ip 172.23.0.2 --disable-network-policy` 等固定参数 |

### 2. rancher（Rancher 面板）

| 项       | 值                                                                                                                      |
| -------- | ----------------------------------------------------------------------------------------------------------------------- |
| 容器     | `rancher`（`docker run` 直启，非 compose）                                                                              |
| 镜像     | `rancher/rancher:v2.14.3`                                                                                               |
| 网络     | `k3s-net` 固定 IP `172.23.0.3`                                                                                          |
| 宿主端口 | `80`（http 跳转）、`8443`（→ 容器 443）                                                                                 |
| 数据     | `dockerData/rancher` bind + 命名卷 `rancher-containerd`（containerd 必须走命名卷，宿主机 gRPC-FUSE 挂载跑不了嵌套 pod） |
| 说明     | 访问 https://localhost:8443（admin）；生产 Secret 管理见第九节                                                          |

### 3. system 中间件组（compose project `system`）

- 编排：`~/Desktop/system/dockerData/docker-compose.middleware.yml`（仓库外）
- **必须以 `-p system` 启动**：直接 `-f dockerData/...` 会把 project 名推断为 `dockerdata`，生成脱离分组的独立容器（minio 曾因此脱组）
- 全部在 `k3s-net` 固定 IP，k3s pods 经 `k3s-net` 访问

| 容器       | 镜像                       | 固定 IP     | 宿主端口    | 数据 bind（→ 容器内）                                       |
| ---------- | -------------------------- | ----------- | ----------- | ----------------------------------------------------------- |
| postgresql | bitnami/postgresql:latest  | 172.23.0.10 | 5432        | `dockerData/postgresql`（/bitnami/postgresql）              |
| redis      | redis:latest               | 172.23.0.11 | 6379        | `dockerData/redis`（/data）                                 |
| rabbitmq   | rabbitmq:latest            | 172.23.0.12 | 5672、15672 | `dockerData/rabbitmq`（/var/lib/rabbitmq）                  |
| minio      | bitnamilegacy/minio:latest | 172.23.0.13 | 9000、9001  | `dockerData/minio`（/bitnami/minio/data，镜像原生 datadir） |

### 4. actions-runner CD 组（compose project `actions-runner`）

- 编排：`.github/actions-runner/docker-compose.yml`（仓库内）；管理脚本 `manage.sh`
- 容器 `github-runner`；镜像 `owl/github-runner:latest`（`.github/actions-runner/Dockerfile` 构建）
- 网络 `actions-runner_default`（172.22.0.2），无宿主端口
- 挂载 `/var/run/docker.sock`（CD 中可构建镜像）；命名卷 `runner-work` / `runner-config`；环境变量经 `.env`（不入库）

> 根目录 `docker-compose.yml` 编排 owl 应用容器（project `owl`），是仓库自有应用的正常开发对象，不在下面保护范围内；改其镜像引用/编排按常规流程走。

### 硬性规则（AI 约束）

1. **禁止未经用户明确同意修改上述四组的容器方式**：不得创建/删除/停止/重启/重建这些容器，不得改动其启动参数、端口映射、网络、卷、环境变量或编排文件（含仓库外 `dockerData/docker-compose.middleware.yml` 与仓库内 `.github/actions-runner/`）。
2. **禁止未经用户明确同意修改镜像**：不得对上述镜像执行 `docker pull` / `docker tag` / `docker rmi` / `docker build`，不得改动编排文件中的镜像引用或相关 Dockerfile。
3. **任何容器/镜像变更必须先向用户说明原因与具体变更内容，经用户明确同意后方可执行**；未获许可的改动视为违规。
4. 只读检查（`docker ps` / `docker inspect` / `docker logs` / `docker compose ... ps` / `docker images`）不属于变更，可直接执行。
