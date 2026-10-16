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
import { IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { JwtAuthGuard, PermissionGuard } from "../../auth/index";
import { ok, page } from "../../../common/response/api-response";
import { VOC_SERVICE, type VocTicketItem } from "../domain/voc.ports";
import { VocService } from "../application/voc.service";

const DEFAULT_PAGE_SIZE = 20;

class VocTicketVo {
  @ApiProperty({ description: "工单 id", example: 1 })
  id!: number;

  @ApiProperty({
    description: "渠道：after_sale_email / community / workshop_comment / whatsapp / twitter_dm",
    example: "whatsapp",
  })
  source!: string;

  @ApiProperty({ description: "产品线 id", nullable: true })
  productLineId!: number | null;

  @ApiProperty({ description: "产品线名称", nullable: true })
  productLineName!: string | null;

  @ApiProperty({ description: "SPU id", nullable: true })
  spuId!: number | null;

  @ApiProperty({ description: "SPU 名称", nullable: true })
  spuName!: string | null;

  @ApiProperty({ description: "标题", example: "用户反馈磁吸力度不足" })
  title!: string;

  @ApiProperty({ description: "内容", nullable: true })
  content!: string | null;

  @ApiProperty({ description: "分类", example: "improvement" })
  category!: string;

  @ApiProperty({ description: "状态", example: "new" })
  status!: string;

  @ApiProperty({ description: "处理备注", nullable: true })
  handledNote!: string | null;

  @ApiProperty({ description: "创建时间", example: "2026-10-15T10:00:00.000Z" })
  createdAt!: string;
}

class CreateVocTicketDto {
  @ApiProperty({ description: "渠道", example: "whatsapp" })
  @IsString()
  @IsNotEmpty()
  source!: string;

  @ApiPropertyOptional({ description: "产品线 id", example: 1 })
  @IsOptional()
  @IsInt()
  productLineId?: number;

  @ApiPropertyOptional({ description: "SPU id", example: 1 })
  @IsOptional()
  @IsInt()
  spuId?: number;

  @ApiProperty({ description: "标题", example: "用户反馈磁吸力度不足" })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ description: "内容", example: "WhatsApp 用户反馈盖子容易松动" })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: "分类", example: "improvement" })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: "状态", example: "new" })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: "处理备注" })
  @IsOptional()
  @IsString()
  handledNote?: string;
}

class UpdateVocTicketDto {
  @ApiPropertyOptional({ description: "产品线 id" })
  @IsOptional()
  @IsInt()
  productLineId?: number;

  @ApiPropertyOptional({ description: "SPU id" })
  @IsOptional()
  @IsInt()
  spuId?: number;

  @ApiPropertyOptional({ description: "标题" })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: "内容" })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: "分类" })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: "状态" })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: "处理备注" })
  @IsOptional()
  @IsString()
  handledNote?: string;
}

@ApiTags("VOC 工单")
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller("voc/tickets")
export class VocController {
  constructor(@Inject(VOC_SERVICE) private readonly service: VocService) {}

  @Get()
  @ApiOperation({ summary: "VOC 工单分页列表（五渠道：售后邮箱 / 社群 / 工坊留言 / WhatsApp / Twitter 私信）" })
  @ApiQuery({ name: "page", required: false, example: "1" })
  @ApiQuery({ name: "pageSize", required: false, example: "20" })
  @ApiQuery({ name: "source", required: false, example: "whatsapp" })
  @ApiQuery({ name: "category", required: false })
  @ApiQuery({ name: "status", required: false })
  @ApiQuery({ name: "productLineId", required: false })
  @ApiQuery({ name: "spuId", required: false })
  @ApiOkResponse({ description: "列表", type: [VocTicketVo] })
  async list(
    @Query("page") pageParam?: string,
    @Query("pageSize") pageSize?: string,
    @Query("source") source?: string,
    @Query("category") category?: string,
    @Query("status") status?: string,
    @Query("productLineId") productLineId?: string,
    @Query("spuId") spuId?: string
  ) {
    const pageNum = Number(pageParam) || 1;
    const pageSizeNum = Number(pageSize) || DEFAULT_PAGE_SIZE;
    const result = await this.service.list({
      source,
      category,
      status,
      productLineId: productLineId ? Number(productLineId) : undefined,
      spuId: spuId ? Number(spuId) : undefined,
      page: pageNum,
      pageSize: pageSizeNum,
    });
    return page(result.items.map(this.toResponse), pageNum, pageSizeNum, result.total);
  }

  @Get(":id")
  @ApiOperation({ summary: "VOC 工单详情" })
  @ApiParam({ name: "id", example: 1 })
  @ApiOkResponse({ description: "详情", type: VocTicketVo })
  async findById(@Param("id", ParseIntPipe) id: number) {
    return ok(this.toResponse(await this.service.findById(id)));
  }

  @Post()
  @ApiOperation({ summary: "录入 VOC 工单" })
  @ApiCreatedResponse({ description: "创建成功", type: VocTicketVo })
  async create(@Body() dto: CreateVocTicketDto) {
    return ok(this.toResponse(await this.service.create(dto)));
  }

  @Put(":id")
  @ApiOperation({ summary: "更新 VOC 工单" })
  @ApiParam({ name: "id", example: 1 })
  @ApiOkResponse({ description: "更新成功", type: VocTicketVo })
  async update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateVocTicketDto) {
    return ok(this.toResponse(await this.service.update(id, dto)));
  }

  @Delete(":id")
  @ApiOperation({ summary: "删除 VOC 工单" })
  @ApiParam({ name: "id", example: 1 })
  @ApiOkResponse({ description: "删除成功" })
  async remove(@Param("id", ParseIntPipe) id: number) {
    await this.service.remove(id);
    return ok(undefined);
  }

  private toResponse(item: VocTicketItem) {
    return { ...item, createdAt: item.createdAt.toISOString() };
  }
}
