import { Body, Controller, Delete, Get, Inject, Param, ParseIntPipe, Post, Put, UseGuards } from "@nestjs/common";
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { JwtAuthGuard, PermissionGuard } from "../../auth/index";
import { ok } from "../../../common/response/api-response";
import { IPD_STAGE_SERVICE } from "../domain/ipd.ports";
import { IpdStageService } from "../application/ipd-stage.service";
import { DesignTaskVo, InvestDecisionVo, PrototypeReviewVo, ResearchVo, RoiReviewVo } from "./ipd.vo";

class CreateResearchDto {
  @ApiProperty({ description: "类型：competitor / market / voc", example: "competitor" })
  @IsString()
  @IsNotEmpty()
  type!: string;

  @ApiProperty({ description: "标题", example: "竞品 Anker 桌面系列调研" })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ description: "内容", example: "定价区间 $39-69，磁吸卖点突出" })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: "来源引用", example: "https://..." })
  @IsOptional()
  @IsString()
  sourceRef?: string;
}

class UpdateResearchDto extends CreateResearchDto {}

class CreateDesignTaskDto {
  @ApiProperty({ description: "类型：product / appearance / mechanism / packaging", example: "appearance" })
  @IsString()
  @IsNotEmpty()
  type!: string;

  @ApiProperty({ description: "标题", example: "外观设计三方案" })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ description: "状态", example: "in_progress" })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: "生产可行性", example: true })
  @IsOptional()
  @IsBoolean()
  feasible?: boolean;

  @ApiPropertyOptional({ description: "备注", example: "注塑 + 铝合金骨架" })
  @IsOptional()
  @IsString()
  notes?: string;
}

class UpdateDesignTaskDto extends CreateDesignTaskDto {}

class UpsertPrototypeDto {
  @ApiPropertyOptional({ description: "手办样完成", example: true })
  @IsOptional()
  @IsBoolean()
  sampleReady?: boolean;

  @ApiPropertyOptional({ description: "内部评审通过", example: true })
  @IsOptional()
  @IsBoolean()
  reviewPassed?: boolean;

  @ApiPropertyOptional({ description: "评审记录", example: "结构强度达标" })
  @IsOptional()
  @IsString()
  reviewNotes?: string;

  @ApiPropertyOptional({ description: "推送 GTM 共建", example: true })
  @IsOptional()
  @IsBoolean()
  sharedWithGtm?: boolean;
}

class UpsertDecisionDto {
  @ApiPropertyOptional({ description: "GTM 反馈摘要", example: "社群期待度高，预热视频播放 50w" })
  @IsOptional()
  @IsString()
  gtmFeedbackSummary?: string;

  @ApiPropertyOptional({ description: "ISC 供应情况摘要", example: "两家供应商报价完成，海运 25 天" })
  @IsOptional()
  @IsString()
  iscSummary?: string;

  @ApiPropertyOptional({ description: "目标定价（美元）", example: 59.99 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  targetPriceUsd?: number;

  @ApiPropertyOptional({ description: "单位成本（美元）", example: 18.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitCostUsd?: number;

  @ApiPropertyOptional({ description: "投决结果：pending / approved / rejected", example: "approved" })
  @IsOptional()
  @IsString()
  result?: string;

  @ApiPropertyOptional({ description: "备注", example: "通过后启动小批量预售" })
  @IsOptional()
  @IsString()
  notes?: string;
}

class CreateReviewDto {
  @ApiProperty({ description: "阶段：presale / listed", example: "presale" })
  @IsString()
  @IsNotEmpty()
  phase!: string;

  @ApiPropertyOptional({ description: "销售额（美元）", example: 12000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  salesUsd?: number;

  @ApiPropertyOptional({ description: "广告成本（美元）", example: 3000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  adCostUsd?: number;

  @ApiPropertyOptional({ description: "产品成本（美元）", example: 4000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  productCostUsd?: number;

  @ApiPropertyOptional({ description: "履约成本（美元）", example: 1500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fulfillmentCostUsd?: number;

  @ApiPropertyOptional({ description: "退款额（美元）", example: 200 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  refundUsd?: number;

  @ApiPropertyOptional({ description: "售后成本（美元）", example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  afterSaleCostUsd?: number;

  @ApiPropertyOptional({ description: "ROI（手工计算）", example: 0.65 })
  @IsOptional()
  @IsNumber()
  roi?: number;

  @ApiPropertyOptional({ description: "复盘决策", example: "price_reduce" })
  @IsOptional()
  @IsString()
  decision?: string;

  @ApiPropertyOptional({ description: "备注", example: "推出减配版阻击" })
  @IsOptional()
  @IsString()
  notes?: string;
}

class UpdateReviewDto {
  @ApiPropertyOptional({ description: "阶段：presale / listed", example: "listed" })
  @IsOptional()
  @IsString()
  phase?: string;

  @ApiPropertyOptional({ description: "销售额（美元）", example: 48000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  salesUsd?: number;

  @ApiPropertyOptional({ description: "广告成本（美元）", example: 12000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  adCostUsd?: number;

  @ApiPropertyOptional({ description: "产品成本（美元）", example: 16000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  productCostUsd?: number;

  @ApiPropertyOptional({ description: "履约成本（美元）", example: 6000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fulfillmentCostUsd?: number;

  @ApiPropertyOptional({ description: "退款额（美元）", example: 800 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  refundUsd?: number;

  @ApiPropertyOptional({ description: "售后成本（美元）", example: 400 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  afterSaleCostUsd?: number;

  @ApiPropertyOptional({ description: "ROI（手工计算）", example: 0.72 })
  @IsOptional()
  @IsNumber()
  roi?: number;

  @ApiPropertyOptional({ description: "复盘决策", example: "hold" })
  @IsOptional()
  @IsString()
  decision?: string;

  @ApiPropertyOptional({ description: "备注" })
  @IsOptional()
  @IsString()
  notes?: string;
}

@ApiTags("IPD 阶段推进")
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller()
export class IpdStageController {
  constructor(@Inject(IPD_STAGE_SERVICE) private readonly service: IpdStageService) {}

  @Get("ipd/product-lines/:id/researches")
  @ApiOperation({ summary: "机会判断调研材料列表" })
  @ApiParam({ name: "id", description: "产品线 id", example: 1 })
  @ApiOkResponse({ description: "列表", type: [ResearchVo] })
  async listResearches(@Param("id", ParseIntPipe) id: number) {
    return ok((await this.service.listResearches(id)).map((item) => this.researchResponse(item)));
  }

  @Post("ipd/product-lines/:id/researches")
  @ApiOperation({ summary: "新增调研材料" })
  @ApiParam({ name: "id", description: "产品线 id", example: 1 })
  @ApiCreatedResponse({ description: "创建成功", type: ResearchVo })
  async createResearch(@Param("id", ParseIntPipe) id: number, @Body() dto: CreateResearchDto) {
    return ok(this.researchResponse(await this.service.createResearch(id, dto)));
  }

  @Put("ipd/researches/:id")
  @ApiOperation({ summary: "更新调研材料" })
  @ApiParam({ name: "id", description: "调研 id", example: 1 })
  @ApiOkResponse({ description: "更新成功", type: ResearchVo })
  async updateResearch(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateResearchDto) {
    return ok(this.researchResponse(await this.service.updateResearch(id, dto)));
  }

  @Delete("ipd/researches/:id")
  @ApiOperation({ summary: "删除调研材料" })
  @ApiParam({ name: "id", description: "调研 id", example: 1 })
  @ApiOkResponse({ description: "删除成功" })
  async removeResearch(@Param("id", ParseIntPipe) id: number) {
    await this.service.removeResearch(id);
    return ok(undefined);
  }

  @Get("ipd/product-lines/:id/design-tasks")
  @ApiOperation({ summary: "立项设计任务列表" })
  @ApiParam({ name: "id", description: "产品线 id", example: 1 })
  @ApiOkResponse({ description: "列表", type: [DesignTaskVo] })
  async listDesignTasks(@Param("id", ParseIntPipe) id: number) {
    return ok((await this.service.listDesignTasks(id)).map((item) => this.designResponse(item)));
  }

  @Post("ipd/product-lines/:id/design-tasks")
  @ApiOperation({ summary: "新增设计任务" })
  @ApiParam({ name: "id", description: "产品线 id", example: 1 })
  @ApiCreatedResponse({ description: "创建成功", type: DesignTaskVo })
  async createDesignTask(@Param("id", ParseIntPipe) id: number, @Body() dto: CreateDesignTaskDto) {
    return ok(this.designResponse(await this.service.createDesignTask(id, dto)));
  }

  @Put("ipd/design-tasks/:id")
  @ApiOperation({ summary: "更新设计任务" })
  @ApiParam({ name: "id", description: "任务 id", example: 1 })
  @ApiOkResponse({ description: "更新成功", type: DesignTaskVo })
  async updateDesignTask(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateDesignTaskDto) {
    return ok(this.designResponse(await this.service.updateDesignTask(id, dto)));
  }

  @Delete("ipd/design-tasks/:id")
  @ApiOperation({ summary: "删除设计任务" })
  @ApiParam({ name: "id", description: "任务 id", example: 1 })
  @ApiOkResponse({ description: "删除成功" })
  async removeDesignTask(@Param("id", ParseIntPipe) id: number) {
    await this.service.removeDesignTask(id);
    return ok(undefined);
  }

  @Get("ipd/product-lines/:id/prototype")
  @ApiOperation({ summary: "定型：手办样与评审状态" })
  @ApiParam({ name: "id", description: "产品线 id", example: 1 })
  @ApiOkResponse({ description: "定型记录", type: PrototypeReviewVo })
  async getPrototype(@Param("id", ParseIntPipe) id: number) {
    const item = await this.service.getPrototype(id);
    return ok(item ? this.prototypeResponse(item) : null);
  }

  @Put("ipd/product-lines/:id/prototype")
  @ApiOperation({ summary: "更新定型状态（手办样 / 评审 / 推送 GTM）" })
  @ApiParam({ name: "id", description: "产品线 id", example: 1 })
  @ApiOkResponse({ description: "更新成功", type: PrototypeReviewVo })
  async upsertPrototype(@Param("id", ParseIntPipe) id: number, @Body() dto: UpsertPrototypeDto) {
    return ok(this.prototypeResponse(await this.service.upsertPrototype(id, dto)));
  }

  @Get("ipd/product-lines/:id/decision")
  @ApiOperation({ summary: "投决记录" })
  @ApiParam({ name: "id", description: "产品线 id", example: 1 })
  @ApiOkResponse({ description: "投决记录", type: InvestDecisionVo })
  async getDecision(@Param("id", ParseIntPipe) id: number) {
    const item = await this.service.getDecision(id);
    return ok(item ? this.decisionResponse(item) : null);
  }

  @Put("ipd/product-lines/:id/decision")
  @ApiOperation({ summary: "录入 / 更新投决（通过后自动进入预售期）" })
  @ApiParam({ name: "id", description: "产品线 id", example: 1 })
  @ApiOkResponse({ description: "更新成功", type: InvestDecisionVo })
  async upsertDecision(@Param("id", ParseIntPipe) id: number, @Body() dto: UpsertDecisionDto) {
    return ok(this.decisionResponse(await this.service.upsertDecision(id, dto)));
  }

  @Get("ipd/product-lines/:id/reviews")
  @ApiOperation({ summary: "经营复盘 / ROI 列表" })
  @ApiParam({ name: "id", description: "产品线 id", example: 1 })
  @ApiOkResponse({ description: "列表", type: [RoiReviewVo] })
  async listReviews(@Param("id", ParseIntPipe) id: number) {
    return ok((await this.service.listReviews(id)).map((item) => this.reviewResponse(item)));
  }

  @Post("ipd/product-lines/:id/reviews")
  @ApiOperation({ summary: "新增复盘（预售期 / 上市后）" })
  @ApiParam({ name: "id", description: "产品线 id", example: 1 })
  @ApiCreatedResponse({ description: "创建成功", type: RoiReviewVo })
  async createReview(@Param("id", ParseIntPipe) id: number, @Body() dto: CreateReviewDto) {
    return ok(this.reviewResponse(await this.service.createReview(id, dto)));
  }

  @Put("ipd/reviews/:id")
  @ApiOperation({ summary: "更新复盘" })
  @ApiParam({ name: "id", description: "复盘 id", example: 1 })
  @ApiOkResponse({ description: "更新成功", type: RoiReviewVo })
  async updateReview(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateReviewDto) {
    return ok(this.reviewResponse(await this.service.updateReview(id, dto)));
  }

  @Delete("ipd/reviews/:id")
  @ApiOperation({ summary: "删除复盘" })
  @ApiParam({ name: "id", description: "复盘 id", example: 1 })
  @ApiOkResponse({ description: "删除成功" })
  async removeReview(@Param("id", ParseIntPipe) id: number) {
    await this.service.removeReview(id);
    return ok(undefined);
  }

  private researchResponse(item: {
    id: number;
    productLineId: number;
    type: string;
    title: string;
    content: string | null;
    sourceRef: string | null;
    createdAt: Date;
  }) {
    return { ...item, createdAt: item.createdAt.toISOString() };
  }

  private designResponse(item: {
    id: number;
    productLineId: number;
    type: string;
    title: string;
    status: string;
    feasible: boolean | null;
    notes: string | null;
    createdAt: Date;
  }) {
    return { ...item, createdAt: item.createdAt.toISOString() };
  }

  private prototypeResponse(item: {
    id: number;
    productLineId: number;
    sampleReady: boolean;
    reviewPassed: boolean;
    reviewNotes: string | null;
    sharedWithGtm: boolean;
    sharedAt: Date | null;
    updatedAt: Date;
  }) {
    return {
      ...item,
      sharedAt: item.sharedAt ? item.sharedAt.toISOString() : null,
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  private decisionResponse(item: {
    id: number;
    productLineId: number;
    gtmFeedbackSummary: string | null;
    iscSummary: string | null;
    targetPriceUsd: number | null;
    unitCostUsd: number | null;
    result: string;
    decidedAt: Date | null;
    notes: string | null;
    updatedAt: Date;
  }) {
    return {
      ...item,
      decidedAt: item.decidedAt ? item.decidedAt.toISOString() : null,
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  private reviewResponse(item: {
    id: number;
    productLineId: number;
    phase: string;
    salesUsd: number;
    adCostUsd: number;
    productCostUsd: number;
    fulfillmentCostUsd: number;
    refundUsd: number;
    afterSaleCostUsd: number;
    roi: number | null;
    decision: string | null;
    notes: string | null;
    createdAt: Date;
  }) {
    return { ...item, createdAt: item.createdAt.toISOString() };
  }
}
