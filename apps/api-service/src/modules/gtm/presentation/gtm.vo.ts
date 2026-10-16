import { ApiProperty } from "@nestjs/swagger";

export class CampaignVo {
  @ApiProperty({ description: "campaign id", example: 1 })
  id!: number;

  @ApiProperty({ description: "产品线 id", example: 1 })
  productLineId!: number;

  @ApiProperty({ description: "campaign 名称", example: "TikTok 预热视频第一波" })
  name!: string;

  @ApiProperty({ description: "类型：warmup / presale / launch / traffic", example: "warmup" })
  type!: string;

  @ApiProperty({ description: "平台", example: "tiktok" })
  platform!: string;

  @ApiProperty({ description: "状态", example: "running" })
  status!: string;

  @ApiProperty({ description: "KOL id", nullable: true })
  kolId!: number | null;

  @ApiProperty({ description: "KOL 名称", nullable: true })
  kolName!: string | null;

  @ApiProperty({ description: "预算（美元）", example: 2000 })
  budgetUsd!: number;

  @ApiProperty({ description: "已花费（美元）", example: 800 })
  spentUsd!: number;

  @ApiProperty({ description: "投流 / 传播反馈", nullable: true })
  feedbackNotes!: string | null;

  @ApiProperty({ description: "开始日期", nullable: true })
  startDate!: string | null;

  @ApiProperty({ description: "结束日期", nullable: true })
  endDate!: string | null;

  @ApiProperty({ description: "备注", nullable: true })
  notes!: string | null;

  @ApiProperty({ description: "创建时间", example: "2026-10-15T10:00:00.000Z" })
  createdAt!: string;
}

export class KolVo {
  @ApiProperty({ description: "KOL id", example: 1 })
  id!: number;

  @ApiProperty({ description: "名称", example: "HomeHacks" })
  name!: string;

  @ApiProperty({ description: "平台", example: "tiktok" })
  platform!: string;

  @ApiProperty({ description: "账号 handle", nullable: true, example: "@homehacks" })
  handle!: string | null;

  @ApiProperty({ description: "粉丝数", example: 320000 })
  followers!: number;

  @ApiProperty({ description: "合作状态", example: "cooperating" })
  coopStatus!: string;

  @ApiProperty({ description: "联系方式", nullable: true })
  contactInfo!: string | null;

  @ApiProperty({ description: "累计花费（美元）", example: 1500 })
  totalSpentUsd!: number;

  @ApiProperty({ description: "合作备注", nullable: true })
  cooperationNotes!: string | null;

  @ApiProperty({ description: "创建时间", example: "2026-10-15T10:00:00.000Z" })
  createdAt!: string;
}

export class FeedbackVo {
  @ApiProperty({ description: "反馈 id", example: 1 })
  id!: number;

  @ApiProperty({ description: "产品线 id", example: 1 })
  productLineId!: number;

  @ApiProperty({ description: "类型：expectation / improvement / status_follow / other", example: "expectation" })
  type!: string;

  @ApiProperty({ description: "内容", example: "期待磁吸模块扩展配件" })
  content!: string;

  @ApiProperty({ description: "来源", nullable: true, example: "Discord 社群" })
  source!: string | null;

  @ApiProperty({ description: "收集时间", example: "2026-10-15T10:00:00.000Z" })
  collectedAt!: string;

  @ApiProperty({ description: "创建时间", example: "2026-10-15T10:00:00.000Z" })
  createdAt!: string;
}

export class PresaleVo {
  @ApiProperty({ description: "预售批次 id", example: 1 })
  id!: number;

  @ApiProperty({ description: "SPU id", example: 1 })
  spuId!: number;

  @ApiProperty({ description: "产品线 id", example: 1 })
  productLineId!: number;

  @ApiProperty({ description: "SPU 名称", example: "桌面收纳盒 标准版" })
  spuName!: string;

  @ApiProperty({ description: "批次名称", example: "首发限量 500" })
  name!: string;

  @ApiProperty({ description: "是否限量", example: true })
  limited!: boolean;

  @ApiProperty({ description: "预售数量", example: 500 })
  quantity!: number;

  @ApiProperty({ description: "预售价（美元）", example: 49.99 })
  priceUsd!: number;

  @ApiProperty({ description: "开始时间", nullable: true })
  startAt!: string | null;

  @ApiProperty({ description: "结束时间", nullable: true })
  endAt!: string | null;

  @ApiProperty({ description: "备注", nullable: true })
  notes!: string | null;

  @ApiProperty({ description: "创建时间", example: "2026-10-15T10:00:00.000Z" })
  createdAt!: string;
}
