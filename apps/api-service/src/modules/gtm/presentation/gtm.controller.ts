import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiPropertyOptional,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { JwtAuthGuard, PermissionGuard } from "../../auth/index";
import { ok, page, parsePageQuery, type PageQuery } from "../../../common/response/api-response";
import {
  CAMPAIGN_SERVICE,
  FEEDBACK_SERVICE,
  KOL_SERVICE,
  PRESALE_SERVICE,
  type CampaignItem,
  type FeedbackItem,
  type KolItem,
  type PresaleItem,
} from "../domain/gtm.ports";
import { CampaignService, FeedbackService, KolService, PresaleService } from "../application/gtm.service";
import { CampaignVo, FeedbackVo, KolVo, PresaleVo } from "./gtm.vo";

function pagedResult<T>(result: { items: T[]; total: number }, pg: PageQuery, mapper: (item: T) => unknown) {
  return page(result.items.map(mapper), pg.pageNum, pg.pageSizeNum, result.total);
}

class CreateCampaignDto {
  @ApiProperty({ description: "名称", example: "TikTok 预热视频第一波" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ description: "类型：warmup / presale / launch / traffic", example: "warmup" })
  @IsString()
  @IsNotEmpty()
  type!: string;

  @ApiPropertyOptional({ description: "平台", example: "tiktok" })
  @IsOptional()
  @IsString()
  platform?: string;

  @ApiPropertyOptional({ description: "状态", example: "planned" })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: "KOL id", example: 1 })
  @IsOptional()
  @IsInt()
  kolId?: number;

  @ApiPropertyOptional({ description: "预算（美元）", example: 2000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetUsd?: number;

  @ApiPropertyOptional({ description: "已花费（美元）", example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  spentUsd?: number;

  @ApiPropertyOptional({ description: "投流反馈", example: "播放 50w，互动率 8%" })
  @IsOptional()
  @IsString()
  feedbackNotes?: string;

  @ApiPropertyOptional({ description: "开始日期", example: "2026-10-20" })
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: "结束日期", example: "2026-11-20" })
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: "备注" })
  @IsOptional()
  @IsString()
  notes?: string;
}

class UpdateCampaignDto {
  @ApiPropertyOptional({ description: "名称", example: "TikTok 预热视频第一波" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: "类型：warmup / presale / launch / traffic", example: "warmup" })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: "平台", example: "tiktok" })
  @IsOptional()
  @IsString()
  platform?: string;

  @ApiPropertyOptional({ description: "状态", example: "running" })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: "KOL id", example: 1 })
  @IsOptional()
  @IsInt()
  kolId?: number;

  @ApiPropertyOptional({ description: "预算（美元）", example: 2000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetUsd?: number;

  @ApiPropertyOptional({ description: "已花费（美元）", example: 800 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  spentUsd?: number;

  @ApiPropertyOptional({ description: "投流反馈", example: "播放 50w，互动率 8%" })
  @IsOptional()
  @IsString()
  feedbackNotes?: string;

  @ApiPropertyOptional({ description: "开始日期", example: "2026-10-20" })
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: "结束日期", example: "2026-11-20" })
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: "备注" })
  @IsOptional()
  @IsString()
  notes?: string;
}

class CreateKolDto {
  @ApiProperty({ description: "名称", example: "HomeHacks" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ description: "平台", example: "tiktok" })
  @IsOptional()
  @IsString()
  platform?: string;

  @ApiPropertyOptional({ description: "handle", example: "@homehacks" })
  @IsOptional()
  @IsString()
  handle?: string;

  @ApiPropertyOptional({ description: "粉丝数", example: 320000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  followers?: number;

  @ApiPropertyOptional({ description: "合作状态", example: "contacting" })
  @IsOptional()
  @IsString()
  coopStatus?: string;

  @ApiPropertyOptional({ description: "联系方式", example: "email@example.com" })
  @IsOptional()
  @IsString()
  contactInfo?: string;

  @ApiPropertyOptional({ description: "累计花费（美元）", example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalSpentUsd?: number;

  @ApiPropertyOptional({ description: "合作备注" })
  @IsOptional()
  @IsString()
  cooperationNotes?: string;
}

class UpdateKolDto {
  @ApiPropertyOptional({ description: "名称", example: "HomeHacks" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: "平台", example: "tiktok" })
  @IsOptional()
  @IsString()
  platform?: string;

  @ApiPropertyOptional({ description: "handle", example: "@homehacks" })
  @IsOptional()
  @IsString()
  handle?: string;

  @ApiPropertyOptional({ description: "粉丝数", example: 320000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  followers?: number;

  @ApiPropertyOptional({ description: "合作状态", example: "cooperating" })
  @IsOptional()
  @IsString()
  coopStatus?: string;

  @ApiPropertyOptional({ description: "联系方式" })
  @IsOptional()
  @IsString()
  contactInfo?: string;

  @ApiPropertyOptional({ description: "累计花费（美元）", example: 1500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalSpentUsd?: number;

  @ApiPropertyOptional({ description: "合作备注" })
  @IsOptional()
  @IsString()
  cooperationNotes?: string;
}

class CreateFeedbackDto {
  @ApiProperty({ description: "类型：expectation / improvement / status_follow / other", example: "improvement" })
  @IsString()
  @IsNotEmpty()
  type!: string;

  @ApiProperty({ description: "内容", example: "希望增加无线充电模块" })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiPropertyOptional({ description: "来源", example: "Discord 社群" })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ description: "收集时间", example: "2026-10-15" })
  @IsOptional()
  collectedAt?: string;
}

class UpdateFeedbackDto {
  @ApiPropertyOptional({ description: "类型" })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: "内容" })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: "来源" })
  @IsOptional()
  @IsString()
  source?: string;
}

class CreatePresaleDto {
  @ApiProperty({ description: "批次名称", example: "首发限量 500" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ description: "是否限量", example: true })
  @IsOptional()
  @IsBoolean()
  limited?: boolean;

  @ApiPropertyOptional({ description: "预售数量", example: 500 })
  @IsOptional()
  @IsInt()
  @Min(0)
  quantity?: number;

  @ApiPropertyOptional({ description: "预售价（美元）", example: 49.99 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceUsd?: number;

  @ApiPropertyOptional({ description: "开始时间", example: "2026-11-01" })
  @IsOptional()
  startAt?: string;

  @ApiPropertyOptional({ description: "结束时间", example: "2026-11-15" })
  @IsOptional()
  endAt?: string;

  @ApiPropertyOptional({ description: "备注" })
  @IsOptional()
  @IsString()
  notes?: string;
}

class UpdatePresaleDto {
  @ApiPropertyOptional({ description: "批次名称", example: "首发限量 500" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: "是否限量", example: true })
  @IsOptional()
  @IsBoolean()
  limited?: boolean;

  @ApiPropertyOptional({ description: "预售数量", example: 500 })
  @IsOptional()
  @IsInt()
  @Min(0)
  quantity?: number;

  @ApiPropertyOptional({ description: "预售价（美元）", example: 49.99 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceUsd?: number;

  @ApiPropertyOptional({ description: "开始时间", example: "2026-11-01" })
  @IsOptional()
  startAt?: string;

  @ApiPropertyOptional({ description: "结束时间", example: "2026-11-15" })
  @IsOptional()
  endAt?: string;

  @ApiPropertyOptional({ description: "备注" })
  @IsOptional()
  @IsString()
  notes?: string;
}

@ApiTags("GTM Campaign")
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller("gtm/campaigns")
export class CampaignController {
  constructor(@Inject(CAMPAIGN_SERVICE) private readonly service: CampaignService) {}

  @Get()
  @ApiOperation({ summary: "campaign 分页列表" })
  @ApiQuery({ name: "page", required: false, example: "1" })
  @ApiQuery({ name: "pageSize", required: false, example: "20" })
  @ApiQuery({ name: "productLineId", required: false })
  @ApiQuery({ name: "type", required: false })
  @ApiQuery({ name: "platform", required: false })
  @ApiQuery({ name: "status", required: false })
  @ApiOkResponse({ description: "列表", type: [CampaignVo] })
  async list(
    @Query("page") pageParam?: string,
    @Query("pageSize") pageSize?: string,
    @Query("productLineId") productLineId?: string,
    @Query("type") type?: string,
    @Query("platform") platform?: string,
    @Query("status") status?: string
  ) {
    const pg = parsePageQuery(pageParam, pageSize);
    const result = await this.service.list({
      productLineId: productLineId ? Number(productLineId) : undefined,
      type,
      platform,
      status,
      page: pg.pageNum,
      pageSize: pg.pageSizeNum,
    });
    return pagedResult(result, pg, this.toResponse);
  }

  @Post("product-lines/:productLineId")
  @ApiOperation({ summary: "创建 campaign（挂产品线）" })
  @ApiParam({ name: "productLineId", example: 1 })
  @ApiCreatedResponse({ description: "创建成功", type: CampaignVo })
  async create(@Param("productLineId", ParseIntPipe) productLineId: number, @Body() dto: CreateCampaignDto) {
    const input = {
      ...dto,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
    };
    return ok(this.toResponse(await this.service.create(productLineId, input)));
  }

  @Put(":id")
  @ApiOperation({ summary: "更新 campaign" })
  @ApiParam({ name: "id", example: 1 })
  @ApiOkResponse({ description: "更新成功", type: CampaignVo })
  async update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateCampaignDto) {
    const input = {
      ...dto,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
    };
    return ok(this.toResponse(await this.service.update(id, input)));
  }

  @Delete(":id")
  @ApiOperation({ summary: "删除 campaign" })
  @ApiParam({ name: "id", example: 1 })
  @ApiOkResponse({ description: "删除成功" })
  async remove(@Param("id", ParseIntPipe) campaignId: number) {
    await this.service.remove(campaignId);
    return ok(undefined);
  }

  private toResponse(item: CampaignItem) {
    return {
      ...item,
      startDate: item.startDate ? item.startDate.toISOString() : null,
      endDate: item.endDate ? item.endDate.toISOString() : null,
      createdAt: item.createdAt.toISOString(),
    };
  }
}

@ApiTags("GTM KOL")
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller("gtm/kols")
export class KolController {
  constructor(@Inject(KOL_SERVICE) private readonly service: KolService) {}

  @Get()
  @ApiOperation({ summary: "KOL 分页列表" })
  @ApiQuery({ name: "page", required: false, example: "1" })
  @ApiQuery({ name: "pageSize", required: false, example: "20" })
  @ApiQuery({ name: "keyword", required: false })
  @ApiQuery({ name: "platform", required: false })
  @ApiQuery({ name: "coopStatus", required: false })
  @ApiOkResponse({ description: "列表", type: [KolVo] })
  async list(
    @Query("page") pageParam?: string,
    @Query("pageSize") pageSize?: string,
    @Query("keyword") keyword?: string,
    @Query("platform") platform?: string,
    @Query("coopStatus") coopStatus?: string
  ) {
    const pg = parsePageQuery(pageParam, pageSize);
    const result = await this.service.list({
      keyword,
      platform,
      coopStatus,
      page: pg.pageNum,
      pageSize: pg.pageSizeNum,
    });
    return pagedResult(result, pg, this.toResponse);
  }

  @Get(":id")
  @ApiOperation({ summary: "KOL 详情" })
  @ApiParam({ name: "id", example: 1 })
  @ApiOkResponse({ description: "详情", type: KolVo })
  async findById(@Param("id", ParseIntPipe) id: number) {
    return ok(this.toResponse(await this.service.findById(id)));
  }

  @Post()
  @ApiOperation({ summary: "新增 KOL" })
  @ApiCreatedResponse({ description: "创建成功", type: KolVo })
  async create(@Body() dto: CreateKolDto) {
    return ok(this.toResponse(await this.service.create(dto)));
  }

  @Put(":id")
  @ApiOperation({ summary: "更新 KOL" })
  @ApiParam({ name: "id", example: 1 })
  @ApiOkResponse({ description: "更新成功", type: KolVo })
  async update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateKolDto) {
    return ok(this.toResponse(await this.service.update(id, dto)));
  }

  @Delete(":id")
  @ApiOperation({ summary: "删除 KOL" })
  @ApiParam({ name: "id", example: 1 })
  @ApiOkResponse({ description: "删除成功" })
  async remove(@Param("id", ParseIntPipe) kolId: number) {
    await this.service.remove(kolId);
    return ok(undefined);
  }

  private toResponse(item: KolItem) {
    return { ...item, createdAt: item.createdAt.toISOString() };
  }
}

@ApiTags("GTM 社群反馈")
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller()
export class FeedbackController {
  constructor(@Inject(FEEDBACK_SERVICE) private readonly service: FeedbackService) {}

  @Get("gtm/product-lines/:productLineId/feedbacks")
  @ApiOperation({ summary: "产品线社群反馈列表" })
  @ApiParam({ name: "productLineId", example: 1 })
  @ApiQuery({ name: "page", required: false, example: "1" })
  @ApiQuery({ name: "pageSize", required: false, example: "20" })
  @ApiQuery({ name: "type", required: false })
  @ApiOkResponse({ description: "列表", type: [FeedbackVo] })
  async listByLine(
    @Param("productLineId", ParseIntPipe) productLineId: number,
    @Query("page") pageParam?: string,
    @Query("pageSize") pageSize?: string,
    @Query("type") type?: string
  ) {
    const pg = parsePageQuery(pageParam, pageSize);
    const result = await this.service.list({ productLineId, type, page: pg.pageNum, pageSize: pg.pageSizeNum });
    return pagedResult(result, pg, this.toResponse);
  }

  @Get("gtm/feedbacks")
  @ApiOperation({ summary: "社群反馈分页列表（跨产品线）" })
  @ApiQuery({ name: "page", required: false, example: "1" })
  @ApiQuery({ name: "pageSize", required: false, example: "20" })
  @ApiQuery({ name: "productLineId", required: false })
  @ApiQuery({ name: "type", required: false })
  @ApiOkResponse({ description: "列表", type: [FeedbackVo] })
  async list(
    @Query("page") pageParam?: string,
    @Query("pageSize") pageSize?: string,
    @Query("productLineId") productLineId?: string,
    @Query("type") type?: string
  ) {
    const pg = parsePageQuery(pageParam, pageSize);
    const result = await this.service.list({
      productLineId: productLineId ? Number(productLineId) : undefined,
      type,
      page: pg.pageNum,
      pageSize: pg.pageSizeNum,
    });
    return pagedResult(result, pg, this.toResponse);
  }

  @Post("product-lines/:productLineId/feedbacks")
  @ApiOperation({ summary: "录入社群反馈" })
  @ApiParam({ name: "productLineId", example: 1 })
  @ApiCreatedResponse({ description: "创建成功", type: FeedbackVo })
  async create(@Param("productLineId", ParseIntPipe) productLineId: number, @Body() dto: CreateFeedbackDto) {
    const input = { ...dto, collectedAt: dto.collectedAt ? new Date(dto.collectedAt) : undefined };
    return ok(this.toResponse(await this.service.create(productLineId, input)));
  }

  @Put("feedbacks/:id")
  @ApiOperation({ summary: "更新社群反馈" })
  @ApiParam({ name: "id", example: 1 })
  @ApiOkResponse({ description: "更新成功", type: FeedbackVo })
  async update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateFeedbackDto) {
    return ok(this.toResponse(await this.service.update(id, dto)));
  }

  @Delete("feedbacks/:id")
  @ApiOperation({ summary: "删除社群反馈" })
  @ApiParam({ name: "id", example: 1 })
  @ApiOkResponse({ description: "删除成功" })
  async remove(@Param("id", ParseIntPipe) feedbackId: number) {
    await this.service.remove(feedbackId);
    return ok(undefined);
  }

  private toResponse(item: FeedbackItem) {
    return {
      ...item,
      collectedAt: item.collectedAt.toISOString(),
      createdAt: item.createdAt.toISOString(),
    };
  }
}

@ApiTags("GTM 预发售")
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller("gtm/presales")
export class PresaleController {
  constructor(@Inject(PRESALE_SERVICE) private readonly service: PresaleService) {}

  @Get()
  @ApiOperation({ summary: "预售批次分页列表" })
  @ApiQuery({ name: "page", required: false, example: "1" })
  @ApiQuery({ name: "pageSize", required: false, example: "20" })
  @ApiQuery({ name: "productLineId", required: false })
  @ApiQuery({ name: "spuId", required: false })
  @ApiOkResponse({ description: "列表", type: [PresaleVo] })
  async list(
    @Query("page") pageParam?: string,
    @Query("pageSize") pageSize?: string,
    @Query("productLineId") productLineId?: string,
    @Query("spuId") spuId?: string
  ) {
    const pg = parsePageQuery(pageParam, pageSize);
    const result = await this.service.list({
      productLineId: productLineId ? Number(productLineId) : undefined,
      spuId: spuId ? Number(spuId) : undefined,
      page: pg.pageNum,
      pageSize: pg.pageSizeNum,
    });
    return pagedResult(result, pg, this.toResponse);
  }

  @Post("spus/:spuId")
  @ApiOperation({ summary: "创建预售批次（挂 SPU，自动关联产品线）" })
  @ApiParam({ name: "spuId", example: 1 })
  @ApiCreatedResponse({ description: "创建成功", type: PresaleVo })
  async create(@Param("spuId", ParseIntPipe) spuId: number, @Body() dto: CreatePresaleDto) {
    const input = {
      ...dto,
      startAt: dto.startAt ? new Date(dto.startAt) : undefined,
      endAt: dto.endAt ? new Date(dto.endAt) : undefined,
    };
    return ok(this.toResponse(await this.service.create(spuId, input)));
  }

  @Put(":id")
  @ApiOperation({ summary: "更新预售批次" })
  @ApiParam({ name: "id", example: 1 })
  @ApiOkResponse({ description: "更新成功", type: PresaleVo })
  async update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdatePresaleDto) {
    const input = {
      ...dto,
      startAt: dto.startAt ? new Date(dto.startAt) : undefined,
      endAt: dto.endAt ? new Date(dto.endAt) : undefined,
    };
    return ok(this.toResponse(await this.service.update(id, input)));
  }

  @Delete(":id")
  @ApiOperation({ summary: "删除预售批次" })
  @ApiParam({ name: "id", example: 1 })
  @ApiOkResponse({ description: "删除成功" })
  async remove(@Param("id", ParseIntPipe) presaleId: number) {
    await this.service.remove(presaleId);
    return ok(undefined);
  }

  private toResponse(item: PresaleItem) {
    return {
      ...item,
      startAt: item.startAt ? item.startAt.toISOString() : null,
      endAt: item.endAt ? item.endAt.toISOString() : null,
      createdAt: item.createdAt.toISOString(),
    };
  }
}
