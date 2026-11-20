import { Body, Controller, Get, Inject, Param, ParseIntPipe, Put, Query, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiParam, ApiProperty, ApiPropertyOptional, ApiTags } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { ok, page } from "../../../common/response/api-response";
import { JwtAuthGuard, PermissionGuard, RequirePermission } from "../../auth/index";
import { USER_SERVICE, type UserServicePort } from "../application/user.service";
import { UserGroupBriefVo, UserPageVo } from "./user.vo";

class ListUsersQueryDto {
  @ApiPropertyOptional({ description: "姓名 / 邮箱关键字", example: "张三" })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: "页码", example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ description: "每页条数", example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  pageSize: number = 20;
}

class UpdateStatusDto {
  @ApiProperty({ description: "状态", enum: ["active", "disabled"], example: "disabled" })
  @IsIn(["active", "disabled"])
  status!: "active" | "disabled";
}

@ApiTags("用户管理")
@Controller("users")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class UserController {
  constructor(@Inject(USER_SERVICE) private readonly userService: UserServicePort) {}

  @Get()
  @RequirePermission("system:user:read")
  @ApiOperation({ summary: "用户分页列表（来自飞书通讯录）" })
  @ApiOkResponse({ description: "用户分页列表", type: UserPageVo })
  async list(@Query() query: ListUsersQueryDto) {
    const { items, total } = await this.userService.list(query);
    return page(items, query.page, query.pageSize, total);
  }

  @Get("groups")
  @RequirePermission("system:user:read")
  @ApiOperation({ summary: "用户组下拉选项（用户列表筛选用）" })
  @ApiOkResponse({ description: "用户组列表", type: [UserGroupBriefVo] })
  async groups() {
    return ok(await this.userService.listGroups());
  }

  @Put(":id/status")
  @RequirePermission("system:user:write")
  @ApiOperation({ summary: "启用 / 停用用户" })
  @ApiParam({ name: "id", description: "用户 id", example: 1 })
  @ApiOkResponse({ description: "更新成功" })
  async updateStatus(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateStatusDto) {
    await this.userService.updateStatus(id, dto.status);
    return ok(null, "status updated");
  }
}
