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
import { IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from "class-validator";
import { JwtAuthGuard, PermissionGuard } from "../../auth/index";
import { ok, page } from "../../../common/response/api-response";
import { SPU_SERVICE, type SkuItem, type SpuItem } from "../domain/spu.ports";
import { SpuService } from "../application/spu.service";
import { SkuVo, SpuPageVo, SpuVo } from "./ipd.vo";

const DEFAULT_PAGE_SIZE = 20;

class CreateSpuDto {
  @ApiProperty({ description: "SPU 名称", example: "桌面收纳盒 标准版" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ description: "备注", example: "首发起量款" })
  @IsOptional()
  @IsString()
  notes?: string;
}

class UpdateSpuDto {
  @ApiPropertyOptional({ description: "SPU 名称", example: "桌面收纳盒 标准版" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: "市场 SPU 编码（预发售产生）", example: "A12345" })
  @IsOptional()
  @IsString()
  spuCode?: string;

  @ApiPropertyOptional({ description: "状态", example: "presale" })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: "上市时间", example: "2026-11-01" })
  @IsOptional()
  launchAt?: string;

  @ApiPropertyOptional({ description: "备注", example: "首发起量款" })
  @IsOptional()
  @IsString()
  notes?: string;
}

class CreateSkuDto {
  @ApiProperty({ description: "SKU 编码", example: "SKU-BLACK-L" })
  @IsString()
  @IsNotEmpty()
  skuCode!: string;

  @ApiProperty({ description: "SKU 名称", example: "黑色 大号" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ description: "美元售价", example: 49.99 })
  @IsNumber()
  @Min(0)
  priceUsd!: number;

  @ApiPropertyOptional({ description: "是否限量款", example: false })
  @IsOptional()
  @IsBoolean()
  limited?: boolean;

  @ApiPropertyOptional({ description: "库存", example: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({ description: "备注", example: "首发色" })
  @IsOptional()
  @IsString()
  notes?: string;
}

class UpdateSkuDto {
  @ApiPropertyOptional({ description: "SKU 名称", example: "黑色 大号" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: "美元售价", example: 49.99 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceUsd?: number;

  @ApiPropertyOptional({ description: "是否限量款", example: false })
  @IsOptional()
  @IsBoolean()
  limited?: boolean;

  @ApiPropertyOptional({ description: "库存", example: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({ description: "备注", example: "首发色" })
  @IsOptional()
  @IsString()
  notes?: string;
}

@ApiTags("IPD SPU/SKU")
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller()
export class SpuController {
  constructor(@Inject(SPU_SERVICE) private readonly service: SpuService) {}

  @Get("ipd/product-lines/:productLineId/spus")
  @ApiOperation({ summary: "产品线下 SPU 分页列表" })
  @ApiParam({ name: "productLineId", description: "产品线 id", example: 1 })
  @ApiQuery({ name: "page", description: "页码", required: false, example: "1" })
  @ApiQuery({ name: "pageSize", description: "每页条数", required: false, example: "20" })
  @ApiQuery({ name: "status", description: "状态过滤", required: false })
  @ApiOkResponse({ description: "SPU 分页列表", type: SpuPageVo })
  async listByLine(
    @Param("productLineId", ParseIntPipe) productLineId: number,
    @Query("page") pageParam?: string,
    @Query("pageSize") pageSize?: string,
    @Query("status") status?: string
  ) {
    const pageNum = Number(pageParam) || 1;
    const pageSizeNum = Number(pageSize) || DEFAULT_PAGE_SIZE;
    const result = await this.service.list({ productLineId, status, page: pageNum, pageSize: pageSizeNum });
    return page(result.items.map(this.toSpuResponse), pageNum, pageSizeNum, result.total);
  }

  @Post("ipd/product-lines/:productLineId/spus")
  @ApiOperation({ summary: "创建 SPU（自动内部编号 SPU-YYYY-NNN）" })
  @ApiParam({ name: "productLineId", description: "产品线 id", example: 1 })
  @ApiCreatedResponse({ description: "创建成功", type: SpuVo })
  async create(@Param("productLineId", ParseIntPipe) productLineId: number, @Body() dto: CreateSpuDto) {
    return ok(this.toSpuResponse(await this.service.create(productLineId, dto)));
  }

  @Get("ipd/spus")
  @ApiOperation({ summary: "SPU 分页列表（跨产品线）" })
  @ApiQuery({ name: "page", description: "页码", required: false, example: "1" })
  @ApiQuery({ name: "pageSize", description: "每页条数", required: false, example: "20" })
  @ApiQuery({ name: "productLineId", description: "产品线 id", required: false })
  @ApiQuery({ name: "status", description: "状态过滤", required: false })
  @ApiOkResponse({ description: "SPU 分页列表", type: SpuPageVo })
  async list(
    @Query("page") pageParam?: string,
    @Query("pageSize") pageSize?: string,
    @Query("productLineId") productLineId?: string,
    @Query("status") status?: string
  ) {
    const pageNum = Number(pageParam) || 1;
    const pageSizeNum = Number(pageSize) || DEFAULT_PAGE_SIZE;
    const result = await this.service.list({
      productLineId: productLineId ? Number(productLineId) : undefined,
      status,
      page: pageNum,
      pageSize: pageSizeNum,
    });
    return page(result.items.map(this.toSpuResponse), pageNum, pageSizeNum, result.total);
  }

  @Get("ipd/spus/:id")
  @ApiOperation({ summary: "SPU 详情" })
  @ApiParam({ name: "id", description: "主键 id", example: 1 })
  @ApiOkResponse({ description: "SPU 详情", type: SpuVo })
  async findById(@Param("id", ParseIntPipe) id: number) {
    return ok(this.toSpuResponse(await this.service.findById(id)));
  }

  @Put("ipd/spus/:id")
  @ApiOperation({ summary: "更新 SPU（含市场 SPU 编码回填）" })
  @ApiParam({ name: "id", description: "主键 id", example: 1 })
  @ApiOkResponse({ description: "更新成功", type: SpuVo })
  async update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateSpuDto) {
    const input = { ...dto, launchAt: dto.launchAt ? new Date(dto.launchAt) : undefined };
    return ok(this.toSpuResponse(await this.service.update(id, input)));
  }

  @Delete("ipd/spus/:id")
  @ApiOperation({ summary: "删除 SPU（软删除）" })
  @ApiParam({ name: "id", description: "主键 id", example: 1 })
  @ApiOkResponse({ description: "删除成功" })
  async remove(@Param("id", ParseIntPipe) id: number) {
    await this.service.remove(id);
    return ok(undefined);
  }

  @Get("ipd/spus/:id/skus")
  @ApiOperation({ summary: "SPU 下 SKU 列表" })
  @ApiParam({ name: "id", description: "SPU id", example: 1 })
  @ApiOkResponse({ description: "SKU 列表", type: [SkuVo] })
  async listSkus(@Param("id", ParseIntPipe) id: number) {
    return ok((await this.service.listSkus(id)).map(this.toSkuResponse));
  }

  @Post("ipd/spus/:id/skus")
  @ApiOperation({ summary: "创建 SKU（美元定价）" })
  @ApiParam({ name: "id", description: "SPU id", example: 1 })
  @ApiCreatedResponse({ description: "创建成功", type: SkuVo })
  async createSku(@Param("id", ParseIntPipe) id: number, @Body() dto: CreateSkuDto) {
    return ok(this.toSkuResponse(await this.service.createSku(id, dto)));
  }

  @Put("ipd/skus/:id")
  @ApiOperation({ summary: "更新 SKU" })
  @ApiParam({ name: "id", description: "SKU id", example: 1 })
  @ApiOkResponse({ description: "更新成功", type: SkuVo })
  async updateSku(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateSkuDto) {
    return ok(this.toSkuResponse(await this.service.updateSku(id, dto)));
  }

  @Delete("ipd/skus/:id")
  @ApiOperation({ summary: "删除 SKU（软删除）" })
  @ApiParam({ name: "id", description: "SKU id", example: 1 })
  @ApiOkResponse({ description: "删除成功" })
  async removeSku(@Param("id", ParseIntPipe) id: number) {
    await this.service.removeSku(id);
    return ok(undefined);
  }

  private toSpuResponse(item: SpuItem) {
    return {
      ...item,
      launchAt: item.launchAt ? item.launchAt.toISOString() : null,
      createdAt: item.createdAt.toISOString(),
    };
  }

  private toSkuResponse(item: SkuItem) {
    return { ...item, createdAt: item.createdAt.toISOString() };
  }
}
