import { ApiProperty } from "@nestjs/swagger";

export class SupplierVo {
  @ApiProperty({ description: "供应商 id", example: 1 })
  id!: number;

  @ApiProperty({ description: "名称", example: "东莞精密制造" })
  name!: string;

  @ApiProperty({ description: "联系方式", nullable: true })
  contact!: string | null;

  @ApiProperty({ description: "区域", nullable: true, example: "广东东莞" })
  region!: string | null;

  @ApiProperty({ description: "合作状态", example: "active" })
  coopStatus!: string;

  @ApiProperty({ description: "产能 / 工艺能力", nullable: true })
  capability!: string | null;

  @ApiProperty({ description: "备注", nullable: true })
  notes!: string | null;

  @ApiProperty({ description: "创建时间", example: "2026-10-15T10:00:00.000Z" })
  createdAt!: string;
}

export class QuoteVo {
  @ApiProperty({ description: "报价 id", example: 1 })
  id!: number;

  @ApiProperty({ description: "供应商 id", example: 1 })
  supplierId!: number;

  @ApiProperty({ description: "供应商名称", example: "东莞精密制造" })
  supplierName!: string;

  @ApiProperty({ description: "产品线 id", nullable: true })
  productLineId!: number | null;

  @ApiProperty({ description: "产品线名称", nullable: true })
  productLineName!: string | null;

  @ApiProperty({ description: "SPU id", nullable: true })
  spuId!: number | null;

  @ApiProperty({ description: "SPU 名称", nullable: true })
  spuName!: string | null;

  @ApiProperty({ description: "报价项", example: "首批量 500 台" })
  itemName!: string;

  @ApiProperty({ description: "人民币金额（录入原币）", example: 85000 })
  amountCny!: number;

  @ApiProperty({ description: "折算汇率快照（CNY→USD）", example: 0.14 })
  exchangeRate!: number;

  @ApiProperty({ description: "折算美元金额（主展示）", example: 11900 })
  amountUsd!: number;

  @ApiProperty({ description: "报价时间", example: "2026-10-15T10:00:00.000Z" })
  quotedAt!: string;

  @ApiProperty({ description: "备注", nullable: true })
  notes!: string | null;

  @ApiProperty({ description: "创建时间", example: "2026-10-15T10:00:00.000Z" })
  createdAt!: string;
}

export class ProductionVo {
  @ApiProperty({ description: "生产批次 id", example: 1 })
  id!: number;

  @ApiProperty({ description: "SPU id", example: 1 })
  spuId!: number;

  @ApiProperty({ description: "SPU 名称", example: "桌面收纳盒 标准版" })
  spuName!: string;

  @ApiProperty({ description: "供应商 id", example: 1 })
  supplierId!: number;

  @ApiProperty({ description: "供应商名称", example: "东莞精密制造" })
  supplierName!: string;

  @ApiProperty({ description: "类型：pilot / ramp / mass", example: "pilot" })
  type!: string;

  @ApiProperty({ description: "数量", example: 100 })
  quantity!: number;

  @ApiProperty({ description: "状态", example: "producing" })
  status!: string;

  @ApiProperty({ description: "计划时间", nullable: true })
  plannedAt!: string | null;

  @ApiProperty({ description: "完成时间", nullable: true })
  completedAt!: string | null;

  @ApiProperty({ description: "备注", nullable: true })
  notes!: string | null;

  @ApiProperty({ description: "创建时间", example: "2026-10-15T10:00:00.000Z" })
  createdAt!: string;
}

export class ShipmentVo {
  @ApiProperty({ description: "物流单 id", example: 1 })
  id!: number;

  @ApiProperty({ description: "产品线 id", example: 1 })
  productLineId!: number;

  @ApiProperty({ description: "产品线名称", example: "硬核桌面收纳系列" })
  productLineName!: string;

  @ApiProperty({ description: "SPU id", nullable: true })
  spuId!: number | null;

  @ApiProperty({ description: "SPU 名称", nullable: true })
  spuName!: string | null;

  @ApiProperty({ description: "供应商 id", nullable: true })
  supplierId!: number | null;

  @ApiProperty({ description: "供应商名称", nullable: true })
  supplierName!: string | null;

  @ApiProperty({ description: "运输方式：sea / air", example: "sea" })
  mode!: string;

  @ApiProperty({ description: "海外仓", example: "tiktok_us" })
  warehouse!: string;

  @ApiProperty({ description: "状态", example: "in_transit" })
  status!: string;

  @ApiProperty({ description: "运单 / 柜号", nullable: true })
  trackingRef!: string | null;

  @ApiProperty({ description: "成本人民币（录入原币）", nullable: true, example: 36000 })
  costCny!: number | null;

  @ApiProperty({ description: "折算汇率快照", nullable: true, example: 0.14 })
  exchangeRate!: number | null;

  @ApiProperty({ description: "成本美元（主展示）", nullable: true, example: 5040 })
  costUsd!: number | null;

  @ApiProperty({ description: "预计到达", nullable: true })
  etaDate!: string | null;

  @ApiProperty({ description: "签收时间", nullable: true })
  receivedAt!: string | null;

  @ApiProperty({ description: "备注", nullable: true })
  notes!: string | null;

  @ApiProperty({ description: "创建时间", example: "2026-10-15T10:00:00.000Z" })
  createdAt!: string;
}
