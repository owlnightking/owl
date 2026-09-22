# 后端规范

> AI Agent 在编写后端代码前必须先读本文件，写完后运行 `pnpm backend:check` 验证。

## 一、RESTful 接口约定

| 操作 | HTTP 方法 | 路由                  | 说明               |
| ---- | --------- | --------------------- | ------------------ |
| 列表 | `GET`     | `/api/<resource>`     | 分页 / 筛选        |
| 详情 | `GET`     | `/api/<resource>/:id` | 按自增 id 查询单条 |
| 新建 | `POST`    | `/api/<resource>`     | 创建新记录         |
| 编辑 | `PUT`     | `/api/<resource>/:id` | 按自增 id 全量编辑 |
| 删除 | `DELETE`  | `/api/<resource>/:id` | 按自增 id 软删除   |

**硬性规则**：

1. 动词与方法严格对应：`GET` 只读、`POST` 只新建、`PUT` 只编辑、`DELETE` 只删除。
2. 禁止用 `POST` 做编辑/删除，禁止用 `GET` 改数据，禁止用 `PUT`/`DELETE` 新建。
3. 详情、编辑、删除的路由参数必须是**数据表自增主键 id**，禁止用 `name` / `code` / `key` / `uuid` / 飞书 id 等非自增 id 定位。
4. 路径参数用 `ParseIntPipe` 转成 `number`，禁止把 id 当字符串透传。
5. id 不存在时返回 `HttpStatus.NOT_FOUND`，禁止静默成功。

```ts
@Get(":id")
async findById(@Param("id", ParseIntPipe) id: number) {
  const item = await this.service.findById(id);
  if (!item) throw new NotFoundException("记录不存在");
  return ok(item);
}
```

## 二、主键、时间戳与自增 id

**所有数据表必须有 `id` 字段，且为自增整数主键；同时必须有创建时间 `createdAt` 与更新时间 `updatedAt`，精确到秒（年月日时分秒）。**

```prisma
model Example {
  id        Int       @id @default(autoincrement())
  createdAt DateTime  @db.Timestamp(0) @default(now()) @map("created_at")
  updatedAt DateTime  @db.Timestamp(0) @default(now()) @updatedAt @map("updated_at")
  deletedAt DateTime? @db.Timestamp(0) @map("deleted_at")
  @@map("example")
}
```

> **属性顺序不可调换**：`check-backend-rules.sh` 按字面模式匹配字段声明，`@db.Timestamp(0)` 必须写在
> `@default(now())` **之前**（`updatedAt` 的 `@updatedAt` 在最后）。写成
> `createdAt DateTime @default(now()) @db.Timestamp(0)` 会被判为「缺少 createdAt」而阻断提交。
> 仓库内 `packages/database/prisma/schema.prisma` 是可直接复制的正例。

- 时间统一到秒：所有 `DateTime` 字段必须带 `@db.Timestamp(0)`，禁止毫秒精度。
- `createdAt` 只在创建时写入，禁止修改；`updatedAt` 由 `@updatedAt` 在每次写入时自动维护。
- 关联外键必须是 `Int`，与被引用表 `id` 类型一致。
- 关联表（如 `role_permission` / `user_role`）同样必须有自增 `id` 主键与两个时间字段，业务唯一性用 `@@unique` 表达。
- 禁止 `String @id @default(uuid())` 主键。
- 需要对外稳定标识（`unionId` / `code` / `key`）时，作为带 `@unique` 的普通字段存在，**不得作为详情/编辑/删除的定位键**。

## 三、软删除（所有删除均为软删除）

- 所有数据表必须有 `deletedAt DateTime? @db.Timestamp(0) @map("deleted_at")`。
- 删除 = 更新 `deletedAt` 为当前时间，**禁止 `prisma.<model>.delete()` / `deleteMany()` 硬删除**。
- 所有读查询默认过滤 `deletedAt: null`，软删除记录不得出现在列表、详情、统计中。
- 关联清理（如 `user_role`）同样是软删除；软删除后如需恢复，用同一业务键 upsert 并将 `deletedAt` 置空。
- 注意：软删除记录仍占用唯一约束，重建同名记录前需处理冲突。
- 列表与统计查询的过滤由 `scripts/check-backend-rules.sh` 第 10 条自动校验；`const where = { deletedAt: null }`
  再 `findMany({ where })` 的常见写法会被正确解析，不会误报。`findUnique` 不在此检查范围内（见 9.3）。

```ts
// 列表 / 统计：where 必须带 deletedAt: null
const where = { uploadedBy: userId, deletedAt: null };
const [rows, total] = await Promise.all([
  this.prisma.file.findMany({ where, skip, take }),
  this.prisma.file.count({ where }),
]);

async delete(id: number) {
  await this.prisma.example.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
```

## 四、NestJS 三层结构（controller / module / service）

每个功能模块**必须**严格按 NestJS 三层组织，缺失任一层即违规：

```
modules/<feature>/
  <feature>.module.ts          # Module：依赖装配（唯一入口）
  presentation/<x>.controller.ts  # Controller：HTTP 边界
  application/<x>.service.ts      # Service：业务逻辑
  domain/                         # 端口接口与纯模型（Service 依赖的抽象）
  infrastructure/                 # 端口实现（Prisma / 外部 SDK）
```

| 层             | 命名                                | 职责                                                           | 禁止                                                                   |
| -------------- | ----------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **Module**     | `<feature>.module.ts`               | 注册 `controllers` / `providers` / `exports`，完成依赖注入装配 | 写业务逻辑、直接 new 实例                                              |
| **Controller** | `<x>.controller.ts`                 | 路由、DTO 校验、鉴权装饰器、调用 service、包装响应             | 写业务判断、直接查库（`@Inject(DATABASE_CLIENT)`）、`new XxxService()` |
| **Service**    | `<x>.service.ts`，类名 `<X>Service` | 业务编排、事务边界、领域规则校验                               | 直接操作 HTTP（Request/Response）、承担路由职责                        |

**硬性规则**：

1. 功能模块必须存在 `<feature>.module.ts`；含 Controller 的模块必须存在至少一个 `*.service.ts`。
2. Controller 必须通过构造函数注入 Service（`@Inject(TOKEN)` 或直接类型注入），**禁止手动 `new XxxService()`**。
3. Controller **禁止直接注入 `DATABASE_CLIENT` / 使用 Prisma**，所有数据访问下沉到 Service → Repository。
4. Prisma 查询只允许出现在 `infrastructure/*.repository.ts`；Service 通过 domain 端口接口依赖它。
5. Service 类名统一 `XxxService`，文件统一 `*.service.ts`（禁止 `*.use-case.ts` / `XxxUseCase`）。
6. Controller 依赖 Service 抽象（domain 端口接口），不得依赖 Repository 实现类。
7. 单个代码文件不得超过 **1500 行**，超限必须拆分（Controller 拆子资源、Service 拆职责、工具/类型下沉）。

```ts
// module
@Module({
  controllers: [RoleController],
  providers: [
    { provide: ROLE_REPOSITORY, useClass: PrismaRoleRepository },
    { provide: ROLE_SERVICE, useClass: RoleService },
  ],
})
export class RoleModule {}

// controller —— 只做 HTTP 边界
@Controller("roles")
export class RoleController {
  constructor(@Inject(ROLE_SERVICE) private readonly service: RoleServicePort) {}
}

// service —— 业务逻辑
@Injectable()
export class RoleService implements RoleServicePort {
  constructor(@Inject(ROLE_REPOSITORY) private readonly repo: RoleRepositoryPort) {}
}
```

## 五、分层与依赖方向

严格遵守 `AGENTS.md` 第三节：`presentation → application → domain ← infrastructure`。

- `presentation` 只接参与编排响应，不写业务与 SQL。
- `application` 管用例编排与事务边界。
- `domain` 定义纯模型与端口接口，零基础设施依赖。
- `infrastructure` 实现端口（Prisma 查询只出现在此层）。
- 业务 id 生成逻辑放 domain，禁止在 presentation 生成。

## 六、DTO 与入参校验

- Controller 入参必须经 DTO + `class-validator`，禁止 `@Body() body: any`。
- DTO 字段显式声明类型与校验装饰器。
- 查询参数用 `class-transformer` 的 `@Type(() => Number)` 做类型转换。
- 禁止裸魔法数字，HTTP 状态码用 `HttpStatus.*`，业务错误码用 `@owl/shared` 的 `ApiErrorCode`。

## 七、统一返回格式

**所有接口必须走统一响应封装（`ok()` / `page()`），禁止各写一套结构或直接写响应。**

成功响应（非分页）：

```json
{ "code": 200, "data": { "真正的数据": "..." }, "message": "success" }
```

分页响应：`data` 固定为 `{ list, pageNum, pageSize, total }`。

```json
{ "code": 200, "data": { "list": [], "pageNum": 1, "pageSize": 20, "total": 0 }, "message": "success" }
```

失败响应：`code` 为业务错误码，`data` 为 `null`，`message` 为错误信息。

```json
{ "code": 40400, "data": null, "message": "记录不存在" }
```

- 成功码统一 `200`（`ApiErrorCode.OK`）；错误码用 `@owl/shared` 的 `ApiErrorCode`。
- 分页统一用 `page(list, pageNum, pageSize, total)`，字段名固定 `list` / `pageNum` / `pageSize` / `total`。
- Controller 只 `return ok(...)` / `return page(...)`，禁止 `res.json()` / `res.send()` 直接写响应；需要设置 Cookie 的鉴权端点（`auth.controller.ts`）是唯一例外，但也必须 `json(ok(...))`。
- 异常统一由 `ApiExceptionFilter` 转成失败响应，并**统一记录错误日志**：5xx 用 `Logger.error`（带堆栈），4xx 用 `Logger.warn`，字段统一含 `requestId / method / url / status / code / userId`。业务代码不要各自 catch 打日志，禁止空 `catch`。
- 日志用 NestJS `Logger`，禁止 `console.log`（仅 `main.ts` 启动日志例外）。

## 八、Swagger（dev 环境）

- `api-service` / `cron-service` 在非 `production` 环境启用 Swagger。
- 启动日志必须打印 Swagger UI 地址，方便本地联调。
- `pnpm dev` 终端在启动完成后需汇总打印各后端接口调试地址。
- **JWT 鉴权**：Swagger 必须配置 Bearer 方案（`addBearerAuth` + `addSecurityRequirements("bearer")`）；`JwtAuthGuard` 必须同时支持 `Authorization: Bearer <accessToken>` 与 cookie `owl_access`。登录后在 Swagger 的 Authorize 填入 accessToken 即可调试受保护接口。
- Swagger 地址统一 `http://localhost:<port>/<prefix>/docs`：
  - api-service：`http://localhost:<API_PORT>/api/docs`（经网关亦可 `http://localhost:<GATEWAY_PORT>/api/docs`）
  - cron-service：`http://localhost:<CRON_PORT>/cron/docs`

**接口注解硬性规则**（保证 Swagger UI 可读）：

1. 每个 Controller 必须加 `@ApiTags("中文模块名")`，实现接口分模块。
2. 每个路由必须加 `@ApiOperation({ summary: "中文接口名" })`；路径参数用 `@ApiParam({ name, description, example })`。
3. 入参 DTO 字段必须加 `@ApiProperty`（必填）/ `@ApiPropertyOptional`（可选），带中文 `description` 与 `example`。
4. 返回值必须声明 `@ApiOkResponse`（GET/PUT/DELETE）/ `@ApiCreatedResponse`（POST），`type` 指向 VO 类。
5. VO 类字段必须加 `@ApiProperty`（中文字段名 `description`，可空字段 `nullable: true`）；分页 VO 继承 `common/response/page.vo.ts` 的 `PageMetaVo` 并加 `list`。
6. 由 `scripts/check-backend-rules.sh` 校验：Controller 缺 `@ApiTags`、路由数多于 `@ApiOperation` 或响应注解数、含 DTO 却无 `@ApiProperty`，均阻断。
7. JWT：api-service 的 `main.ts` 必须含 `addBearerAuth`，且 `JwtAuthGuard` 必须接受 `Authorization: Bearer`（由脚本第 12 条校验）。

```ts
if (process.env.NODE_ENV !== "production") {
  const config = new DocumentBuilder().setTitle("api-service").setVersion("1.0").build();
  SwaggerModule.setup("api/docs", app, SwaggerModule.createDocument(app, config));
  logger.log(`api-service Swagger: http://localhost:${port}/api/docs`);
}
```

## 九、检查规则

AI 写完后端代码后必须运行 `pnpm backend:check`。清单分三类：**脚本阻断项**由门禁自动校验，检出即阻断；
**跨脚本覆盖**由其他门禁负责（同一规则只有一个实现）；**人工评审项**无法用脚本可靠判定，
必须人工确认——不要因为「反正有门禁」而跳过。

### 9.1 脚本阻断项（`pnpm backend:check` 检出即阻断）

| #   | 规则                                                                                                                       | 校验实现                    |
| --- | -------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| 1   | 数据表必须有 `id Int @id @default(autoincrement())`                                                                        | `check_schema`              |
| 2   | 数据表必须有 `createdAt` / `updatedAt`（含 `@db.Timestamp(0)` 秒精度）与 `deletedAt`                                       | `check_schema`              |
| 3   | 禁止 `prisma.*.delete()` / `deleteMany()` 硬删除                                                                           | `check_hard_delete`         |
| 4   | 详情/编辑/删除路由必须用 `:id`，禁止 `:name` / `:code` / `:key` 等非自增 id                                                | `check_route_id`            |
| 5   | `@Param("id")` 必须经 `ParseIntPipe` 转 `number`                                                                           | `check_param_pipe`          |
| 6   | 非生产环境必须暴露 Swagger UI（`SwaggerModule.setup`）                                                                     | `check_swagger`             |
| 7   | 功能模块必须有 `*.module.ts`，含 Controller 必须有 `*.service.ts`                                                          | `check_nestjs_modules`      |
| 8   | Controller 禁止手动 `new XxxService()`、禁止直连 Prisma（`DATABASE_CLIENT`）                                               | `check_controller_layer`    |
| 9   | Controller 必须经 `ok()` / `page()`，禁止 `res.json()` / `res.send()`                                                      | `check_response_format`     |
| 10  | 列表与统计读查询（`findMany` / `findFirst` / `count` / `aggregate` / `groupBy`）必须过滤 `deletedAt: null`                 | `check_soft_delete_filter`  |
| 11  | Controller 有 `@ApiTags`，每个路由有 `@ApiOperation`、入参 `@ApiProperty`、返回值 `@ApiOkResponse` / `@ApiCreatedResponse` | `check_swagger_annotations` |
| 12  | Swagger 配置 JWT Bearer（`addBearerAuth`），守卫接受 `Authorization: Bearer`                                               | `check_swagger_jwt`         |
| 13  | 异常由 `ApiExceptionFilter` 统一记录日志（5xx `error` / 4xx `warn`）                                                       | `check_error_logging`       |

### 9.2 跨脚本覆盖（同属后端规范，由其他门禁校验）

| 规则                                                                  | 校验入口                                              |
| --------------------------------------------------------------------- | ----------------------------------------------------- |
| 单文件 ≤ 1500 行（另有 >1000 行阻断级预警）                           | `pnpm arch:check`（全仓统一阈值，不按前后端各写一份） |
| 空 `catch` / `console.log` 残留 / 裸魔法数字 / 无意义命名             | `scan-ai-residue.sh`（`pnpm verify:quick`）           |
| 跨模块内部路径导入、分层依赖方向（`domain` / `application` 反向依赖） | `pnpm arch:check`                                     |
| application 层业务逻辑必须附单测（成功 + 失败路径）                   | `pnpm test`（已纳入 `pnpm verify:quick`）             |

### 9.3 人工评审项（脚本无法可靠校验，提交前人工确认）

- id 不存在时必须返回 `HttpStatus.NOT_FOUND`，禁止静默成功。
- Prisma 查询只允许出现在 `infrastructure/*.repository.ts`；Service 通过 domain 端口接口依赖它。
- Controller 依赖 Service 抽象（domain 端口接口），不得依赖 Repository 实现类。
- 查询参数用 `class-transformer` 的 `@Type(() => Number)` 做类型转换。
- `findUnique` 类查询：软删除记录不得出现在详情/编辑/删除结果中。注意恢复或重建的 upsert 流程
  属合法例外（必须能查到已删除行，见 `prisma-user.repository.ts` 的 `unionId` 用法），这也是脚本
  不检查 `findUnique` 的原因。
- Swagger 可读性：路径参数补 `@ApiParam({ name, description, example })`；VO 字段补 `@ApiProperty`
  （可空字段 `nullable: true`）；分页 VO 继承 `common/response/page.vo.ts` 的 `PageMetaVo` 并加 `list`。

运行检查：`pnpm backend:check`
