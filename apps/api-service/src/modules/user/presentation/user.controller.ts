import { Body, Controller, Get, Inject, Param, ParseIntPipe, Put, Query, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiOkResponse, ApiProperty, ApiPropertyOptional, ApiTags } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { ok, page } from "../../../common/response/api-response";
import { JwtAuthGuard, PermissionGuard, RequirePermission } from "../../auth/index";
import { USER_SERVICE, type UserServicePort } from "../application/user.service";
import { RoleOptionVo, UserPageVo, UserRoleVo } from "./user.vo";

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
  @Max(100)
  pageSize: number = 20;
}

class AssignRolesDto {
  @ApiProperty({ description: "角色 id 列表", type: [Number], example: [1, 2] })
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  roleIds!: number[];
}

class UpdateStatusDto {
  @ApiProperty({ description: "用户状态", enum: ["active", "disabled"], example: "disabled" })
  @IsIn(["active", "disabled"])
  status!: "active" | "disabled";
}

@ApiTags("用户管理")
@Controller("users")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class UserController {
  constructor(@Inject(USER_SERVICE) private readonly userService: UserServicePort) {}

  @Get()
  @RequirePermission("user:read")
  @ApiOperation({ summary: "用户分页列表" })
  @ApiOkResponse({ description: "用户分页列表", type: UserPageVo })
  async list(@Query() query: ListUsersQueryDto) {
    const { items, total } = await this.userService.list(query);
    return page(items, query.page, query.pageSize, total);
  }

  @Get("roles")
  @RequirePermission("role:read")
  @ApiOperation({ summary: "角色下拉选项" })
  @ApiOkResponse({ description: "角色下拉选项", type: [RoleOptionVo] })
  async listRoles() {
    const items = await this.userService.listRoles();
    return ok(items);
  }

  @Get(":id/roles")
  @RequirePermission("user:read")
  @ApiOperation({ summary: "查询用户已绑定角色" })
  @ApiParam({ name: "id", description: "用户 id", example: 1 })
  @ApiOkResponse({ description: "用户角色列表", type: [UserRoleVo] })
  async getUserRoles(@Param("id", ParseIntPipe) id: number) {
    const items = await this.userService.getUserRoles(id);
    return ok(items);
  }

  @Put(":id/roles")
  @RequirePermission("user:write")
  @ApiOperation({ summary: "分配用户角色" })
  @ApiParam({ name: "id", description: "用户 id", example: 1 })
  @ApiOkResponse({ description: "分配成功" })
  async assignRoles(@Param("id", ParseIntPipe) id: number, @Body() dto: AssignRolesDto) {
    await this.userService.assignRoles(id, dto.roleIds);
    return ok(null, "roles updated");
  }

  @Put(":id/status")
  @RequirePermission("user:write")
  @ApiOperation({ summary: "启停用用户" })
  @ApiParam({ name: "id", description: "用户 id", example: 1 })
  @ApiOkResponse({ description: "更新成功" })
  async updateStatus(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateStatusDto) {
    await this.userService.updateStatus(id, dto.status);
    return ok(null, "status updated");
  }
}
