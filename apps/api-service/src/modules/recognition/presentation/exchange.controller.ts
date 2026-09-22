import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from "@nestjs/common";
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiPropertyOptional,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { IsInt, IsOptional, IsString } from "class-validator";
import { Type } from "class-transformer";
import { EXCHANGE_SERVICE, type ExchangeOrderItem } from "../domain/exchange.ports";
import { COIN_SERVICE } from "../domain/coin.ports";
import { STAMINA_SERVICE } from "../domain/stamina.ports";

const DEFAULT_PAGE_SIZE = 20;
import { ExchangeService } from "../application/exchange.service";
import { CoinService } from "../application/coin.service";
import { StaminaService } from "../application/stamina.service";
import { ok, page } from "../../../common/response/api-response";
import { Inject } from "@nestjs/common";
import { JwtAuthGuard, PermissionGuard, RequirePermission, CurrentUser, type AuthPrincipal } from "../../auth/index";
import {
  CoinAccountVo,
  CoinTransactionPageVo,
  ExchangeOrderPageVo,
  ExchangeOrderVo,
  ExchangePendingCountVo,
  StaminaAccountVo,
} from "./exchange.vo";

class CreateExchangeDto {
  @ApiProperty({ description: "商品 id", example: 1 })
  @Type(() => Number)
  @IsInt()
  productId!: number;

  @ApiPropertyOptional({ description: "兑换数量", example: 1, default: 1 })
  @IsOptional()
  quantity?: number;
}

class ExchangeQueryDto {
  @ApiPropertyOptional({
    description: "订单状态",
    enum: ["pending", "approved", "rejected", "fulfilled"],
    example: "pending",
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: "兑换用户 id", example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userId?: number;

  @ApiPropertyOptional({ description: "页码", example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: "每页条数", example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  pageSize?: number;
}

@ApiTags("兑换管理")
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller("recognition/exchange")
export class ExchangeController {
  constructor(
    @Inject(EXCHANGE_SERVICE) private readonly exchangeService: ExchangeService,
    @Inject(COIN_SERVICE) private readonly coinService: CoinService,
    @Inject(STAMINA_SERVICE) private readonly staminaService: StaminaService
  ) {}

  @Get("orders")
  @RequirePermission("recognition:exchange:read")
  @ApiOperation({ summary: "兑换订单分页列表" })
  @ApiOkResponse({ description: "兑换订单分页列表", type: ExchangeOrderPageVo })
  async listOrders(@Query() query: ExchangeQueryDto) {
    const pageNum = query.page ?? 1;
    const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
    const result = await this.exchangeService.list({
      status: query.status as "pending" | "approved" | "rejected" | "fulfilled" | undefined,
      userId: query.userId,
      page: pageNum,
      pageSize,
    });
    return page(result.items.map(this.toResponse), pageNum, pageSize, result.total);
  }

  @Get("pending-count")
  @RequirePermission("recognition:exchange:approve")
  @ApiOperation({ summary: "待审批兑换数量" })
  @ApiOkResponse({ description: "待审批兑换数量", type: ExchangePendingCountVo })
  async pendingCount() {
    return ok({ count: await this.exchangeService.countPending() });
  }

  @Post("orders")
  @ApiOperation({ summary: "创建兑换订单" })
  @ApiCreatedResponse({ description: "创建成功", type: ExchangeOrderVo })
  async createOrder(@Body() dto: CreateExchangeDto, @CurrentUser() user: AuthPrincipal) {
    return ok(this.toResponse(await this.exchangeService.create(user.userId, dto)));
  }

  @Put("orders/:id/approve")
  @RequirePermission("recognition:exchange:approve")
  @ApiOperation({ summary: "审核通过兑换订单" })
  @ApiParam({ name: "id", description: "主键 id", example: 1 })
  @ApiOkResponse({ description: "操作成功" })
  async approveOrder(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: AuthPrincipal) {
    await this.exchangeService.approve(id, user.userId);
    return ok(undefined);
  }

  @Put("orders/:id/reject")
  @RequirePermission("recognition:exchange:approve")
  @ApiOperation({ summary: "驳回兑换订单" })
  @ApiParam({ name: "id", description: "主键 id", example: 1 })
  @ApiBody({
    description: "驳回入参",
    schema: { type: "object", properties: { reason: { type: "string", description: "驳回原因" } } },
  })
  @ApiOkResponse({ description: "操作成功" })
  async rejectOrder(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: { reason?: string },
    @CurrentUser() user: AuthPrincipal
  ) {
    await this.exchangeService.reject(id, user.userId, body.reason);
    return ok(undefined);
  }

  @Put("orders/:id/fulfill")
  @RequirePermission("recognition:exchange:approve")
  @ApiOperation({ summary: "核销兑换订单" })
  @ApiParam({ name: "id", description: "主键 id", example: 1 })
  @ApiOkResponse({ description: "操作成功" })
  async fulfillOrder(@Param("id", ParseIntPipe) id: number) {
    await this.exchangeService.fulfill(id);
    return ok(undefined);
  }

  @Get("coin-account")
  @ApiOperation({ summary: "查询金币账户" })
  @ApiOkResponse({ description: "金币账户", type: CoinAccountVo })
  async getCoinAccount(@CurrentUser() user: AuthPrincipal) {
    return ok(await this.coinService.getAccount(user.userId));
  }

  @Get("coin-transactions")
  @ApiOperation({ summary: "金币流水分页列表" })
  @ApiQuery({ name: "page", description: "页码", required: false, example: "1" })
  @ApiQuery({ name: "pageSize", description: "每页条数", required: false, example: "20" })
  @ApiOkResponse({ description: "金币流水分页列表", type: CoinTransactionPageVo })
  async listCoinTransactions(
    @Query("page") pageParam?: string,
    @Query("pageSize") pageSize?: string,
    @CurrentUser() user?: AuthPrincipal
  ) {
    const pageNum = Number(pageParam) || 1;
    const pageSizeNum = Number(pageSize) || DEFAULT_PAGE_SIZE;
    const result = await this.coinService.listTransactions(user!.userId, pageNum, pageSizeNum);
    return page(result.items, pageNum, pageSizeNum, result.total);
  }

  @Put("coin-adjust")
  @RequirePermission("recognition:exchange:approve")
  @ApiOperation({ summary: "调整用户金币" })
  @ApiBody({
    description: "金币调整入参",
    schema: {
      type: "object",
      properties: {
        userId: { type: "number", description: "用户 id" },
        amount: { type: "number", description: "调整金额（正数增加 / 负数扣减）" },
        remark: { type: "string", description: "备注" },
      },
      required: ["userId", "amount"],
    },
  })
  @ApiOkResponse({ description: "操作成功" })
  async adjustCoin(
    @Body() body: { userId: number; amount: number; remark?: string },
    @CurrentUser() operator: AuthPrincipal
  ) {
    await this.coinService.adjustBalance(body.userId, body.amount, operator.userId, body.remark);
    return ok(undefined);
  }

  @Get("stamina")
  @ApiOperation({ summary: "查询体力账户" })
  @ApiOkResponse({ description: "体力账户", type: StaminaAccountVo })
  async getStamina(@CurrentUser() user: AuthPrincipal) {
    return ok(await this.staminaService.getAccount(user.userId));
  }

  private toResponse(item: ExchangeOrderItem) {
    return {
      ...item,
      approvedAt: item.approvedAt?.toISOString() ?? null,
      fulfilledAt: item.fulfilledAt?.toISOString() ?? null,
      createdAt: item.createdAt.toISOString(),
    };
  }
}
