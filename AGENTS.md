# AGENTS.md — Owl Monorepo 开发规范

Owl 是跨境电商内网管理系统 monorepo。本文件约束所有代码变更，Agent 在改动任何文件前必须先读本文件。

## 一、适用与校验命令（提交前必须全绿）

```bash
pnpm typecheck        # 全仓 TS 类型检查
pnpm lint             # ESLint（须经 pnpm 调用；脚本依赖 pnpm 注入 node_modules/.bin 到 PATH）
pnpm format:check     # Prettier 格式校验
pnpm arch:check       # 架构依赖方向 + 跨模块导入 + 文件行数（>1000 WARN / >1500 ERROR，均阻断）
pnpm doc:check        # 文档新鲜度（PROJECT_STATE.md 是否落后于源码）
pnpm business:check   # 业务快照新鲜度（implementation-plan/decisions 有更新未同步快照 → ERROR）
pnpm feature:check    # 业务特征规则（success 不在 vo 判断、filter 不返回 entity、id 生成放 domain）
pnpm frontend:check   # 前端 UI 规则（详见第十二节）
pnpm backend:check    # 后端规范（详见第十三节）
pnpm test             # 单元测试
pnpm state:update     # 重新生成 PROJECT_STATE.md 自动段（改代码后必须跑）
pnpm business:update  # 更新 business-snapshot.md 最近更新记录（改业务需求/计划后必须跑，可带摘要）
pnpm verify:quick     # = typecheck → lint → format:check → arch:check → doc:check → business:check
                      #   → scan-ai-residue → feature:check → frontend:check → backend:check → test
pnpm verify:full      # = verify:quick + smoke
```

阶段验收/提交前：`pnpm verify:quick` 必须通过，任何一步失败即为阻断。`verify:quick` 是唯一权威入口——
不要只跑单个子命令就认为通过（历史上就出现过「单测失败但所有子检查全绿」的漏网）。

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

以上规则由检查脚本兜底：`scan-ai-residue.sh`（`any` / 魔法数字 / 空 catch / console.log / emoji / 无意义命名 / 重复代码块 / DTO 校验）、`check-frontend-rules.sh`（UI 库跨端导入与前端 UI 规则）、`check-backend-rules.sh`（后端规范）、`check-architecture.sh`（文件行数上限）。
**ERROR 与 WARN 均阻断提交/推送/发版/CD**（`--staged` 用于 pre-commit 增量扫描）。

## 三、架构（严格分层，单向依赖）

```
packages/shared        → 类型 + 常量 + 错误码（DM 层，被一切依赖）
packages/permission    → 权限点与按钮级 RBAC 定义（被 app 依赖）
packages/database      → Prisma schema + migrations + seeds（依赖 shared）
apps/api-service/      → NestJS 主服务（业务模块按 DDD 四层组织，见下）
apps/cron-service/     → 定时任务执行服务（NestJS + RabbitMQ）
apps/admin-web/        → 管理台 Web（Vite + React + TS）
apps/cron-web/         → 定时任务控制台（Vite + React + TS）
apps/owl-web/          → 内部业务工作台（Vite + React + TS）
apps/mobile-web/       → 移动端 H5（Vite + React + TS）
apps/portal/           → 对外门户（Vite + React + TS）
```

**DDD 分层是「模块级」而不是「app 顶层」**（`apps/*/src/presentation` 这类顶层分层目录是历史遗留，已废弃）：

```
apps/api-service/src/modules/<feature>/
  <feature>.module.ts  → Module：依赖装配（唯一入口）
  presentation/        → controller / dto / vo（只做参数接收与响应编排）
  application/         → *.service.ts：业务编排 / 事务边界（依赖 domain 端口）
  domain/              → 纯业务模型 / 端口接口（零基础设施依赖）
  infrastructure/      → Prisma / 外部 SDK / redis 等实现（实现 domain 端口）
apps/cron-service/src/modules/<feature>/   同上
```

依赖方向规则：

- `presentation → application → domain ← infrastructure`（内聚圆）。同级、上层依赖下层；**禁止任何向下反向依赖**。
- 各 app 之间**禁止互相依赖**；共享代码一律下沉到 `packages/*`。
- `entrypoints（main.ts）→ app.module → 内部模块`；entrypoints 之间互不依赖。
- `packages/shared`、`packages/permission`、`packages/database` 为所有包可依赖的底层公共包；禁止依赖任何 app。
- 校验由 `scripts/check-architecture.sh` 执行，模式支持 `import "owner"`、`index`、`src` 三种，默认递归 owner。任何跨层依赖立即报 ERROR。

## 四、根目录脚本（scripts/*）

| 脚本                        | 作用                                                                                        |
| --------------------------- | ------------------------------------------------------------------------------------------- |
| check-typecheck.sh          | 逐包 tsc --noEmit，聚合退出码                                                               |
| check-lint.sh               | 逐包 eslint（须经 `pnpm lint` 调用，脚本依赖 pnpm 注入 PATH）                               |
| check-architecture.sh       | 架构护栏 14 项（依赖方向 / 跨模块导入 / 文件行数；ERROR 与 WARN 均阻断）                    |
| scan-ai-residue.sh          | AI 残渣扫描 10 类（`--staged` 用于 pre-commit 增量扫描；ERROR / WARN 均阻断）               |
| check-feature-rules.sh      | 业务特征规则检查（success 不在 vo 判断、filter 不返回 entity、id 生成放 domain 等）         |
| check-frontend-rules.sh     | 前端 UI 规则检查（详见第十二节，`pnpm frontend:check`）                                     |
| check-backend-rules.sh      | 后端规范检查（自增 id / 软删除 / 按 id 路由 / Swagger，详见第十三节，`pnpm backend:check`） |
| smoke.sh                    | 冒烟验收（构建后启动心跳检查）                                                              |
| release.sh                  | 版本发布（verify:quick → version bump → commit，失败自动回滚）                              |
| verify.sh                   | 完整验证流水线聚合（typecheck → lint → format → arch → doc → 残渣 → test）                  |
| update-state.sh             | 重新生成 `docs/PROJECT_STATE.md` 自动段（扫描源码，脚本管事实 / 人管"为什么"）              |
| check-doc-freshness.sh      | 代码改动但状态文档未同步 → ERROR（`--staged` 用于 pre-commit 增量检查；版本 bump 豁免）     |
| update-business-snapshot.sh | 更新 `docs/business-snapshot.md`「最近更新」段并格式化（业务需求/计划变化后运行）           |
| check-business-freshness.sh | 计划/决策文档改动但业务快照未同步 → ERROR（`--staged` 用于 pre-commit 增量检查）            |

新增扫描/校验脚本：必须加入 `package.json` 对应脚本、`verify:quick`、pre-commit/pre-push 与 CI 工作流，保持入口一致。

跨脚本复用的检查实现放 `scripts/lib/`（如 `find-emoji.mjs`、`check-soft-delete-filter.mjs`），只被上述脚本调用，
不单独作为门禁入口。**同一规则只允许一处实现**：已有的重复实现（1500 行、emoji、UI 库跨端、`any`）
已各收敛到唯一条目，新增检查前先确认没有同类规则。

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
- 新增业务逻辑（application 层 Service）必须附单测，覆盖成功路径与失败路径。
- `pnpm test` 已纳入 `pnpm verify:quick`（pre-push 与 CI 执行）；改完代码只跑子检查不算通过。
- 冒烟：`pnpm smoke` 构建后跑心跳；数据库相关冒烟依赖 docker-compose 起的 Postgres。

## 七、变更流程规范

1. 修改前读本文件与目标文件上下文，遵守现有模式。
2. 提交前：`pnpm verify:quick` 全绿。
3. **husky pre-commit**（任一失败即阻断，完整步骤见 `.husky/pre-commit`）：
   检测源码改动 → `update-state.sh` 重生成并暂存 `PROJECT_STATE.md` → `prettier --check` 暂存文件 →
   `check-staged-typecheck.sh` → `scan-ai-residue.sh --staged` → `check-doc-freshness.sh --staged` →
   `check-business-freshness.sh --staged`（计划/决策改动需同 commit 同步 `business-snapshot.md`）→
   `check-staged-feature-rules.sh` → `check-frontend-rules.sh` → `check-backend-rules.sh`。
   pre-commit **不跑** lint / test，二者由 **pre-push** 的 `pnpm verify:quick` 全量执行。
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

## 九、生产环境 Secret 管理（SOPS + age）

**生产环境 Secrets 以 SOPS（age 加密）形式入库，禁止提交明文，严禁通过 CD 流水线或代码配置明文。**

> 2026-09-16 起弃用 Rancher（其管理面板已从 k3s 卸载，见第十一节）；改为 SOPS + age 的 git-ops 方案，监控改用 k9s / Lens（零集群内组件）。

### 架构

```
仓库内 k8s/base/*-secret.enc.yaml（SOPS 密文，可入库）
  ↓ sops -d（用本机 age 私钥解密）
kubectl apply -f -（写入 owl namespace Secrets）
  ↓ 注入
Pod 环境变量 (envFrom secretRef)
```

### Secret 清单

| Secret 名称           | 明文（不入库）                      | 密文（入库）                            | 用途                 | 数据项                                                                                           |
| --------------------- | ----------------------------------- | --------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------ |
| `api-service-secret`  | `k8s/base/api-service-secret.yaml`  | `k8s/base/api-service-secret.enc.yaml`  | API 服务敏感配置     | DATABASE_URL, FEISHU_APP_SECRET, JWT_SECRET, MINIO_SECRET_KEY, POSTGRES_PASSWORD, REDIS_PASSWORD |
| `cron-service-secret` | `k8s/base/cron-service-secret.yaml` | `k8s/base/cron-service-secret.enc.yaml` | 定时任务服务敏感配置 | DATABASE_URL, FEISHU_BUSINESS_APP_SECRET, POSTGRES_PASSWORD, REDIS_PASSWORD                      |

### 密钥与工具

- **age 私钥（严禁入库）**：`~/.config/sops/age/keys.txt`（权限 600）；公钥写在仓库根 `.sops.yaml` 的 `creation_rules`。
- **SOPS 配置**：仓库根 `.sops.yaml`，仅加密 `data` / `stringData` 字段。
- **工具安装**：`sops` / `age` / `k9s` 装在 `~/.local/bin`（`PATH` 已含）。
- 环境变量：`export SOPS_AGE_KEY_FILE=$HOME/.config/sops/age/keys.txt`（未设置时 sops 默认也读该路径）。

### 硬性规则

1. **禁止在 CD 流水线（cd.yml）中创建或管理 Secrets**：CD 只负责构建和部署应用，不涉及 Secret 配置。
2. **禁止在代码中硬编码任何敏感值**：所有敏感配置通过 K8s Secret 注入环境变量。
3. **禁止提交明文 Secret**：`k8s/base/*-secret.yaml` 已在 `.gitignore` 中忽略；只提交 `*.enc.yaml` 密文。age 私钥**永不入库**。
4. **新增 Secret 必须更新本文档**：添加新 Secret 时同步更新上方清单表。
5. **凭证轮换**：任何曾以明文进入 git 历史的凭证必须轮换（旧值视为已泄露）。

### 操作流程（修改 Secret）

```bash
export SOPS_AGE_KEY_FILE=$HOME/.config/sops/age/keys.txt
# 1. 编辑密文（sops 自动解密到编辑器，保存后自动重新加密）
sops k8s/base/api-service-secret.enc.yaml
# 2. 应用到集群
sops -d k8s/base/api-service-secret.enc.yaml | kubectl apply -f -
# 3. 重启对应 Deployment 使新值生效
kubectl rollout restart deployment/api-service -n owl
```

### 集群监控（替代 Rancher 面板）

```bash
k9s                     # TUI，默认读取 ~/.kube/config 的 owl-k3s context
kubectl -n owl get pods # 或直接用 kubectl
```

- kubeconfig：`~/.kube/config` 中的 `owl-k3s` context（cluster `owl-k3s-cluster`，namespace `owl`）。

## 十、CI/CD 工作流保护规则

`.github/workflows/cd.yml` 是本项目**唯一的 CD 工作流文件**，承担构建、部署、通知、清理等全部持续部署职责。

**AI Agent 硬性约束：**

1. **禁止私自改动 `cd.yml`**：任何对该文件的修改必须先向用户说明改动原因、具体变更内容，经用户明确同意后方可执行。未经许可的改动视为违规。
2. **禁止创建新的 `.github/workflows/*.yml` 文件**：CD 流水线统一由 `cd.yml` 管理，不允许新建其他 workflow 文件。如需新增 CI 流水线（如 PR 检查），须与用户确认后再操作。
3. **禁止删除或禁用 `cd.yml` 中的清理步骤**：Docker 镜像清理、缓存清理等步骤是磁盘空间保障机制，不得移除或跳过。
4. **修改 `cd.yml` 时必须保持 job 依赖关系正确**：改动 `needs` / `if` 条件前需确认不会破坏流水线拓扑（如并行变串行、遗漏必要依赖等）。

违反以上规则的提交将被阻断。

## 十一、本机容器与镜像清单（SSOT + 保护规则）

**本节固化本项目当前依赖的本机 Docker 容器/镜像——k3s、system 中间件组、actions-runner，是容器与镜像事实的唯一权威来源。** 各容器运行/重建命令等细节以 **仓库外** 的 `~/Desktop/system/dockerData/README.md` 为准（dockerData 不属于 owl 仓库）；仓库内相关编排：`.github/actions-runner/`（CD runner）、根目录 `docker-compose.yml`（owl 应用容器）。

> 以下容器重启策略均为 `unless-stopped`。`k3s-net`（172.23.0.0/24，网关 172.23.0.1）承载 k3s / system 中间件，所有成员固定 IP，**Docker 重启后 IP 不变**，k3s pods 据此访问中间件。

### 1. k3s（单节点 K8s 集群）

| 项       | 值                                                                                                                    |
| -------- | --------------------------------------------------------------------------------------------------------------------- |
| 容器     | `k3s`（`--privileged`，`docker run` 直启，非 compose）                                                                |
| 镜像     | `rancher/k3s:latest`                                                                                                  |
| 网络     | `k3s-net` 固定 IP `172.23.0.2`；node IP 必须固定，变更会导致集群无法启动                                              |
| 宿主端口 | `6443`（API Server）、`9262`（NodePort 统一入口）、`9263`、`8443`（→ 容器 443，Traefik websecure，现无 Ingress 使用） |
| 数据     | containerd 运行时走命名卷（宿主机 APFS bind 跑不动）；`server/db` bind 到 `dockerData/k3s/server/db`                  |
| 说明     | 集群名 `k3s-owl-prod`，单节点；重建必须带 `--node-ip 172.23.0.2 --disable-network-policy` 等固定参数                  |

> **2026-09-16 起 Rancher 已从 k3s 集群卸载**（原 Helm chart v2.15.1 部署于 `cattle-system`，含 fleet/cert-manager/turtles 等依赖，常驻约 1.2 GiB 内存）。集群管理改用 `kubectl` / `k9s`，生产 Secret 改用 SOPS + age（见第九节）。卸载原因：单节点内网系统无需 Rancher 全套控制面，且其内存占用是 Mac Docker VM 的主要负担。

### 2. system 中间件组（compose project `system`）

- 编排：`~/Desktop/system/dockerData/docker-compose.middleware.yml`（仓库外）
- **必须以 `-p system` 启动**：直接 `-f dockerData/...` 会把 project 名推断为 `dockerdata`，生成脱离分组的独立容器（minio 曾因此脱组）
- 全部在 `k3s-net` 固定 IP，k3s pods 经 `k3s-net` 访问

| 容器       | 镜像                       | 固定 IP     | 宿主端口    | 数据 bind（→ 容器内）                                       |
| ---------- | -------------------------- | ----------- | ----------- | ----------------------------------------------------------- |
| postgresql | bitnami/postgresql:latest  | 172.23.0.10 | 5432        | `dockerData/postgresql`（/bitnami/postgresql）              |
| redis      | redis:latest               | 172.23.0.11 | 6379        | `dockerData/redis`（/data）                                 |
| rabbitmq   | rabbitmq:latest            | 172.23.0.12 | 5672、15672 | `dockerData/rabbitmq`（/var/lib/rabbitmq）                  |
| minio      | bitnamilegacy/minio:latest | 172.23.0.13 | 9000、9001  | `dockerData/minio`（/bitnami/minio/data，镜像原生 datadir） |

### 3. actions-runner CD 组（compose project `actions-runner`）

- 编排：`.github/actions-runner/docker-compose.yml`（仓库内）；管理脚本 `manage.sh`
- 容器 `github-runner`；镜像 `owl/github-runner:latest`（`.github/actions-runner/Dockerfile` 构建）
- 网络 `actions-runner_default`（172.22.0.2），无宿主端口
- 挂载 `/var/run/docker.sock`（CD 中可构建镜像）；命名卷 `runner-work` / `runner-config`；环境变量经 `.env`（不入库）

> 根目录 `docker-compose.yml` 编排 owl 应用容器（project `owl`），是仓库自有应用的正常开发对象，不在下面保护范围内；改其镜像引用/编排按常规流程走。

### 硬性规则（AI 约束）

1. **禁止未经用户明确同意修改上述容器组的方式**：不得创建/删除/停止/重启/重建这些容器，不得改动其启动参数、端口映射、网络、卷、环境变量或编排文件（含仓库外 `dockerData/docker-compose.middleware.yml` 与仓库内 `.github/actions-runner/`）。
2. **禁止未经用户明确同意修改镜像**：不得对上述镜像执行 `docker pull` / `docker tag` / `docker rmi` / `docker build`，不得改动编排文件中的镜像引用或相关 Dockerfile。
3. **任何容器/镜像变更必须先向用户说明原因与具体变更内容，经用户明确同意后方可执行**；未获许可的改动视为违规。
4. 只读检查（`docker ps` / `docker inspect` / `docker logs` / `docker compose ... ps` / `docker images`）不属于变更，可直接执行。

## 十二、前端 UI 规范

AI Agent 在编写前端布局代码前，必须先读 `docs/frontend-rules.md`，写完后运行 `pnpm frontend:check` 验证。
新增列表页直接以样板为模板：web 端 `apps/admin-web/src/pages/SampleListPage.tsx`、
mobile 端 `apps/mobile-web/src/pages/SampleListPage.tsx`（四段式 + 骨架屏 + 固定操作列；移动端为卡片列表 + 加载更多）。

**检查命令**：

```bash
pnpm frontend:check  # 前端 UI 规则检查
```

**阻断规则（存在即阻断提交）**：

- 页面组件命名错误、UI 库跨端导入、操作反馈组件用错、图片上传未走公共组件
- 样式方案违规：CSS Modules / styled-components / emotion / 业务自建 `.css`（各端只留唯一 Tailwind 入口 `src/index.css`）
- 设计 token 分叉：各端 `tailwind.config.cjs` 必须 `presets` 引用 `tailwind/web.cjs` 或 `tailwind/mobile.cjs`，不得自带 `theme` / `plugins`
- 内联 style（Arco 组件必要属性除外）、硬编码颜色值（引号内 HEX）
- emoji / 颜文字、`any` 泄漏、单文件 >1000 行（WARN 级同样阻断）/ >1500 行

**设计 token 单一来源**：风格基线在仓库根 `tailwind/`（web 端四个应用共用 `web.cjs`、移动端用 `mobile.cjs`），
改风格只改预设，各端同时生效。各端不得自行声明 `theme` / `plugins`。

**样板页预览**：两端样板页可用 mock 数据在浏览器查看（不依赖后端）——
按 `docs/frontend-rules.md` 第五节的命令构建后，打开仓库根 `index.html`（两端并排）。

> emoji、`any`、文件行数不属 `frontend:check`：分别由 `scan-ai-residue.sh` 与 `arch:check` 统一校验
> （同一规则只保留一处实现）。骨架屏规则（第 6 条）的自动检测当前**漏报**，需人工确认；
> 完整清单含「人工评审项」与「存量偏离清单」，见 `docs/frontend-rules.md` 第八节。

## 十三、后端规范

AI Agent 在编写后端代码前，必须先读 `docs/backend-rules.md`，写完后运行 `pnpm backend:check` 验证。

**检查命令**：

```bash
pnpm backend:check  # 后端规范检查
```

**硬性规则（以下问题均为 ERROR，存在即阻断提交）**：

- REST 动词与方法严格对应：`GET` 查、`POST` 新建、`PUT` 编辑、`DELETE` 删除。
- 严格 NestJS 三层：功能模块必须有 `<feature>.module.ts` + `*.controller.ts` + `*.service.ts`（Service 类名统一 `XxxService`，禁止 `*.use-case.ts`）；Controller 只做 HTTP 边界，禁止直连 Prisma（`DATABASE_CLIENT`）、禁止手动 `new XxxService()`，依赖经 Module 注入。
- 所有数据表必须有 `id Int @id @default(autoincrement())`，禁止 uuid / name / code / key 等非自增 id 作为主键。
- 所有数据表必须有 `createdAt` / `updatedAt` 两个时间字段（`@default(now())` + `@updatedAt`），且精确到秒（`@db.Timestamp(0)`）。
- 详情、编辑、删除必须按本表自增 `id` 定位，路径参数用 `ParseIntPipe` 转 `number`。
- 所有删除均为软删除：数据表必须有 `deletedAt DateTime? @db.Timestamp(0) @map("deleted_at")`，禁止 `prisma.*.delete()` / `deleteMany()` 硬删除，读查询默认过滤 `deletedAt: null`。
- 统一返回格式：所有接口经 `ok()` / `page()`；成功 `{ code: 200, data, message: "success" }`，分页 `data: { list, pageNum, pageSize, total }`，失败 `data: null` + 错误 `message`；禁止 Controller 直接 `res.json()` / `res.send()`（需设 Cookie 的 auth 端点除外，也须 `json(ok(...))`）。
- `api-service` / `cron-service` 在非生产环境必须暴露 Swagger UI，并在启动日志打印地址（`http://localhost:<port>/<prefix>/docs`）；每个 Controller 必须 `@ApiTags("中文模块名")`、每个路由 `@ApiOperation`、入参 DTO `@ApiProperty`、返回值 `@ApiOkResponse` / `@ApiCreatedResponse`（VO 字段带中文 `@ApiProperty`）；Swagger 必须配置 JWT Bearer（`addBearerAuth`），`JwtAuthGuard` 需同时接受 `Authorization: Bearer` 与 cookie。
- 列表与统计读查询（`findMany` / `findFirst` / `count` / `aggregate` / `groupBy`）必须过滤 `deletedAt: null`；`findUnique` 不在自动检查范围内（软删除记录的恢复/重建流程必须能查到已删除行，属合法例外）。
- 单个代码文件不得超过 1500 行（另有 >1000 行阻断级预警）；该规则由 `pnpm arch:check` 全仓统一校验，不在 `backend:check` 重复实现。

> 完整清单含「人工评审项」见 `docs/backend-rules.md` 第九节。**schema 时间字段属性顺序不可调换**：
> 必须写成 `createdAt DateTime @db.Timestamp(0) @default(now())`；写成 `@default(now()) @db.Timestamp(0)`
> 会被字面模式匹配判为「缺少 createdAt」而阻断提交。
