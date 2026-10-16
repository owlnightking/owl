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
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard, PermissionGuard } from "../../auth/index";
import { ok, page } from "../../../common/response/api-response";
import { EXCHANGE_RATE_SERVICE, type ExchangeRateItem } from "../domain/exchange-rate.ports";
import { ExchangeRateService } from "../application/exchange-rate.service";
import { CreateExchangeRateDto, ExchangeRatePageVo, ExchangeRateVo, UpdateExchangeRateDto } from "./exchange-rate.vo";

const DEFAULT_PAGE_SIZE = 20;
const BASE_CURRENCY = "CNY";
const QUOTE_CURRENCY = "USD";

@ApiTags("汇率管理")
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller("system/exchange-rates")
export class ExchangeRateController {
  constructor(@Inject(EXCHANGE_RATE_SERVICE) private readonly service: ExchangeRateService) {}

  @Get()
  @ApiOperation({ summary: "汇率分页列表" })
  @ApiQuery({ name: "page", description: "页码", required: false, example: "1" })
  @ApiQuery({ name: "pageSize", description: "每页条数", required: false, example: "20" })
  @ApiQuery({ name: "base", description: "基础货币", required: false, example: "CNY" })
  @ApiQuery({ name: "quote", description: "报价货币", required: false, example: "USD" })
  @ApiOkResponse({ description: "汇率分页列表", type: ExchangeRatePageVo })
  async list(
    @Query("page") pageParam?: string,
    @Query("pageSize") pageSize?: string,
    @Query("base") base?: string,
    @Query("quote") quote?: string
  ) {
    const pageNum = Number(pageParam) || 1;
    const pageSizeNum = Number(pageSize) || DEFAULT_PAGE_SIZE;
    const result = await this.service.list({ base, quote, page: pageNum, pageSize: pageSizeNum });
    return page(result.items.map(this.toResponse), pageNum, pageSizeNum, result.total);
  }

  @Get("latest")
  @ApiOperation({ summary: "最新汇率（默认 CNY→USD）" })
  @ApiQuery({ name: "base", description: "基础货币", required: false, example: "CNY" })
  @ApiQuery({ name: "quote", description: "报价货币", required: false, example: "USD" })
  @ApiOkResponse({ description: "最新汇率", type: ExchangeRateVo })
  async latest(@Query("base") base?: string, @Query("quote") quote?: string) {
    const item = await this.service.latest(base || BASE_CURRENCY, quote || QUOTE_CURRENCY);
    return ok(item ? this.toResponse(item) : null);
  }

  @Post()
  @ApiOperation({ summary: "手工录入汇率" })
  @ApiCreatedResponse({ description: "创建成功", type: ExchangeRateVo })
  async create(@Body() dto: CreateExchangeRateDto) {
    const item = await this.service.createManual({
      base: dto.base || BASE_CURRENCY,
      quote: dto.quote || QUOTE_CURRENCY,
      rate: dto.rate,
      source: "manual",
      effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : new Date(),
    });
    return ok(this.toResponse(item));
  }

  @Put(":id")
  @ApiOperation({ summary: "更新汇率（校验 / 修正）" })
  @ApiParam({ name: "id", description: "主键 id", example: 1 })
  @ApiOkResponse({ description: "更新成功", type: ExchangeRateVo })
  async update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateExchangeRateDto) {
    const item = await this.service.update(id, {
      rate: dto.rate,
      verified: dto.verified,
      effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : undefined,
    });
    return ok(this.toResponse(item));
  }

  @Delete(":id")
  @ApiOperation({ summary: "删除汇率" })
  @ApiParam({ name: "id", description: "主键 id", example: 1 })
  @ApiOkResponse({ description: "删除成功" })
  async remove(@Param("id", ParseIntPipe) id: number) {
    await this.service.remove(id);
    return ok(undefined);
  }

  private toResponse(item: ExchangeRateItem) {
    return {
      ...item,
      effectiveDate: item.effectiveDate.toISOString(),
      createdAt: item.createdAt.toISOString(),
    };
  }
}
