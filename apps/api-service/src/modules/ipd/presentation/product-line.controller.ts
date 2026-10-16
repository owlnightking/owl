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
  ApiPropertyOptional,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";
import { JwtAuthGuard, PermissionGuard } from "../../auth/index";
import { ok, page } from "../../../common/response/api-response";
import { PRODUCT_LINE_SERVICE, type ProductLineDetail } from "../domain/product-line.ports";
import { ProductLineService } from "../application/product-line.service";
import { ProductLinePageVo, ProductLineVo } from "./ipd.vo";

const DEFAULT_PAGE_SIZE = 20;

class CreateProductLineDto {
  @ApiPropertyOptional({ description: "产品线名称", example: "硬核桌面收纳系列" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ description: "风格描述", example: "工业风铝合金 + 磁吸" })
  @IsOptional()
  @IsString()
  styleDesc?: string;

  @ApiPropertyOptional({ description: "目标市场", example: "北美" })
  @IsOptional()
  @IsString()
  targetMarket?: string;

  @ApiPropertyOptional({ description: "备注", example: "面向 TikTok 家居场景" })
  @IsOptional()
  @IsString()
  notes?: string;
}

class UpdateProductLineDto extends CreateProductLineDto {}

class UpdateStageDto {
  @ApiPropertyOptional({ description: "IPD 阶段", example: "proposal" })
  @IsOptional()
  @IsString()
  ipdStage?: string;

  @ApiPropertyOptional({ description: "生命周期阶段", example: "incubating" })
  @IsOptional()
  @IsString()
  lifecycleStage?: string;
}

@ApiTags("IPD 产品线")
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller("ipd/product-lines")
export class ProductLineController {
  constructor(@Inject(PRODUCT_LINE_SERVICE) private readonly service: ProductLineService) {}

  @Get()
  @ApiOperation({ summary: "产品线分页列表" })
  @ApiQuery({ name: "page", description: "页码", required: false, example: "1" })
  @ApiQuery({ name: "pageSize", description: "每页条数", required: false, example: "20" })
  @ApiQuery({ name: "keyword", description: "名称 / 编号关键字", required: false })
  @ApiQuery({ name: "ipdStage", description: "IPD 阶段过滤", required: false, example: "opportunity" })
  @ApiQuery({ name: "lifecycleStage", description: "生命周期过滤", required: false, example: "incubating" })
  @ApiOkResponse({ description: "产品线分页列表", type: ProductLinePageVo })
  async list(
    @Query("page") pageParam?: string,
    @Query("pageSize") pageSize?: string,
    @Query("keyword") keyword?: string,
    @Query("ipdStage") ipdStage?: string,
    @Query("lifecycleStage") lifecycleStage?: string
  ) {
    const pageNum = Number(pageParam) || 1;
    const pageSizeNum = Number(pageSize) || DEFAULT_PAGE_SIZE;
    const result = await this.service.list({ keyword, ipdStage, lifecycleStage, page: pageNum, pageSize: pageSizeNum });
    return page(result.items.map(this.toResponse), pageNum, pageSizeNum, result.total);
  }

  @Get(":id")
  @ApiOperation({ summary: "产品线详情" })
  @ApiParam({ name: "id", description: "主键 id", example: 1 })
  @ApiOkResponse({ description: "产品线详情", type: ProductLineVo })
  async findById(@Param("id", ParseIntPipe) id: number) {
    return ok(this.toResponse(await this.service.findById(id)));
  }

  @Post()
  @ApiOperation({ summary: "创建产品线（自动编号 PL-YYYY-NNN）" })
  @ApiCreatedResponse({ description: "创建成功", type: ProductLineVo })
  async create(@Body() dto: CreateProductLineDto) {
    return ok(this.toResponse(await this.service.create(dto)));
  }

  @Put(":id")
  @ApiOperation({ summary: "更新产品线基础信息" })
  @ApiParam({ name: "id", description: "主键 id", example: 1 })
  @ApiOkResponse({ description: "更新成功", type: ProductLineVo })
  async update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateProductLineDto) {
    return ok(this.toResponse(await this.service.update(id, dto)));
  }

  @Put(":id/stages")
  @ApiOperation({ summary: "推进 / 回退产品线阶段" })
  @ApiParam({ name: "id", description: "主键 id", example: 1 })
  @ApiOkResponse({ description: "更新成功", type: ProductLineVo })
  async updateStages(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateStageDto) {
    return ok(this.toResponse(await this.service.updateStages(id, dto)));
  }

  @Delete(":id")
  @ApiOperation({ summary: "删除产品线（软删除）" })
  @ApiParam({ name: "id", description: "主键 id", example: 1 })
  @ApiOkResponse({ description: "删除成功" })
  async remove(@Param("id", ParseIntPipe) id: number) {
    await this.service.remove(id);
    return ok(undefined);
  }

  private toResponse(item: ProductLineDetail) {
    return {
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }
}
