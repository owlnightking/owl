import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { Type } from "class-transformer";
import { EXCHANGE_SERVICE, type ExchangeOrderItem } from "../domain/exchange.ports";
import { COIN_SERVICE } from "../domain/coin.ports";
import { STAMINA_SERVICE } from "../domain/stamina.ports";

const DEFAULT_PAGE_SIZE = 20;
import { ExchangeUseCase } from "../application/exchange.use-case";
import { CoinUseCase } from "../application/coin.use-case";
import { StaminaUseCase } from "../application/stamina.use-case";
import { ok } from "../../../common/response/api-response";
import { Inject } from "@nestjs/common";
import { JwtAuthGuard, PermissionGuard, RequirePermission } from "../../auth/index";

class CreateExchangeDto {
  @IsString() @IsNotEmpty() productId!: string;
  @IsOptional() quantity?: number;
}

class ExchangeQueryDto {
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() userId?: string;
  @IsOptional() @Type(() => Number) page?: number;
  @IsOptional() @Type(() => Number) pageSize?: number;
}

@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller("recognition/exchange")
export class ExchangeController {
  constructor(
    @Inject(EXCHANGE_SERVICE) private readonly exchangeService: ExchangeUseCase,
    @Inject(COIN_SERVICE) private readonly coinService: CoinUseCase,
    @Inject(STAMINA_SERVICE) private readonly staminaService: StaminaUseCase
  ) {}

  @Get("orders")
  @RequirePermission("recognition:exchange:read")
  async listOrders(@Query() query: ExchangeQueryDto) {
    const result = await this.exchangeService.list({
      status: query.status as "pending" | "approved" | "rejected" | "fulfilled" | undefined,
      userId: query.userId,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? DEFAULT_PAGE_SIZE,
    });
    return ok({ items: result.items.map(this.toResponse), total: result.total });
  }

  @Get("pending-count")
  @RequirePermission("recognition:exchange:approve")
  async pendingCount() {
    return ok({ count: await this.exchangeService.countPending() });
  }

  @Post("orders")
  async createOrder(@Body() dto: CreateExchangeDto, @Inject("CURRENT_USER_ID") userId?: string) {
    return ok(this.toResponse(await this.exchangeService.create(userId!, dto)));
  }

  @Put("orders/:id/approve")
  @RequirePermission("recognition:exchange:approve")
  async approveOrder(@Param("id") id: string, @Inject("CURRENT_USER_ID") userId?: string) {
    await this.exchangeService.approve(id, userId!);
    return ok(undefined);
  }

  @Put("orders/:id/reject")
  @RequirePermission("recognition:exchange:approve")
  async rejectOrder(
    @Param("id") id: string,
    @Body() body: { reason?: string },
    @Inject("CURRENT_USER_ID") userId?: string
  ) {
    await this.exchangeService.reject(id, userId!, body.reason);
    return ok(undefined);
  }

  @Put("orders/:id/fulfill")
  @RequirePermission("recognition:exchange:approve")
  async fulfillOrder(@Param("id") id: string) {
    await this.exchangeService.fulfill(id);
    return ok(undefined);
  }

  @Get("coin-account")
  async getCoinAccount(@Inject("CURRENT_USER_ID") userId?: string) {
    return ok(await this.coinService.getAccount(userId!));
  }

  @Get("coin-transactions")
  async listCoinTransactions(
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @Inject("CURRENT_USER_ID") userId?: string
  ) {
    return ok(
      await this.coinService.listTransactions(userId!, Number(page) || 1, Number(pageSize) || DEFAULT_PAGE_SIZE)
    );
  }

  @Put("coin-adjust")
  @RequirePermission("recognition:exchange:approve")
  async adjustCoin(
    @Body() body: { userId: string; amount: number; remark?: string },
    @Inject("CURRENT_USER_ID") operatorId?: string
  ) {
    await this.coinService.adjustBalance(body.userId, body.amount, operatorId!, body.remark);
    return ok(undefined);
  }

  @Get("stamina")
  async getStamina(@Inject("CURRENT_USER_ID") userId?: string) {
    return ok(await this.staminaService.getAccount(userId!));
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
