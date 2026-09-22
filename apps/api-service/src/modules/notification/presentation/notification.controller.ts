import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from "@nestjs/common";
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { Type } from "class-transformer";
import { NOTIFICATION_SERVICE, type NotificationItem } from "../domain/notification.ports";
import { NotificationService } from "../application/notification.service";
import { ok, page } from "../../../common/response/api-response";
import { Inject } from "@nestjs/common";
import { JwtAuthGuard, PermissionGuard, RequirePermission, CurrentUser, type AuthPrincipal } from "../../auth/index";
import { NotificationPageVo, NotificationVo, UnreadCountVo } from "./notification.vo";

const DEFAULT_PAGE_SIZE = 20;

class CreateNotificationDto {
  @ApiPropertyOptional({ description: "接收用户 id", example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userId?: number;

  @ApiProperty({ description: "消息标题", example: "系统通知" })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ description: "消息内容", example: "您有一条新的系统通知" })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiPropertyOptional({ description: "消息类型", example: "system" })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: "发送渠道", example: "in-app" })
  @IsOptional()
  @IsString()
  channel?: string;
}

class NotificationQueryDto {
  @ApiPropertyOptional({ description: "消息状态", example: "unread" })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: "页码", example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: "每页条数", example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  pageSize?: number;
}

@ApiTags("消息通知")
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller("notifications")
export class NotificationController {
  constructor(
    @Inject(NOTIFICATION_SERVICE)
    private readonly service: NotificationService
  ) {}

  @Get()
  @RequirePermission("notification:record:read")
  @ApiOperation({ summary: "消息分页列表" })
  @ApiOkResponse({ description: "当前用户消息分页列表", type: NotificationPageVo })
  async list(@Query() query: NotificationQueryDto, @CurrentUser() user: AuthPrincipal) {
    const pageNum = query.page ?? 1;
    const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
    const result = await this.service.listByUser(Number(user.userId), {
      status: query.status,
      page: pageNum,
      pageSize,
    });
    return page(result.items.map(this.toResponse), pageNum, pageSize, result.total);
  }

  @Get("unread-count")
  @RequirePermission("notification:record:read")
  @ApiOperation({ summary: "未读消息数" })
  @ApiOkResponse({ description: "当前用户未读消息数", type: UnreadCountVo })
  async unreadCount(@CurrentUser() user: AuthPrincipal) {
    const count = await this.service.countUnread(Number(user.userId));
    return ok({ count });
  }

  @Post()
  @RequirePermission("notification:record:create")
  @ApiOperation({ summary: "创建消息" })
  @ApiCreatedResponse({ description: "创建成功", type: NotificationVo })
  async create(@Body() dto: CreateNotificationDto) {
    const item = await this.service.create(dto);
    return ok(this.toResponse(item));
  }

  @Put(":id/read")
  @RequirePermission("notification:record:update")
  @ApiOperation({ summary: "标记消息已读" })
  @ApiParam({ name: "id", description: "主键 id", example: 1 })
  @ApiOkResponse({ description: "标记成功" })
  async markRead(@Param("id", ParseIntPipe) id: number) {
    await this.service.markRead(id);
    return ok(undefined);
  }

  @Put("read-all")
  @RequirePermission("notification:record:update")
  @ApiOperation({ summary: "全部标记已读" })
  @ApiOkResponse({ description: "标记成功" })
  async markAllRead(@CurrentUser() user: AuthPrincipal) {
    await this.service.markAllRead(Number(user.userId));
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
