# 008: 后端严格 NestJS controller / module / service 三层

- 日期：2026-09-20
- 背景：
  - 业务实现类命名为 `*.use-case.ts` / `XxxUseCase`，与 NestJS 社区约定不一致，AI 生成代码时服务层命名混乱。
  - 部分 Controller 绕过依赖注入：`field-config.controller.ts` 在构造函数里 `new FieldConfigService(repo)`、`scheduler.controller.ts` 手动 `new SchedulerService(configRepo, runRepo)`。
  - 部分 Controller 直连 Prisma：`md-doc.controller.ts`、`audit-log.controller.ts`、`recognition.controller.ts` 直接 `@Inject(DATABASE_CLIENT)` 查库，业务与 HTTP 边界混杂。
- 决策：
  1. Service 层统一命名：`*.use-case.ts` → `*.service.ts`，类名 `XxxUseCase` → `XxxService`（含 cron-service 的 Scheduler / FeishuSync）。
  2. domain 端口里与实现类重名的 `AuthService` / `RoleService` / `UserService` / `FieldConfigService` 接口改为 `*ServicePort`，避免与 Service 实现类冲突。
  3. 强制依赖注入：Module 注册 `{ provide: XXX_SERVICE, useClass: XxxService }`，Controller 只 `@Inject(XXX_SERVICE)`；禁止手动 new。
  4. Prisma 访问全部下沉：Controller 不再注入 `DATABASE_CLIENT`；新增 `PrismaAuditLogRepository` + `AuditLogService`、`MdDocService.isAdmin/uploadImage`、`RecognitionService.getLevel`，数据访问经 domain 端口交给 infrastructure。
  5. `scripts/check-backend-rules.sh` 增加两层校验：功能模块必须有 `*.module.ts`，含 Controller 必须有 `*.service.ts`；Controller 禁止 `DATABASE_CLIENT` 与 `new XxxService()`。`docs/backend-rules.md` / `AGENTS.md` 第十三节同步。
- 后果：
  - 文件与类名全量重命名（约 48 文件），测试文件 `*.service.spec.ts` 同步。
  - Service 通过端口接口依赖 Repository，`domain/` 与 `infrastructure/` 仍保留，作为 Service 层的实现细节。
  - 后续新增业务必须三层齐全，否则 `pnpm backend:check` 阻断。
- 关联：`docs/backend-rules.md` 第四节、`scripts/check-backend-rules.sh`、`AGENTS.md` 第十三节。
