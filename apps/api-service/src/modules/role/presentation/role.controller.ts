import { Body, Controller, Delete, Get, Inject, Param, ParseIntPipe, Post, Put, UseGuards } from "@nestjs/common";
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
import { IsArray, IsInt, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { ok } from "../../../common/response/api-response";
import { JwtAuthGuard, PermissionGuard, RequirePermission } from "../../auth/index";
import { ROLE_SERVICE, type RoleServicePort } from "../domain/role.ports";
import { RolePermissionVo, RoleVo } from "./role.vo";

class CreateRoleDto {
  @ApiProperty({ description: "角色编码", example: "operator" })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  code!: string;

  @ApiProperty({ description: "角色名称", example: "运营人员" })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name!: string;

  @ApiPropertyOptional({ description: "角色描述", example: "负责日常运营操作" })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @ApiProperty({ description: "权限 id 列表", type: [Number], example: [1, 2] })
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  permissionIds!: number[];
}

class UpdateRoleDto {
  @ApiPropertyOptional({ description: "角色名称", example: "运营人员" })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({ description: "角色描述", example: "负责日常运营操作" })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @ApiPropertyOptional({ description: "权限 id 列表", type: [Number], example: [1, 2] })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  permissionIds?: number[];
}

@ApiTags("角色管理")
@Controller("roles")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class RoleController {
  constructor(@Inject(ROLE_SERVICE) private readonly roleService: RoleServicePort) {}

  @Get()
  @RequirePermission("role:read")
  @ApiOperation({ summary: "角色列表" })
  @ApiOkResponse({ description: "角色列表", type: [RoleVo] })
  async list() {
    const items = await this.roleService.list();
    return ok(items);
  }

  @Get("permissions")
  @RequirePermission("role:read")
  @ApiOperation({ summary: "权限下拉选项" })
  @ApiOkResponse({ description: "权限列表", type: [RolePermissionVo] })
  async permissions() {
    const items = await this.roleService.listPermissions();
    return ok(items);
  }

  @Post()
  @RequirePermission("role:write")
  @ApiOperation({ summary: "新建角色" })
  @ApiCreatedResponse({ description: "新建成功", type: RoleVo })
  async create(@Body() dto: CreateRoleDto) {
    const role = await this.roleService.create(dto);
    return ok(role);
  }

  @Put(":id")
  @RequirePermission("role:write")
  @ApiOperation({ summary: "编辑角色" })
  @ApiParam({ name: "id", description: "主键 id", example: 1 })
  @ApiOkResponse({ description: "编辑成功", type: RoleVo })
  async update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateRoleDto) {
    const role = await this.roleService.update(id, dto);
    return ok(role);
  }

  @Delete(":id")
  @RequirePermission("role:write")
  @ApiOperation({ summary: "删除角色" })
  @ApiParam({ name: "id", description: "主键 id", example: 1 })
  @ApiOkResponse({ description: "删除成功" })
  async delete(@Param("id", ParseIntPipe) id: number) {
    await this.roleService.delete(id);
    return ok(null, "deleted");
  }
}
