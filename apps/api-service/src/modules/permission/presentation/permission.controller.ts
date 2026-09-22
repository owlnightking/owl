import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from "@nestjs/common";
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { PERMISSION_SERVICE, type PermissionItem } from "../domain/permission.ports";
import { PermissionService } from "../application/permission.service";
import { ok } from "../../../common/response/api-response";
import { Inject } from "@nestjs/common";
import { JwtAuthGuard, PermissionGuard, RequirePermission } from "../../auth/index";
import { PermissionVo } from "./permission.vo";

class CreatePermissionDto {
  @ApiProperty({ description: "权限编码", example: "system:permission:read" })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ description: "权限名称", example: "查看权限" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ description: "资源", example: "permission" })
  @IsString()
  @IsNotEmpty()
  resource!: string;

  @ApiProperty({ description: "操作", example: "read" })
  @IsString()
  @IsNotEmpty()
  action!: string;

  @ApiPropertyOptional({ description: "权限描述", example: "查看权限列表与详情" })
  @IsOptional()
  @IsString()
  description?: string;
}

class UpdatePermissionDto {
  @ApiPropertyOptional({ description: "权限名称", example: "查看权限" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: "资源", example: "permission" })
  @IsOptional()
  @IsString()
  resource?: string;

  @ApiPropertyOptional({ description: "操作", example: "read" })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({ description: "权限描述", example: "查看权限列表与详情" })
  @IsOptional()
  @IsString()
  description?: string;
}

@ApiTags("权限管理")
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller("permissions")
export class PermissionController {
  constructor(
    @Inject(PERMISSION_SERVICE)
    private readonly service: PermissionService
  ) {}

  @Get()
  @RequirePermission("system:permission:read")
  @ApiOperation({ summary: "权限列表" })
  @ApiOkResponse({ description: "权限列表", type: [PermissionVo] })
  async list() {
    const items = await this.service.list();
    return ok(items.map(this.toResponse));
  }

  @Get(":id")
  @RequirePermission("system:permission:read")
  @ApiOperation({ summary: "权限详情" })
  @ApiParam({ name: "id", description: "主键 id", example: 1 })
  @ApiOkResponse({ description: "权限详情", type: PermissionVo })
  async findById(@Param("id", ParseIntPipe) id: number) {
    const item = await this.service.findById(id);
    return ok(this.toResponse(item));
  }

  @Post()
  @RequirePermission("system:permission:create")
  @ApiOperation({ summary: "新建权限" })
  @ApiCreatedResponse({ description: "新建成功", type: PermissionVo })
  async create(@Body() dto: CreatePermissionDto) {
    const item = await this.service.create(dto);
    return ok(this.toResponse(item));
  }

  @Put(":id")
  @RequirePermission("system:permission:update")
  @ApiOperation({ summary: "编辑权限" })
  @ApiParam({ name: "id", description: "主键 id", example: 1 })
  @ApiOkResponse({ description: "编辑成功", type: PermissionVo })
  async update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdatePermissionDto) {
    const item = await this.service.update(id, dto);
    return ok(this.toResponse(item));
  }

  @Delete(":id")
  @RequirePermission("system:permission:delete")
  @ApiOperation({ summary: "删除权限" })
  @ApiParam({ name: "id", description: "主键 id", example: 1 })
  @ApiOkResponse({ description: "删除成功" })
  async remove(@Param("id", ParseIntPipe) id: number) {
    await this.service.delete(id);
    return ok(undefined);
  }

  private toResponse(item: PermissionItem) {
    return {
      id: item.id,
      code: item.code,
      name: item.name,
      resource: item.resource,
      action: item.action,
      description: item.description,
      createdAt: item.createdAt.toISOString(),
    };
  }
}
