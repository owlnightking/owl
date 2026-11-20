import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
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
import { IsArray, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength } from "class-validator";
import { ok, page } from "../../../common/response/api-response";
import { JwtAuthGuard, PermissionGuard, RequirePermission } from "../../auth/index";
import { USER_GROUP_SERVICE, type UserGroupServicePort } from "../domain/user-group.ports";
import { UserGroupMemberPageVo, UserGroupPageVo, UserGroupRoleVo, UserGroupVo } from "./user-group.vo";

const USER_GROUP_CODE_PATTERN = /^[a-z][a-z0-9_]{1,49}$/;

class ListUserGroupsQueryDto {
  @ApiPropertyOptional({ description: "编码 / 名称关键字", example: "全员" })
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

class ListMembersQueryDto {
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

class CreateUserGroupDto {
  @ApiProperty({ description: "用户组编码（小写字母/数字/下划线）", example: "finance" })
  @IsString()
  @Matches(USER_GROUP_CODE_PATTERN, { message: "编码须以小写字母开头，仅含小写字母/数字/下划线" })
  code!: string;

  @ApiProperty({ description: "用户组名称", example: "财务组" })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name!: string;

  @ApiPropertyOptional({ description: "用户组说明", example: "财务部同事" })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;
}

class UpdateUserGroupDto {
  @ApiPropertyOptional({ description: "用户组名称", example: "财务组" })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({ description: "用户组说明", example: "财务部同事" })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;
}

class SetMembersDto {
  @ApiProperty({ description: "成员用户 id 全量列表", type: [Number], example: [1, 2] })
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  userIds!: number[];
}

class SetRolesDto {
  @ApiProperty({ description: "角色 id 全量列表", type: [Number], example: [1, 2] })
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  roleIds!: number[];
}

@ApiTags("用户组")
@Controller("user-groups")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class UserGroupController {
  constructor(@Inject(USER_GROUP_SERVICE) private readonly service: UserGroupServicePort) {}

  @Get()
  @RequirePermission("system:user-group:read")
  @ApiOperation({ summary: "用户组分页列表" })
  @ApiOkResponse({ description: "用户组分页列表", type: UserGroupPageVo })
  async list(@Query() query: ListUserGroupsQueryDto) {
    const { items, total } = await this.service.list(query);
    return page(items, query.page, query.pageSize, total);
  }

  @Get("options")
  @RequirePermission("system:user-group:read")
  @ApiOperation({ summary: "用户组下拉选项" })
  @ApiOkResponse({ description: "用户组列表", type: [UserGroupVo] })
  async options() {
    return ok(await this.service.listOptions());
  }

  @Get(":id/members")
  @RequirePermission("system:user-group:read")
  @ApiOperation({ summary: "用户组成员列表" })
  @ApiParam({ name: "id", description: "用户组 id", example: 1 })
  @ApiOkResponse({ description: "成员分页列表", type: UserGroupMemberPageVo })
  async members(@Param("id", ParseIntPipe) id: number, @Query() query: ListMembersQueryDto) {
    const { items, total } = await this.service.listMembers(id, query);
    return page(items, query.page, query.pageSize, total);
  }

  @Put(":id/members")
  @RequirePermission("system:user-group:member")
  @ApiOperation({ summary: "全量设置用户组成员" })
  @ApiParam({ name: "id", description: "用户组 id", example: 1 })
  @ApiOkResponse({
    description: "设置结果",
    schema: { example: { code: 200, data: { count: 3 }, message: "success" } },
  })
  async setMembers(@Param("id", ParseIntPipe) id: number, @Body() dto: SetMembersDto) {
    return ok(await this.service.setMembers(id, dto.userIds));
  }

  @Put(":id/roles")
  @RequirePermission("system:user-group:update")
  @ApiOperation({ summary: "全量设置用户组绑定的角色" })
  @ApiParam({ name: "id", description: "用户组 id", example: 1 })
  @ApiOkResponse({ description: "角色列表", type: [UserGroupRoleVo] })
  async setRoles(@Param("id", ParseIntPipe) id: number, @Body() dto: SetRolesDto) {
    return ok(await this.service.setRoles(id, dto.roleIds));
  }

  @Post()
  @RequirePermission("system:user-group:create")
  @ApiOperation({ summary: "新建用户组" })
  @ApiCreatedResponse({ description: "新建成功", type: UserGroupVo })
  async create(@Body() dto: CreateUserGroupDto) {
    return ok(await this.service.create(dto));
  }

  @Put(":id")
  @RequirePermission("system:user-group:update")
  @ApiOperation({ summary: "编辑用户组" })
  @ApiParam({ name: "id", description: "用户组 id", example: 1 })
  @ApiOkResponse({ description: "编辑成功", type: UserGroupVo })
  async update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateUserGroupDto) {
    return ok(await this.service.update(id, dto));
  }

  @Delete(":id")
  @RequirePermission("system:user-group:delete")
  @ApiOperation({ summary: "删除用户组" })
  @ApiParam({ name: "id", description: "用户组 id", example: 1 })
  @ApiOkResponse({ description: "删除成功" })
  async remove(@Param("id", ParseIntPipe) id: number) {
    await this.service.delete(id);
    return ok(null, "deleted");
  }
}
