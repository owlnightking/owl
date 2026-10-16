import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ProductLineVo {
  @ApiProperty({ description: "产品线 id", example: 1 })
  id!: number;

  @ApiProperty({ description: "产品线编号", example: "PL-2026-001" })
  code!: string;

  @ApiProperty({ description: "产品线名称", example: "硬核桌面收纳系列" })
  name!: string;

  @ApiProperty({ description: "风格描述", nullable: true })
  styleDesc!: string | null;

  @ApiProperty({ description: "IPD 阶段", example: "opportunity" })
  ipdStage!: string;

  @ApiProperty({ description: "生命周期阶段", example: "incubating" })
  lifecycleStage!: string;

  @ApiProperty({ description: "目标市场", nullable: true, example: "北美" })
  targetMarket!: string | null;

  @ApiProperty({ description: "备注", nullable: true })
  notes!: string | null;

  @ApiProperty({ description: "SPU 数量", example: 2 })
  spuCount!: number;

  @ApiProperty({ description: "创建时间", example: "2026-10-15T10:00:00.000Z" })
  createdAt!: string;

  @ApiPropertyOptional({ description: "更新时间", example: "2026-10-15T10:00:00.000Z" })
  updatedAt?: string;
}

export class ProductLinePageVo {
  @ApiProperty({ description: "列表", type: [ProductLineVo] })
  list!: ProductLineVo[];

  @ApiProperty({ description: "页码", example: 1 })
  pageNum!: number;

  @ApiProperty({ description: "每页条数", example: 20 })
  pageSize!: number;

  @ApiProperty({ description: "总数", example: 1 })
  total!: number;
}

export class SkuVo {
  @ApiProperty({ description: "SKU id", example: 1 })
  id!: number;

  @ApiProperty({ description: "所属 SPU id", example: 1 })
  spuId!: number;

  @ApiProperty({ description: "SKU 编码", example: "SKU-BLACK-L" })
  skuCode!: string;

  @ApiProperty({ description: "SKU 名称", example: "黑色 大号" })
  name!: string;

  @ApiProperty({ description: "美元售价", example: 49.99 })
  priceUsd!: number;

  @ApiProperty({ description: "是否限量款", example: false })
  limited!: boolean;

  @ApiProperty({ description: "库存", example: 100 })
  stock!: number;

  @ApiProperty({ description: "是否启用", example: true })
  enabled!: boolean;

  @ApiProperty({ description: "备注", nullable: true })
  notes!: string | null;

  @ApiProperty({ description: "创建时间", example: "2026-10-15T10:00:00.000Z" })
  createdAt!: string;
}

export class SpuVo {
  @ApiProperty({ description: "SPU id", example: 1 })
  id!: number;

  @ApiProperty({ description: "产品线 id", example: 1 })
  productLineId!: number;

  @ApiProperty({ description: "内部编号（立项期产生）", example: "SPU-2026-001" })
  internalCode!: string;

  @ApiProperty({ description: "市场 SPU 编码（预发售产生）", nullable: true, example: "A12345" })
  spuCode!: string | null;

  @ApiProperty({ description: "SPU 名称", example: "桌面收纳盒 标准版" })
  name!: string;

  @ApiProperty({ description: "状态", example: "concept" })
  status!: string;

  @ApiProperty({ description: "上市时间", nullable: true })
  launchAt!: string | null;

  @ApiProperty({ description: "备注", nullable: true })
  notes!: string | null;

  @ApiProperty({ description: "SKU 数量", example: 3 })
  skuCount!: number;

  @ApiProperty({ description: "创建时间", example: "2026-10-15T10:00:00.000Z" })
  createdAt!: string;
}

export class SpuPageVo {
  @ApiProperty({ description: "列表", type: [SpuVo] })
  list!: SpuVo[];

  @ApiProperty({ description: "页码", example: 1 })
  pageNum!: number;

  @ApiProperty({ description: "每页条数", example: 20 })
  pageSize!: number;

  @ApiProperty({ description: "总数", example: 1 })
  total!: number;
}

export class ResearchVo {
  @ApiProperty({ description: "调研 id", example: 1 })
  id!: number;

  @ApiProperty({ description: "产品线 id", example: 1 })
  productLineId!: number;

  @ApiProperty({ description: "类型：competitor / market / voc", example: "competitor" })
  type!: string;

  @ApiProperty({ description: "标题", example: "竞品 Anker 桌面系列调研" })
  title!: string;

  @ApiProperty({ description: "内容", nullable: true })
  content!: string | null;

  @ApiProperty({ description: "来源引用", nullable: true })
  sourceRef!: string | null;

  @ApiProperty({ description: "创建时间", example: "2026-10-15T10:00:00.000Z" })
  createdAt!: string;
}

export class DesignTaskVo {
  @ApiProperty({ description: "设计任务 id", example: 1 })
  id!: number;

  @ApiProperty({ description: "产品线 id", example: 1 })
  productLineId!: number;

  @ApiProperty({ description: "类型：product / appearance / mechanism / packaging", example: "appearance" })
  type!: string;

  @ApiProperty({ description: "标题", example: "外观设计三方案" })
  title!: string;

  @ApiProperty({ description: "状态", example: "in_progress" })
  status!: string;

  @ApiProperty({ description: "生产可行性", nullable: true, example: true })
  feasible!: boolean | null;

  @ApiProperty({ description: "备注", nullable: true })
  notes!: string | null;

  @ApiProperty({ description: "创建时间", example: "2026-10-15T10:00:00.000Z" })
  createdAt!: string;
}

export class PrototypeReviewVo {
  @ApiProperty({ description: "记录 id", example: 1 })
  id!: number;

  @ApiProperty({ description: "产品线 id", example: 1 })
  productLineId!: number;

  @ApiProperty({ description: "手办样完成", example: false })
  sampleReady!: boolean;

  @ApiProperty({ description: "内部评审通过", example: false })
  reviewPassed!: boolean;

  @ApiProperty({ description: "评审记录", nullable: true })
  reviewNotes!: string | null;

  @ApiProperty({ description: "已推送 GTM 共建", example: false })
  sharedWithGtm!: boolean;

  @ApiProperty({ description: "推送时间", nullable: true })
  sharedAt!: string | null;

  @ApiProperty({ description: "更新时间", example: "2026-10-15T10:00:00.000Z" })
  updatedAt!: string;
}

export class InvestDecisionVo {
  @ApiProperty({ description: "投决 id", example: 1 })
  id!: number;

  @ApiProperty({ description: "产品线 id", example: 1 })
  productLineId!: number;

  @ApiProperty({ description: "GTM 反馈摘要", nullable: true })
  gtmFeedbackSummary!: string | null;

  @ApiProperty({ description: "ISC 供应情况摘要", nullable: true })
  iscSummary!: string | null;

  @ApiProperty({ description: "目标定价（美元）", nullable: true, example: 59.99 })
  targetPriceUsd!: number | null;

  @ApiProperty({ description: "单位成本（美元）", nullable: true, example: 18.5 })
  unitCostUsd!: number | null;

  @ApiProperty({ description: "投决结果：pending / approved / rejected", example: "pending" })
  result!: string;

  @ApiProperty({ description: "决策时间", nullable: true })
  decidedAt!: string | null;

  @ApiProperty({ description: "备注", nullable: true })
  notes!: string | null;

  @ApiProperty({ description: "更新时间", example: "2026-10-15T10:00:00.000Z" })
  updatedAt!: string;
}

export class RoiReviewVo {
  @ApiProperty({ description: "复盘 id", example: 1 })
  id!: number;

  @ApiProperty({ description: "产品线 id", example: 1 })
  productLineId!: number;

  @ApiProperty({ description: "阶段：presale / listed", example: "presale" })
  phase!: string;

  @ApiProperty({ description: "销售额（美元）", example: 12000 })
  salesUsd!: number;

  @ApiProperty({ description: "广告成本（美元）", example: 3000 })
  adCostUsd!: number;

  @ApiProperty({ description: "产品成本（美元）", example: 4000 })
  productCostUsd!: number;

  @ApiProperty({ description: "履约成本（美元）", example: 1500 })
  fulfillmentCostUsd!: number;

  @ApiProperty({ description: "退款额（美元）", example: 200 })
  refundUsd!: number;

  @ApiProperty({ description: "售后成本（美元）", example: 100 })
  afterSaleCostUsd!: number;

  @ApiProperty({ description: "ROI（手工计算）", nullable: true, example: 0.65 })
  roi!: number | null;

  @ApiProperty({ description: "复盘决策", nullable: true, example: "price_reduce" })
  decision!: string | null;

  @ApiProperty({ description: "备注", nullable: true })
  notes!: string | null;

  @ApiProperty({ description: "创建时间", example: "2026-10-15T10:00:00.000Z" })
  createdAt!: string;
}
