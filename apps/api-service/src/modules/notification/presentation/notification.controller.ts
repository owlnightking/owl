import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { Type } from "class-transformer";
import { NOTIFICATION_SERVICE, type NotificationItem } from "../domain/notification.ports";
import { NotificationUseCase } from "../application/notification.use-case";
import { ok } from "../../../common/response/api-response";
import { Inject } from "@nestjs/common";
import { JwtAuthGuard, PermissionGuard, RequirePermission } from "../../auth/index";

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
  async list(@Query() query: NotificationQueryDto, @Inject("CURRENT_USER_ID") userId?: string) {
    const result = await this.service.listByUser(userId ?? "", {
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
  async unreadCount(@Inject("CURRENT_USER_ID") userId?: string) {
    const count = await this.service.countUnread(userId ?? "");
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
  async markAllRead(@Inject("CURRENT_USER_ID") userId?: string) {
    await this.service.markAllRead(userId ?? "");
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
