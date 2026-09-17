import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { Type } from "class-transformer";
import { NOTIFICATION_SERVICE, type NotificationItem } from "../domain/notification.ports";
import { NotificationUseCase } from "../application/notification.use-case";
import { ok } from "../../../common/response/api-response";
import { Inject } from "@nestjs/common";
import { JwtAuthGuard, PermissionGuard, RequirePermission, CurrentUser, type AuthPrincipal } from "../../auth/index";

const DEFAULT_PAGE_SIZE = 20;

class CreateNotificationDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  channel?: string;
}

class NotificationQueryDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  pageSize?: number;
}

@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller("notifications")
export class NotificationController {
  constructor(
    @Inject(NOTIFICATION_SERVICE)
    private readonly service: NotificationUseCase
  ) {}

  @Get()
  @RequirePermission("notification:record:read")
  async list(@Query() query: NotificationQueryDto, @CurrentUser() user: AuthPrincipal) {
    const result = await this.service.listByUser(user.userId, {
      status: query.status,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? DEFAULT_PAGE_SIZE,
    });
    return ok({
      items: result.items.map(this.toResponse),
      total: result.total,
    });
  }

  @Get("unread-count")
  @RequirePermission("notification:record:read")
  async unreadCount(@CurrentUser() user: AuthPrincipal) {
    const count = await this.service.countUnread(user.userId);
    return ok({ count });
  }

  @Post()
  @RequirePermission("notification:record:create")
  async create(@Body() dto: CreateNotificationDto) {
    const item = await this.service.create(dto);
    return ok(this.toResponse(item));
  }

  @Put(":id/read")
  @RequirePermission("notification:record:update")
  async markRead(@Param("id") id: string) {
    await this.service.markRead(id);
    return ok(undefined);
  }

  @Put("read-all")
  @RequirePermission("notification:record:update")
  async markAllRead(@CurrentUser() user: AuthPrincipal) {
    await this.service.markAllRead(user.userId);
    return ok(undefined);
  }

  private toResponse(item: NotificationItem) {
    return {
      id: item.id,
      userId: item.userId,
      title: item.title,
      content: item.content,
      type: item.type,
      channel: item.channel,
      status: item.status,
      sentAt: item.sentAt?.toISOString() ?? null,
      createdAt: item.createdAt.toISOString(),
    };
  }
}
