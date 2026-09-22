# 010: 日志中心 - 系统日志（后端异常统一持久化）

- 日期：2026-09-21
- 背景：
  - 异常过滤器此前只把错误打到进程日志（stdout），4xx 静默、无落库，排查线上问题缺可检索记录。
  - admin-web「日志中心」只有「操作日志」（audit_log，写操作），没有系统错误日志页面。
- 决策：
  1. 新增 `system_log` 表（`service / level / message / stack / requestId / method / url / status / code / userId` + 标准 id/时间戳/软删除）。
  2. `ApiExceptionFilter` 改为 `APP_FILTER` 注入（不再 `new`），通过 `SYSTEM_LOG_RECORDER` 端口把异常异步落库（api-service 与 cron-service 各自实现写入，带 `service` 区分来源）；持久化失败不影响响应。
  3. 新增 `system-log` 模块（domain/infra/application/presentation/module），提供 `GET /api/system-logs` 分页查询（按 level/service/keyword 过滤），统一返回格式与 Swagger 注解。
  4. admin-web「日志中心」新增「系统日志」页（`/system-logs`），展示级别/服务/方法/URL/状态码/错误码/用户/错误信息，支持展开查看堆栈。
- 后果：
  - 后端所有 4xx/5xx 异常都会落到 `system_log` 并可在管理台检索；与 `audit_log`（写操作）互补。
  - 异常过滤器依赖 `SYSTEM_LOG_RECORDER`（`@Optional` 注入），未提供时仅打日志、不影响运行。
  - 需注意高频 4xx 会增加 `system_log` 写入量，后续可按级别/采样治理。
- 关联：`packages/database/prisma/schema.prisma`（SystemLog）、`apps/api-service/src/common/response/api-exception.filter.ts`、`apps/api-service/src/modules/system-log/`、`apps/cron-service/src/common/observability/`、`apps/admin-web/src/pages/SystemLogsPage.tsx`。
