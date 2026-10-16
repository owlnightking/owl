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
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { JwtAuthGuard, PermissionGuard } from "../../auth/index";
import { ok, page, parsePageQuery, type PageQuery } from "../../../common/response/api-response";
import {
  PRODUCTION_SERVICE,
  SHIPMENT_SERVICE,
  SUPPLIER_SERVICE,
  type ProductionItem,
  type QuoteItem,
  type ShipmentItem,
  type SupplierItem,
} from "../domain/isc.ports";
import { ProductionService, ShipmentService, SupplierService } from "../application/isc.service";
import { ProductionVo, QuoteVo, ShipmentVo, SupplierVo } from "./isc.vo";

class CreateSupplierDto {
  @ApiProperty({ description: "名称", example: "东莞精密制造" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ description: "联系方式", example: "wechat: factory_dg" })
  @IsOptional()
  @IsString()
  contact?: string;

  @ApiPropertyOptional({ description: "区域", example: "广东东莞" })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ description: "合作状态", example: "potential" })
  @IsOptional()
  @IsString()
  coopStatus?: string;

  @ApiPropertyOptional({ description: "产能 / 工艺能力", example: "注塑 + CNC，月产能 2w" })
  @IsOptional()
  @IsString()
  capability?: string;

  @ApiPropertyOptional({ description: "备注" })
  @IsOptional()
  @IsString()
  notes?: string;
}

class UpdateSupplierDto {
  @ApiPropertyOptional({ description: "名称", example: "东莞精密制造" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: "联系方式", example: "wechat: factory_dg" })
  @IsOptional()
  @IsString()
  contact?: string;

  @ApiPropertyOptional({ description: "区域", example: "广东东莞" })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ description: "合作状态", example: "active" })
  @IsOptional()
  @IsString()
  coopStatus?: string;

  @ApiPropertyOptional({ description: "产能 / 工艺能力", example: "注塑 + CNC，月产能 2w" })
  @IsOptional()
  @IsString()
  capability?: string;

  @ApiPropertyOptional({ description: "备注" })
  @IsOptional()
  @IsString()
  notes?: string;
}

class CreateQuoteDto {
  @ApiProperty({ description: "供应商 id", example: 1 })
  @IsInt()
  supplierId!: number;

  @ApiPropertyOptional({ description: "产品线 id", example: 1 })
  @IsOptional()
  @IsInt()
  productLineId?: number;

  @ApiPropertyOptional({ description: "SPU id", example: 1 })
  @IsOptional()
  @IsInt()
  spuId?: number;

  @ApiProperty({ description: "报价项", example: "首批量 500 台" })
  @IsString()
  @IsNotEmpty()
  itemName!: string;

  @ApiProperty({ description: "人民币金额（录入原币，自动折算美元）", example: 85000 })
  @IsNumber()
  @Min(0)
  amountCny!: number;

  @ApiPropertyOptional({ description: "汇率覆盖（默认取最新）", example: 0.14 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  exchangeRate?: number;

  @ApiPropertyOptional({ description: "备注" })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: "报价时间", example: "2026-10-15" })
  @IsOptional()
  quotedAt?: string;
}

class UpdateQuoteDto {
  @ApiPropertyOptional({ description: "报价项" })
  @IsOptional()
  @IsString()
  itemName?: string;

  @ApiPropertyOptional({ description: "人民币金额" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amountCny?: number;

  @ApiPropertyOptional({ description: "汇率覆盖" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  exchangeRate?: number;

  @ApiPropertyOptional({ description: "备注" })
  @IsOptional()
  @IsString()
  notes?: string;
}

class CreateProductionDto {
  @ApiProperty({ description: "供应商 id", example: 1 })
  @IsInt()
  supplierId!: number;

  @ApiProperty({ description: "类型：pilot / ramp / mass", example: "pilot" })
  @IsString()
  @IsNotEmpty()
  type!: string;

  @ApiPropertyOptional({ description: "数量", example: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  quantity?: number;

  @ApiPropertyOptional({ description: "状态", example: "planned" })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: "计划时间", example: "2026-11-01" })
  @IsOptional()
  plannedAt?: string;

  @ApiPropertyOptional({ description: "完成时间", example: "2026-11-20" })
  @IsOptional()
  completedAt?: string;

  @ApiPropertyOptional({ description: "备注" })
  @IsOptional()
  @IsString()
  notes?: string;
}

class UpdateProductionDto {
  @ApiPropertyOptional({ description: "供应商 id", example: 1 })
  @IsOptional()
  @IsInt()
  supplierId?: number;

  @ApiPropertyOptional({ description: "类型：pilot / ramp / mass", example: "pilot" })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: "数量", example: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  quantity?: number;

  @ApiPropertyOptional({ description: "状态", example: "producing" })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: "计划时间", example: "2026-11-01" })
  @IsOptional()
  plannedAt?: string;

  @ApiPropertyOptional({ description: "完成时间", example: "2026-11-20" })
  @IsOptional()
  completedAt?: string;

  @ApiPropertyOptional({ description: "备注" })
  @IsOptional()
  @IsString()
  notes?: string;
}

class CreateShipmentDto {
  @ApiProperty({ description: "SPU id", example: 1 })
  @IsInt()
  spuId!: number;

  @ApiPropertyOptional({ description: "供应商 id", example: 1 })
  @IsOptional()
  @IsInt()
  supplierId?: number;

  @ApiProperty({ description: "运输方式：sea / air", example: "sea" })
  @IsString()
  @IsNotEmpty()
  mode!: string;

  @ApiPropertyOptional({ description: "海外仓", example: "tiktok_us" })
  @IsOptional()
  @IsString()
  warehouse?: string;

  @ApiPropertyOptional({ description: "状态", example: "head_haul" })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: "运单 / 柜号", example: "MSCU1234567" })
  @IsOptional()
  @IsString()
  trackingRef?: string;

  @ApiPropertyOptional({ description: "成本人民币（自动折算美元）", example: 36000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  costCny?: number;

  @ApiPropertyOptional({ description: "汇率覆盖（默认取最新）", example: 0.14 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  exchangeRate?: number;

  @ApiPropertyOptional({ description: "预计到达", example: "2026-12-01" })
  @IsOptional()
  etaDate?: string;

  @ApiPropertyOptional({ description: "备注" })
  @IsOptional()
  @IsString()
  notes?: string;
}

class UpdateShipmentDto {
  @ApiPropertyOptional({ description: "供应商 id" })
  @IsOptional()
  @IsInt()
  supplierId?: number;

  @ApiPropertyOptional({ description: "运输方式", example: "sea" })
  @IsOptional()
  @IsString()
  mode?: string;

  @ApiPropertyOptional({ description: "海外仓", example: "tiktok_us" })
  @IsOptional()
  @IsString()
  warehouse?: string;

  @ApiPropertyOptional({ description: "状态", example: "in_transit" })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: "运单 / 柜号" })
  @IsOptional()
  @IsString()
  trackingRef?: string;

  @ApiPropertyOptional({ description: "成本人民币" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  costCny?: number;

  @ApiPropertyOptional({ description: "汇率覆盖" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  exchangeRate?: number;

  @ApiPropertyOptional({ description: "预计到达" })
  @IsOptional()
  etaDate?: string;

  @ApiPropertyOptional({ description: "签收时间", example: "2026-12-05" })
  @IsOptional()
  receivedAt?: string;

  @ApiPropertyOptional({ description: "备注" })
  @IsOptional()
  @IsString()
  notes?: string;
}

@ApiTags("ISC 供应商")
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller("isc/suppliers")
export class SupplierController {
  constructor(@Inject(SUPPLIER_SERVICE) private readonly service: SupplierService) {}

  @Get()
  @ApiOperation({ summary: "供应商分页列表" })
  @ApiQuery({ name: "page", required: false, example: "1" })
  @ApiQuery({ name: "pageSize", required: false, example: "20" })
  @ApiQuery({ name: "keyword", required: false })
  @ApiQuery({ name: "coopStatus", required: false })
  @ApiOkResponse({ description: "列表", type: [SupplierVo] })
  async list(
    @Query("page") pageParam?: string,
    @Query("pageSize") pageSize?: string,
    @Query("keyword") keyword?: string,
    @Query("coopStatus") coopStatus?: string
  ) {
    const pg = parsePageQuery(pageParam, pageSize);
    const result = await this.service.list({ keyword, coopStatus, page: pg.pageNum, pageSize: pg.pageSizeNum });
    return this.paged(result, pg, this.toResponse);
  }

  @Get(":id")
  @ApiOperation({ summary: "供应商详情" })
  @ApiParam({ name: "id", example: 1 })
  @ApiOkResponse({ description: "详情", type: SupplierVo })
  async findById(@Param("id", ParseIntPipe) id: number) {
    return ok(this.toResponse(await this.service.findById(id)));
  }

  @Post()
  @ApiOperation({ summary: "新增供应商" })
  @ApiCreatedResponse({ description: "创建成功", type: SupplierVo })
  async create(@Body() dto: CreateSupplierDto) {
    return ok(this.toResponse(await this.service.create(dto)));
  }

  @Put(":id")
  @ApiOperation({ summary: "更新供应商" })
  @ApiParam({ name: "id", example: 1 })
  @ApiOkResponse({ description: "更新成功", type: SupplierVo })
  async update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateSupplierDto) {
    return ok(this.toResponse(await this.service.update(id, dto)));
  }

  @Delete(":id")
  @ApiOperation({ summary: "删除供应商" })
  @ApiParam({ name: "id", example: 1 })
  @ApiOkResponse({ description: "删除成功" })
  async remove(@Param("id", ParseIntPipe) id: number) {
    await this.service.remove(id);
    return ok(undefined);
  }

  @Get(":id/quotes")
  @ApiOperation({ summary: "供应商报价列表" })
  @ApiParam({ name: "id", example: 1 })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "pageSize", required: false })
  @ApiOkResponse({ description: "列表", type: [QuoteVo] })
  async listQuotes(
    @Param("id", ParseIntPipe) id: number,
    @Query("page") pageParam?: string,
    @Query("pageSize") pageSize?: string
  ) {
    const pg = parsePageQuery(pageParam, pageSize);
    const result = await this.service.listQuotes({ supplierId: id, page: pg.pageNum, pageSize: pg.pageSizeNum });
    return this.paged(result, pg, this.toQuoteResponse);
  }

  @Get("quotes/list")
  @ApiOperation({ summary: "报价分页列表（跨供应商）" })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "pageSize", required: false })
  @ApiQuery({ name: "supplierId", required: false })
  @ApiQuery({ name: "productLineId", required: false })
  @ApiQuery({ name: "spuId", required: false })
  @ApiOkResponse({ description: "列表", type: [QuoteVo] })
  async listAllQuotes(
    @Query("page") pageParam?: string,
    @Query("pageSize") pageSize?: string,
    @Query("supplierId") supplierId?: string,
    @Query("productLineId") productLineId?: string,
    @Query("spuId") spuId?: string
  ) {
    const pg = parsePageQuery(pageParam, pageSize);
    const result = await this.service.listQuotes({
      supplierId: supplierId ? Number(supplierId) : undefined,
      productLineId: productLineId ? Number(productLineId) : undefined,
      spuId: spuId ? Number(spuId) : undefined,
      page: pg.pageNum,
      pageSize: pg.pageSizeNum,
    });
    return this.paged(result, pg, this.toQuoteResponse);
  }

  @Post("quotes")
  @ApiOperation({ summary: "新增报价（人民币录入，自动折算美元）" })
  @ApiCreatedResponse({ description: "创建成功", type: QuoteVo })
  async createQuote(@Body() dto: CreateQuoteDto) {
    const input = { ...dto, quotedAt: dto.quotedAt ? new Date(dto.quotedAt) : undefined };
    return ok(this.toQuoteResponse(await this.service.createQuote(input)));
  }

  @Put("quotes/:quoteId")
  @ApiOperation({ summary: "更新报价（改人民币金额 / 汇率自动重算美元）" })
  @ApiParam({ name: "quoteId", example: 1 })
  @ApiOkResponse({ description: "更新成功", type: QuoteVo })
  async updateQuote(@Param("quoteId", ParseIntPipe) quoteId: number, @Body() dto: UpdateQuoteDto) {
    return ok(this.toQuoteResponse(await this.service.updateQuote(quoteId, dto)));
  }

  @Delete("quotes/:quoteId")
  @ApiOperation({ summary: "删除报价" })
  @ApiParam({ name: "quoteId", example: 1 })
  @ApiOkResponse({ description: "删除成功" })
  async removeQuote(@Param("quoteId", ParseIntPipe) quoteId: number) {
    await this.service.removeQuote(quoteId);
    return ok(undefined);
  }

  private paged<T>(result: { items: T[]; total: number }, pg: PageQuery, mapper: (item: T) => unknown) {
    return page(result.items.map(mapper), pg.pageNum, pg.pageSizeNum, result.total);
  }

  private toResponse(item: SupplierItem) {
    return { ...item, createdAt: item.createdAt.toISOString() };
  }

  private toQuoteResponse(item: QuoteItem) {
    return {
      ...item,
      quotedAt: item.quotedAt.toISOString(),
      createdAt: item.createdAt.toISOString(),
    };
  }
}

@ApiTags("ISC 生产")
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller("isc/productions")
export class ProductionController {
  constructor(@Inject(PRODUCTION_SERVICE) private readonly service: ProductionService) {}

  @Get()
  @ApiOperation({ summary: "生产批次分页列表" })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "pageSize", required: false })
  @ApiQuery({ name: "spuId", required: false })
  @ApiQuery({ name: "supplierId", required: false })
  @ApiQuery({ name: "type", required: false })
  @ApiQuery({ name: "status", required: false })
  @ApiOkResponse({ description: "列表", type: [ProductionVo] })
  async list(
    @Query("page") pageParam?: string,
    @Query("pageSize") pageSize?: string,
    @Query("spuId") spuId?: string,
    @Query("supplierId") supplierId?: string,
    @Query("type") type?: string,
    @Query("status") status?: string
  ) {
    const pg = parsePageQuery(pageParam, pageSize);
    const result = await this.service.list({
      spuId: spuId ? Number(spuId) : undefined,
      supplierId: supplierId ? Number(supplierId) : undefined,
      type,
      status,
      page: pg.pageNum,
      pageSize: pg.pageSizeNum,
    });
    return this.paged(result, pg, this.toResponse);
  }

  @Post("spus/:spuId")
  @ApiOperation({ summary: "创建生产批次（挂 SPU）" })
  @ApiParam({ name: "spuId", example: 1 })
  @ApiCreatedResponse({ description: "创建成功", type: ProductionVo })
  async create(@Param("spuId", ParseIntPipe) spuId: number, @Body() dto: CreateProductionDto) {
    const input = {
      ...dto,
      plannedAt: dto.plannedAt ? new Date(dto.plannedAt) : undefined,
      completedAt: dto.completedAt ? new Date(dto.completedAt) : undefined,
    };
    return ok(this.toResponse(await this.service.create(spuId, input)));
  }

  @Put(":id")
  @ApiOperation({ summary: "更新生产批次" })
  @ApiParam({ name: "id", example: 1 })
  @ApiOkResponse({ description: "更新成功", type: ProductionVo })
  async update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateProductionDto) {
    const input = {
      ...dto,
      plannedAt: dto.plannedAt ? new Date(dto.plannedAt) : undefined,
      completedAt: dto.completedAt ? new Date(dto.completedAt) : undefined,
    };
    return ok(this.toResponse(await this.service.update(id, input)));
  }

  @Delete(":id")
  @ApiOperation({ summary: "删除生产批次" })
  @ApiParam({ name: "id", example: 1 })
  @ApiOkResponse({ description: "删除成功" })
  async remove(@Param("id", ParseIntPipe) id: number) {
    await this.service.remove(id);
    return ok(undefined);
  }

  private paged<T>(result: { items: T[]; total: number }, pg: PageQuery, mapper: (item: T) => unknown) {
    return page(result.items.map(mapper), pg.pageNum, pg.pageSizeNum, result.total);
  }

  private toResponse(item: ProductionItem) {
    return {
      ...item,
      plannedAt: item.plannedAt ? item.plannedAt.toISOString() : null,
      completedAt: item.completedAt ? item.completedAt.toISOString() : null,
      createdAt: item.createdAt.toISOString(),
    };
  }
}

@ApiTags("ISC 头程物流")
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller("isc/shipments")
export class ShipmentController {
  constructor(@Inject(SHIPMENT_SERVICE) private readonly service: ShipmentService) {}

  @Get()
  @ApiOperation({ summary: "头程 / 物流分页列表" })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "pageSize", required: false })
  @ApiQuery({ name: "productLineId", required: false })
  @ApiQuery({ name: "spuId", required: false })
  @ApiQuery({ name: "mode", required: false })
  @ApiQuery({ name: "warehouse", required: false })
  @ApiQuery({ name: "status", required: false })
  @ApiOkResponse({ description: "列表", type: [ShipmentVo] })
  async list(
    @Query("page") pageParam?: string,
    @Query("pageSize") pageSize?: string,
    @Query("productLineId") productLineId?: string,
    @Query("spuId") spuId?: string,
    @Query("mode") mode?: string,
    @Query("warehouse") warehouse?: string,
    @Query("status") status?: string
  ) {
    const pg = parsePageQuery(pageParam, pageSize);
    const result = await this.service.list({
      productLineId: productLineId ? Number(productLineId) : undefined,
      spuId: spuId ? Number(spuId) : undefined,
      mode,
      warehouse,
      status,
      page: pg.pageNum,
      pageSize: pg.pageSizeNum,
    });
    return this.paged(result, pg, this.toResponse);
  }

  @Post()
  @ApiOperation({ summary: "创建头程 / 物流单（人民币成本自动折算美元，产品线由 SPU 推导）" })
  @ApiCreatedResponse({ description: "创建成功", type: ShipmentVo })
  async create(@Body() dto: CreateShipmentDto) {
    const input = {
      ...dto,
      etaDate: dto.etaDate ? new Date(dto.etaDate) : undefined,
    };
    return ok(this.toResponse(await this.service.create(input)));
  }

  @Put(":id")
  @ApiOperation({ summary: "更新头程 / 物流单" })
  @ApiParam({ name: "id", example: 1 })
  @ApiOkResponse({ description: "更新成功", type: ShipmentVo })
  async update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateShipmentDto) {
    const input = {
      ...dto,
      etaDate: dto.etaDate ? new Date(dto.etaDate) : undefined,
      receivedAt: dto.receivedAt ? new Date(dto.receivedAt) : undefined,
    };
    return ok(this.toResponse(await this.service.update(id, input)));
  }

  @Delete(":id")
  @ApiOperation({ summary: "删除头程 / 物流单" })
  @ApiParam({ name: "id", example: 1 })
  @ApiOkResponse({ description: "删除成功" })
  async remove(@Param("id", ParseIntPipe) id: number) {
    await this.service.remove(id);
    return ok(undefined);
  }

  private paged<T>(result: { items: T[]; total: number }, pg: PageQuery, mapper: (item: T) => unknown) {
    return page(result.items.map(mapper), pg.pageNum, pg.pageSizeNum, result.total);
  }

  private toResponse(item: ShipmentItem) {
    return {
      ...item,
      etaDate: item.etaDate ? item.etaDate.toISOString() : null,
      receivedAt: item.receivedAt ? item.receivedAt.toISOString() : null,
      createdAt: item.createdAt.toISOString(),
    };
  }
}
