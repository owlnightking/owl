import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from "@nestjs/common";
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
import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { PRODUCT_SERVICE, type ProductItem } from "../domain/product.ports";
import { ProductService } from "../application/product.service";

const DEFAULT_PAGE_SIZE = 20;
import { ok, page } from "../../../common/response/api-response";
import { Inject } from "@nestjs/common";
import { JwtAuthGuard, PermissionGuard, RequirePermission } from "../../auth/index";
import { ProductPageVo, ProductVo } from "./product.vo";

class CreateProductDto {
  @ApiProperty({ description: "商品名称", example: "定制马克杯" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ description: "商品描述", example: "Owl 定制周边" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: "商品图片地址", example: "https://example.com/product.png" })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({ description: "商品价格（金币）", example: 200 })
  @IsNotEmpty()
  price!: number;

  @ApiPropertyOptional({ description: "库存数量", example: 10 })
  @IsOptional()
  stock?: number;

  @ApiPropertyOptional({ description: "是否上架", example: true })
  @IsOptional()
  enabled?: boolean;

  @ApiPropertyOptional({ description: "排序值", example: 1 })
  @IsOptional()
  sortOrder?: number;
}

class UpdateProductDto {
  @ApiPropertyOptional({ description: "商品名称", example: "定制马克杯" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: "商品描述", example: "Owl 定制周边" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: "商品图片地址", example: "https://example.com/product.png" })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ description: "商品价格（金币）", example: 200 })
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ description: "库存数量", example: 10 })
  @IsOptional()
  stock?: number;

  @ApiPropertyOptional({ description: "是否上架", example: true })
  @IsOptional()
  enabled?: boolean;

  @ApiPropertyOptional({ description: "排序值", example: 1 })
  @IsOptional()
  sortOrder?: number;
}

@ApiTags("商品管理")
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller("recognition/products")
export class ProductController {
  constructor(@Inject(PRODUCT_SERVICE) private readonly service: ProductService) {}

  @Get()
  @ApiOperation({ summary: "商品分页列表" })
  @ApiQuery({ name: "page", description: "页码", required: false, example: "1" })
  @ApiQuery({ name: "pageSize", description: "每页条数", required: false, example: "20" })
  @ApiQuery({ name: "keyword", description: "名称关键字", required: false, example: "马克杯" })
  @ApiQuery({ name: "enabled", description: "是否上架（true / false）", required: false, example: "true" })
  @ApiOkResponse({ description: "商品分页列表", type: ProductPageVo })
  async list(
    @Query("page") pageParam?: string,
    @Query("pageSize") pageSize?: string,
    @Query("keyword") keyword?: string,
    @Query("enabled") enabled?: string
  ) {
    const pageNum = Number(pageParam) || 1;
    const pageSizeNum = Number(pageSize) || DEFAULT_PAGE_SIZE;
    const result = await this.service.list({
      keyword,
      enabled: enabled !== undefined ? enabled === "true" : undefined,
      page: pageNum,
      pageSize: pageSizeNum,
    });
    return page(result.items.map(this.toResponse), pageNum, pageSizeNum, result.total);
  }

  @Get(":id")
  @ApiOperation({ summary: "商品详情" })
  @ApiParam({ name: "id", description: "主键 id", example: 1 })
  @ApiOkResponse({ description: "商品详情", type: ProductVo })
  async findById(@Param("id", ParseIntPipe) id: number) {
    return ok(this.toResponse(await this.service.findById(id)));
  }

  @Post()
  @RequirePermission("recognition:product:write")
  @ApiOperation({ summary: "新建商品" })
  @ApiCreatedResponse({ description: "创建成功", type: ProductVo })
  async create(@Body() dto: CreateProductDto) {
    return ok(this.toResponse(await this.service.create(dto)));
  }

  @Put(":id")
  @RequirePermission("recognition:product:write")
  @ApiOperation({ summary: "更新商品" })
  @ApiParam({ name: "id", description: "主键 id", example: 1 })
  @ApiOkResponse({ description: "更新成功", type: ProductVo })
  async update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
    return ok(this.toResponse(await this.service.update(id, dto)));
  }

  @Delete(":id")
  @RequirePermission("recognition:product:write")
  @ApiOperation({ summary: "删除商品" })
  @ApiParam({ name: "id", description: "主键 id", example: 1 })
  @ApiOkResponse({ description: "删除成功" })
  async remove(@Param("id", ParseIntPipe) id: number) {
    await this.service.delete(id);
    return ok(undefined);
  }

  private toResponse(item: ProductItem) {
    return { ...item, createdAt: item.createdAt.toISOString() };
  }
}
