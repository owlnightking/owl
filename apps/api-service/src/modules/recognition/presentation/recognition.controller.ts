import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { Type } from "class-transformer";
import { RECOGNITION_SERVICE, type RecognitionItem } from "../domain/recognition.ports";
import { RecognitionUseCase } from "../application/recognition.use-case";
import { ok } from "../../../common/response/api-response";
import { Inject } from "@nestjs/common";
import { JwtAuthGuard, PermissionGuard, RequirePermission, CurrentUser, type AuthPrincipal } from "../../auth/index";
import { DATABASE_CLIENT } from "@owl/database/provider";
import type { PrismaClient } from "@owl/database";

class CreateRecognitionDto {
  @IsString() @IsNotEmpty() receiverId!: string;
  @IsOptional() @IsString() badgeId?: string;
  @IsString() @IsNotEmpty() message!: string;
}

class RecognitionQueryDto {
  @IsOptional() @IsString() status?: "pending" | "approved" | "rejected";
  @IsOptional() @IsString() receiverId?: string;
  @IsOptional() @IsString() senderId?: string;
  @IsOptional() @Type(() => Number) page?: number;
  @IsOptional() @Type(() => Number) pageSize?: number;
}

@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller("recognition")
export class RecognitionController {
  constructor(
    @Inject(RECOGNITION_SERVICE) private readonly service: RecognitionUseCase,
    @Inject(DATABASE_CLIENT) private readonly prisma: PrismaClient
  ) {}

  @Get("feed")
  async feed(@Query("page") page?: string, @Query("pageSize") pageSize?: string, @CurrentUser() user?: AuthPrincipal) {
    const result = await this.service.listFeed(Number(page) || 1, Number(pageSize) || 20, user?.userId);
    return ok({ items: result.items.map(this.toResponse), total: result.total });
  }

  @Get("pending-count")
  @RequirePermission("recognition:recognition:approve")
  async pendingCount() {
    return ok({ count: await this.service.countPending() });
  }

  @Get()
  @RequirePermission("recognition:recognition:read")
  async list(@Query() query: RecognitionQueryDto, @CurrentUser() user?: AuthPrincipal) {
    const result = await this.service.list(
      { ...query, page: query.page ?? 1, pageSize: query.pageSize ?? 20 },
      user?.userId
    );
    return ok({ items: result.items.map(this.toResponse), total: result.total });
  }

  @Post()
  async create(@Body() dto: CreateRecognitionDto, @CurrentUser() user: AuthPrincipal) {
    return ok(this.toResponse(await this.service.create(user.userId, dto)));
  }

  @Put(":id/approve")
  @RequirePermission("recognition:recognition:approve")
  async approve(@Param("id") id: string, @CurrentUser() user: AuthPrincipal) {
    await this.service.approve(id, user.userId);
    return ok(undefined);
  }

  @Put(":id/reject")
  @RequirePermission("recognition:recognition:approve")
  async reject(@Param("id") id: string, @Body() body: { reason?: string }, @CurrentUser() user: AuthPrincipal) {
    await this.service.reject(id, user.userId, body.reason);
    return ok(undefined);
  }

  @Put(":id/pin")
  @RequirePermission("recognition:recognition:approve")
  async togglePin(@Param("id") id: string) {
    await this.service.togglePin(id);
    return ok(undefined);
  }

  @Post(":id/like")
  async toggleLike(@Param("id") id: string, @CurrentUser() user: AuthPrincipal) {
    const liked = await this.service.toggleLike(id, user.userId);
    return ok({ liked });
  }

  @Get("level")
  async getLevel(@CurrentUser() user: AuthPrincipal) {
    const userId = user.userId;
    const u = await this.prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } });
    if (!u) return ok({ level: 1, exp: 0, nextLevelExp: 1000 });

    const now = new Date();
    const years = now.getFullYear() - u.createdAt.getFullYear();
    const level = Math.max(1, years);

    const account = await this.prisma.coinAccount.findUnique({ where: { userId }, select: { id: true } });
    let exp = 0;
    if (account) {
      const expResult = await this.prisma.coinTransaction.aggregate({
        where: { accountId: account.id, source: "recognition" },
        _sum: { amount: true },
      });
      exp = Math.max(0, expResult._sum?.amount ?? 0);
    }

    const nextLevelExp = level * 1000;

    return ok({ level, exp, nextLevelExp });
  }

  private toResponse(item: RecognitionItem) {
    return {
      ...item,
      approvedAt: item.approvedAt?.toISOString() ?? null,
      createdAt: item.createdAt.toISOString(),
    };
  }
}
