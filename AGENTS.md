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
pnpm verify:quick     # = 以上五项 + 残渣扫描 + 特征规则检查，CI / pre-commit / pre-push 使用
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

| 脚本                   | 作用                                                                                    |
| ---------------------- | --------------------------------------------------------------------------------------- |
| check-typecheck.sh     | 逐包 tsc --noEmit，聚合退出码                                                           |
| check-lint.sh          | 逐包 eslint，聚合退出码                                                                 |
| check-architecture.sh  | 架构依赖方向检测（ERROR=0 才通过）                                                      |
| scan-ai-residue.sh     | AI 残渣扫描（9 类规则，ERROR 阻断 / WARN 提示；`--staged` 用于 pre-commit 增量扫描）    |
| check-feature-rules.sh | 业务特征规则检查（success 不在 vo 判断、filter 不返回 entity、id 生成放 domain 等）     |
| smoke.sh               | 冒烟验收（构建后启动心跳检查）                                                          |
| release.sh             | 版本发布（verify:quick → version bump → commit，失败自动回滚）                          |
| verify.sh              | 完整验证流水线聚合（typecheck → lint → format → arch → doc → 残渣 → test）              |
| update-state.sh        | 重新生成 `docs/PROJECT_STATE.md` 自动段（扫描源码，脚本管事实 / 人管"为什么"）          |
| check-doc-freshness.sh | 代码改动但状态文档未同步 → ERROR（`--staged` 用于 pre-commit 增量检查；版本 bump 豁免） |

新增扫描/校验脚本：必须加入 `package.json` 对应脚本、`verify:quick`、pre-commit/pre-push 与 CI 工作流，保持入口一致。

## 五、数据库与本地中间件

- **中间件复用本机 Docker 容器**：PostgreSQL（`postgresql`，5432，admin/123456）、Redis（`redis`，6379，123456）、RabbitMQ（`rabbitmq`，5672，admin/123456）、MinIO（`minio`，9000，admin/minio123456）。本项目**不自起中间件**，连接配置见 `.env.example`。
- Prisma Schema 为唯一数据契约，改动后必须 `pnpm -F @owl/database prisma:generate`。
- 迁移：`pnpm -F @owl/database prisma:migrate --name <描述>`（dev）；生产改动用 `prisma:migrate deploy`。
- 模型与命名：`camelCase` 字段、snake_case 表名（`@@map`），默认加 `createAt/updateAt` 审计时间戳。
- 种子：`pnpm -F @owl/database prisma:seed`，幂等（upsert）。

## 六、测试

- 单测放 `各包/src/**/*.spec.ts`，与实现同目录。
- 新增业务逻辑（application 层 use-case）必须附单测，覆盖成功路径与失败路径。
- 冒烟：`pnpm smoke` 构建后跑心跳；数据库相关冒烟依赖 docker-compose 起的 Postgres。

## 七、变更流程规范

1. 修改前读本文件与目标文件上下文，遵守现有模式。
2. 提交前：`pnpm verify:quick` 全绿。
3. husky：pre-commit 检测源码改动 → 自动重生成并暂存 `PROJECT_STATE.md` → prettier --check 暂存文件 → AI 残渣增量扫描 → 文档新鲜度增量检查；pre-push 跑 `pnpm verify:quick`。
4. 提交信息遵循约定式提交 `feat/fix/refactor/chore/docs/test/...`。
5. **发版（version bump）提交不带版本号**：`chore: bump <app> version`（单 app）或 `chore: bump frontend versions`（多前端一次提交）。禁止 `to 0.1.29` 这类带具体版本号的后缀。`release.sh` 会在 bump commit 后自动打版本 tag（`v<app>-<version>` 单 app / `v<version>` all）仅作版本标记；**CD 监听 main push 的 `package.json` 变化，由 `detect-release` 版本门禁决定是否部署（非版本变化自动跳过）**。
6. **禁止在代码中硬编码密钥/口令**；统一走环境变量（.env*，不入库）。

## 八、文档新鲜度（Documentation Harness）

**核心原则：文档分三层，各有防漂移机制；任何代码改动必须同 commit 更新状态文档。**

1. **`docs/PROJECT_STATE.md` — 状态快照**：AI/人开工前先读这一个文件拿全局，避免重扫全仓。`### 自动 ###` 段由 `scripts/update-state.sh` 扫描源码生成（**禁止手改**），人工只维护"当前阶段 / 已知缺口 / 模块说明"三处。**pre-commit 检测到源码改动会自动重生成并暂存该文档**；人工维护段（如已知缺口）需手动编辑，随改动提交。也可随时 `pnpm state:update` 手动刷新。
2. **`docs/decisions/NNN-<slug>.md` — 决策日志（ADR-lite）**：只追加、永不修改；决策变化就新开一条更高编号记录变更。字段：日期 / 背景 / 决策 / 后果 / 关联。
3. **`AGENTS.md` / `README.md` / `docs/implementation-plan.md` — 稳定规则层**：低频更新，与状态文档解耦。

**防漂移门禁**：`scripts/check-doc-freshness.sh` 对比源码与 `PROJECT_STATE.md` 的最近提交时间，源码新 → ERROR（提示运行 `pnpm state:update`）；pre-commit 增量检查暂存区。**版本 bump（仅 package.json）豁免**。新增扫描/校验脚本时同步更新本条与 CI。
