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
import { IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { Type } from "class-transformer";
import { RECOGNITION_SERVICE, type RecognitionItem } from "../domain/recognition.ports";
import { RecognitionService } from "../application/recognition.service";
import { ok, page } from "../../../common/response/api-response";
import { Inject } from "@nestjs/common";
import { JwtAuthGuard, PermissionGuard, RequirePermission, CurrentUser, type AuthPrincipal } from "../../auth/index";
import {
  RecognitionLevelVo,
  RecognitionPageVo,
  RecognitionPendingCountVo,
  RecognitionVo,
  ToggleLikeVo,
} from "./recognition.vo";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

class CreateRecognitionDto {
  @ApiProperty({ description: "接收人 id", example: 2 })
  @Type(() => Number)
  @IsInt()
  receiverId!: number;

  @ApiPropertyOptional({ description: "关联徽章 id", example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  badgeId?: number;

  @ApiProperty({ description: "认可内容", example: "感谢你在项目中的大力支持！" })
  @IsString()
  @IsNotEmpty()
  message!: string;
}

class RecognitionQueryDto {
  @ApiPropertyOptional({ description: "认可状态", enum: ["pending", "approved", "rejected"], example: "pending" })
  @IsOptional()
  @IsString()
  status?: "pending" | "approved" | "rejected";

  @ApiPropertyOptional({ description: "接收人 id", example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  receiverId?: number;

  @ApiPropertyOptional({ description: "发送人 id", example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  senderId?: number;

  @ApiPropertyOptional({ description: "页码", example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: "每页条数", example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  pageSize?: number;
}

@ApiTags("认可管理")
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller("recognition")
export class RecognitionController {
  constructor(@Inject(RECOGNITION_SERVICE) private readonly service: RecognitionService) {}

  @Get("feed")
  @ApiOperation({ summary: "认可广场分页列表" })
  @ApiQuery({ name: "page", description: "页码", required: false, example: "1" })
  @ApiQuery({ name: "pageSize", description: "每页条数", required: false, example: "20" })
  @ApiOkResponse({ description: "认可广场分页列表", type: RecognitionPageVo })
  async feed(
    @Query("page") pageParam?: string,
    @Query("pageSize") pageSize?: string,
    @CurrentUser() user?: AuthPrincipal
  ) {
    const pageNum = Number(pageParam) || DEFAULT_PAGE;
    const pageSizeNum = Number(pageSize) || DEFAULT_PAGE_SIZE;
    const result = await this.service.listFeed(pageNum, pageSizeNum, user?.userId);
    return page(result.items.map(this.toResponse), pageNum, pageSizeNum, result.total);
  }

  @Get("pending-count")
  @RequirePermission("recognition:recognition:approve")
  @ApiOperation({ summary: "待审批认可数量" })
  @ApiOkResponse({ description: "待审批认可数量", type: RecognitionPendingCountVo })
  async pendingCount() {
    return ok({ count: await this.service.countPending() });
  }

  @Get()
  @RequirePermission("recognition:recognition:read")
  @ApiOperation({ summary: "认可分页列表" })
  @ApiOkResponse({ description: "认可分页列表", type: RecognitionPageVo })
  async list(@Query() query: RecognitionQueryDto, @CurrentUser() user?: AuthPrincipal) {
    const pageNum = query.page ?? DEFAULT_PAGE;
    const pageSizeNum = query.pageSize ?? DEFAULT_PAGE_SIZE;
    const result = await this.service.list({ ...query, page: pageNum, pageSize: pageSizeNum }, user?.userId);
    return page(result.items.map(this.toResponse), pageNum, pageSizeNum, result.total);
  }

  @Post()
  @ApiOperation({ summary: "发起认可" })
  @ApiCreatedResponse({ description: "创建成功", type: RecognitionVo })
  async create(@Body() dto: CreateRecognitionDto, @CurrentUser() user: AuthPrincipal) {
    return ok(this.toResponse(await this.service.create(user.userId, dto)));
  }

  @Put(":id/approve")
  @RequirePermission("recognition:recognition:approve")
  @ApiOperation({ summary: "审核通过认可" })
  @ApiParam({ name: "id", description: "主键 id", example: 1 })
  @ApiOkResponse({ description: "操作成功" })
  async approve(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: AuthPrincipal) {
    await this.service.approve(id, user.userId);
    return ok(undefined);
  }

  @Put(":id/reject")
  @RequirePermission("recognition:recognition:approve")
  @ApiOperation({ summary: "驳回认可" })
  @ApiParam({ name: "id", description: "主键 id", example: 1 })
  @ApiBody({
    description: "驳回入参",
    schema: { type: "object", properties: { reason: { type: "string", description: "驳回原因" } } },
  })
  @ApiOkResponse({ description: "操作成功" })
  async reject(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: { reason?: string },
    @CurrentUser() user: AuthPrincipal
  ) {
    await this.service.reject(id, user.userId, body.reason);
    return ok(undefined);
  }

  @Put(":id/pin")
  @RequirePermission("recognition:recognition:approve")
  @ApiOperation({ summary: "切换认可置顶" })
  @ApiParam({ name: "id", description: "主键 id", example: 1 })
  @ApiOkResponse({ description: "操作成功" })
  async togglePin(@Param("id", ParseIntPipe) id: number) {
    await this.service.togglePin(id);
    return ok(undefined);
  }

  @Post(":id/like")
  @ApiOperation({ summary: "点赞 / 取消点赞认可" })
  @ApiParam({ name: "id", description: "主键 id", example: 1 })
  @ApiCreatedResponse({ description: "操作成功", type: ToggleLikeVo })
  async toggleLike(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: AuthPrincipal) {
    const liked = await this.service.toggleLike(id, user.userId);
    return ok({ liked });
  }

  @Get("level")
  @ApiOperation({ summary: "查询用户认可等级" })
  @ApiOkResponse({ description: "认可等级", type: RecognitionLevelVo })
  async getLevel(@CurrentUser() user: AuthPrincipal) {
    return ok(await this.service.getLevel(user.userId));
  }

  private toResponse(item: RecognitionItem) {
    return {
      ...item,
      approvedAt: item.approvedAt?.toISOString() ?? null,
      createdAt: item.createdAt.toISOString(),
    };
  }
}
