# 009: 后端统一返回格式（code 200 / data / message，分页 list 形态）

- 日期：2026-09-20
- 背景：
  - 原成功响应 `code: 0`，前端各端以 `code !== 0` 判断失败；与常见 HTTP 语义（200 = 成功）不一致。
  - 分页返回字段不统一：有 `{ items, total }`、`{ items, total, page, pageSize }` 等多种形态，前端逐个适配。
  - 个别接口未走统一封装（cron-service `health.controller` 直接返回对象）。
- 决策：
  1. 统一响应体：成功 `{ code: 200, data: 真正的数据, message: "success" }`；失败 `{ code: <业务错误码>, data: null, message: <错误信息> }`。
  2. 分页统一：`data: { list: [], pageNum, pageSize, total }`；`packages/shared` 的 `PageResult` 同步为 `{ list, pageNum, pageSize, total }`，`ApiErrorCode.OK = 200`。
  3. 新增 `page(list, pageNum, pageSize, total)` 封装（api-service / cron-service 各一份），Controller 分页接口一律改用 `page()`；其余用 `ok()`。
  4. `auth.controller` 因需写 httpOnly Cookie 保留 `@Res()`，但响应体仍走 `res.status(200).json(ok(...))`，是唯一例外。
  5. 前端所有 `code !== 0` 改为 `code !== 200`，分页消费由 `items/page` 改为 `list/pageNum`（admin-web / mobile-web / cron-web）。
  6. `scripts/check-backend-rules.sh` 增加校验：Controller 必须引入 `common/response/api-response`，禁止 `.json()` / `.send()`（auth 模块例外）。
- 后果：
  - 所有后端接口（含 health）响应体格式一致；cron-service health 也改为 `ok()`。
  - 前端与后端契约变更需同步发布。
- 关联：`packages/shared/src/types/api.types.ts`、`apps/*/src/common/response/api-response.ts`、`docs/backend-rules.md` 第七节、`scripts/check-backend-rules.sh`。
