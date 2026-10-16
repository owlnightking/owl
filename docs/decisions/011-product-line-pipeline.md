# 011: 主领域产品线流水线（IPD/GTM/ISC/VOC + 汇率体系）第一版

- 日期：2026-10-15
- 背景：
  - 原 M0 规划为「13 阶段单对象线性状态机」（见 implementation-plan 第六节），粒度过粗且未落地。
  - 业务重新梳理为以「产品线」为主线对象，IPD 五期（机会判断/立项/定型/投决/经营复盘）+ 生命周期五期（立项/预售/新品/成熟/清货）双轨推进；GTM/ISC/VOC 各自挂产品线或 SPU。
  - 跨境金额以美元为准，供应链以人民币报价/头程成本录入，需汇率折算与人工校验机制。
- 决策：
  1. 核心模型：`ProductLine`（持有 ipdStage + lifecycleStage）→ `Spu`（立项期生成内部编号 SPU-YYYY-NNN，独立状态推进）→ `Sku`（美元售价、限量标记）。GTM campaign/KOL/社群反馈/预售、ISC 供应商/报价/生产/头程、VOC 工单均关联产品线或 SPU（外键 + 软删除）。
  2. 模块划分：api-service 新增 `ipd`（产品线/SPU/SKU/五期记录）、`gtm`、`isc`、`voc`、`exchange-rate` 五个 DDD 模块；owl-web 新增 workbench/ipd/gtm/isc/voc 页面；admin-web 新增汇率管理页。
  3. 汇率体系：`exchange_rate` 表（base/quote/rate/source/api|manual/verified/effectiveDate）；cron-service 新增 area `exchange-rate:sync`（每日抓取 open.er-api.com CNY→USD，失败保留旧值、同值跳过）；ISC 报价与头程成本以人民币录入，写入时按最新汇率生成快照折算美元，展示主美元副人民币；其余金额直录美元。
  4. 第一版范围（选项 A）：全链路骨架——录入 + 状态推进 + 列表查看；ROI 复盘手工填数；投决通过自动进预售期、复盘决策清货自动进清货期由 service 层负责。利润自动聚合、投流数据回传、VOC 自动流转等后置第二版。
  5. 权限沿用全员平平权（JwtAuthGuard + PermissionGuard，无细粒度权限点），后续按角色再拆。
- 后果：
  - 原 M0「13 阶段流水线」规划被本方案取代（grill-mvp-decisions.md 历史不改，仅 planning 层以本 ADR 为准）。
  - 汇率依赖外部 API 可用性；抓取失败时沿用库内旧值，人工可在管理台校验/修正。
  - 金额双币展示（主 USD 副 CNY）需前端统一走 `formatCnyWithUsd` 等工具函数。
- 关联：`packages/database/prisma/schema.prisma`（18 个新模型）、`packages/shared/src/types/pipeline.types.ts`、`apps/api-service/src/modules/{ipd,gtm,isc,voc,exchange-rate}/`、`apps/cron-service/src/modules/exchange-rate-sync/`、`apps/owl-web/src/pages/`、`apps/admin-web/src/pages/ExchangeRatesPage.tsx`。
