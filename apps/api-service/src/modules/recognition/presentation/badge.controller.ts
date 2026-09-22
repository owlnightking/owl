import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from "@nestjs/common";
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from "class-validator";
import { BADGE_SERVICE, type BadgeItem } from "../domain/badge.ports";
import { BadgeService } from "../application/badge.service";
import { ok, page } from "../../../common/response/api-response";
import { Inject } from "@nestjs/common";
import { JwtAuthGuard, PermissionGuard, RequirePermission } from "../../auth/index";
import { BadgePageVo, BadgeVo } from "./badge.vo";

class CreateBadgeDto {
  @ApiProperty({ description: "徽章名称", example: "团队之星" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ description: "徽章图标", example: "https://example.com/icon.png" })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ description: "徽章描述", example: "表彰团队协作突出贡献" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: "金币奖励", example: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  coinReward?: number;

  @ApiPropertyOptional({ description: "经验奖励", example: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  expReward?: number;

  @ApiPropertyOptional({ description: "是否启用", example: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ description: "排序值", example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}

class UpdateBadgeDto {
  @ApiPropertyOptional({ description: "徽章名称", example: "团队之星" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: "徽章图标", example: "https://example.com/icon.png" })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ description: "徽章描述", example: "表彰团队协作突出贡献" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: "金币奖励", example: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  coinReward?: number;

  @ApiPropertyOptional({ description: "经验奖励", example: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  expReward?: number;

  @ApiPropertyOptional({ description: "是否启用", example: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ description: "排序值", example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}

class ListBadgesQueryDto {
  @ApiPropertyOptional({ description: "徽章名称关键字", example: "团队" })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: "页码", example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ description: "每页条数", example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 10;
}

@ApiTags("徽章管理")
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller("recognition/badges")
export class BadgeController {
  constructor(@Inject(BADGE_SERVICE) private readonly service: BadgeService) {}

  @Get()
  @RequirePermission("recognition:badge:read")
  @ApiOperation({ summary: "徽章分页列表" })
  @ApiOkResponse({ description: "徽章分页列表", type: BadgePageVo })
  async list(@Query() query: ListBadgesQueryDto) {
    const { items, total } = await this.service.list(query);
    return page(items.map(this.toResponse), query.page, query.pageSize, total);
  }

  @Get("options")
  @RequirePermission("recognition:badge:read")
  @ApiOperation({ summary: "徽章下拉选项（不分页）" })
  @ApiOkResponse({ description: "徽章下拉选项", type: [BadgeVo] })
  async options() {
    return ok((await this.service.listOptions()).map(this.toResponse));
  }

  @Get(":id")
  @RequirePermission("recognition:badge:read")
  @ApiOperation({ summary: "徽章详情" })
  @ApiParam({ name: "id", description: "主键 id", example: 1 })
  @ApiOkResponse({ description: "徽章详情", type: BadgeVo })
  async findById(@Param("id", ParseIntPipe) id: number) {
    return ok(this.toResponse(await this.service.findById(id)));
  }

  @Post()
  @RequirePermission("recognition:badge:write")
  @ApiOperation({ summary: "新建徽章" })
  @ApiCreatedResponse({ description: "创建成功", type: BadgeVo })
  async create(@Body() dto: CreateBadgeDto) {
    return ok(this.toResponse(await this.service.create(dto)));
  }

  @Put(":id")
  @RequirePermission("recognition:badge:write")
  @ApiOperation({ summary: "更新徽章" })
  @ApiParam({ name: "id", description: "主键 id", example: 1 })
  @ApiOkResponse({ description: "更新成功", type: BadgeVo })
  async update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateBadgeDto) {
    return ok(this.toResponse(await this.service.update(id, dto)));
  }

  @Delete(":id")
  @RequirePermission("recognition:badge:write")
  @ApiOperation({ summary: "删除徽章" })
  @ApiParam({ name: "id", description: "主键 id", example: 1 })
  @ApiOkResponse({ description: "删除成功" })
  async remove(@Param("id", ParseIntPipe) id: number) {
    await this.service.delete(id);
    return ok(undefined);
  }

  private toResponse(item: BadgeItem) {
    return { ...item, createdAt: item.createdAt.toISOString() };
  }
}
