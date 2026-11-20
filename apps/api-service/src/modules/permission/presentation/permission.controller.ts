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
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";
import { ok } from "../../../common/response/api-response";
import { JwtAuthGuard, PermissionGuard, RequirePermission } from "../../auth/index";
import { PERMISSION_SERVICE, type PermissionItem } from "../domain/permission.ports";
import type { PermissionServicePort } from "../domain/permission.ports";
import { PermissionTreeNodeVo, PermissionTreeVo, PermissionVo } from "./permission.vo";

class TreeQueryDto {
  @ApiPropertyOptional({ description: "角色 id，传入时返回该角色已勾选的权限", example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  roleId?: number;
}

class CreatePermissionDto {
  @ApiProperty({ description: "权限编码，建议 模块:资源:动作", example: "system:user:create" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  code!: string;

  @ApiProperty({ description: "权限名称", example: "新增用户" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  name!: string;

  @ApiProperty({ description: "节点类型", enum: ["tab", "button"], example: "button" })
  @IsIn(["tab", "button"])
  type!: "tab" | "button";

  @ApiProperty({ description: "父级权限 id（页面或 Tab）", example: 12 })
  @Type(() => Number)
  @IsInt()
  parentId!: number;

  @ApiPropertyOptional({ description: "权限说明", example: "允许在用户列表新增用户" })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;
}

class UpdatePermissionDto {
  @ApiPropertyOptional({ description: "权限名称", example: "新增用户" })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  name?: string;

  @ApiPropertyOptional({ description: "权限说明", example: "允许在用户列表新增用户" })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @ApiPropertyOptional({ description: "排序值", example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sort?: number;
}

@ApiTags("权限配置")
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller("permissions")
export class PermissionController {
  constructor(@Inject(PERMISSION_SERVICE) private readonly service: PermissionServicePort) {}

  @Get("tree")
  @RequirePermission("system:permission:read")
  @ApiOperation({ summary: "权限树（页面 / Tab / 按钮）" })
  @ApiQuery({ name: "roleId", required: false, description: "角色 id，传入时返回该角色已勾选权限" })
  @ApiOkResponse({ description: "权限树", type: PermissionTreeVo })
  async tree(@Query() query: TreeQueryDto) {
    const result = await this.service.tree(query.roleId);
    return ok({
      nodes: result.nodes as PermissionTreeNodeVo[],
      checkedIds: result.checkedIds,
    });
  }

  @Get()
  @RequirePermission("system:permission:read")
  @ApiOperation({ summary: "权限节点列表" })
  @ApiOkResponse({ description: "权限节点列表", type: [PermissionVo] })
  async list() {
    const items = await this.service.list();
    return ok(items.map((item) => this.toResponse(item)));
  }

  @Post("sync")
  @RequirePermission("system:permission:sync")
  @ApiOperation({ summary: "同步注册表权限树" })
  @ApiOkResponse({
    description: "同步结果",
    schema: { example: { code: 200, data: { synced: 42 }, message: "success" } },
  })
  async sync() {
    return ok(await this.service.sync());
  }

  @Post()
  @RequirePermission("system:permission:create")
  @ApiOperation({ summary: "在页面或 Tab 下新增 Tab / 按钮" })
  @ApiCreatedResponse({ description: "新建成功", type: PermissionVo })
  async create(@Body() dto: CreatePermissionDto) {
    const item = await this.service.create(dto);
    return ok(this.toResponse(item));
  }

  @Put(":id")
  @RequirePermission("system:permission:update")
  @ApiOperation({ summary: "编辑权限名称/说明/排序" })
  @ApiParam({ name: "id", description: "权限 id", example: 12 })
  @ApiOkResponse({ description: "编辑成功", type: PermissionVo })
  async update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdatePermissionDto) {
    const item = await this.service.update(id, dto);
    return ok(this.toResponse(item));
  }

  @Delete(":id")
  @RequirePermission("system:permission:delete")
  @ApiOperation({ summary: "删除权限节点及其子节点" })
  @ApiParam({ name: "id", description: "权限 id", example: 12 })
  @ApiOkResponse({ description: "删除成功" })
  async remove(@Param("id", ParseIntPipe) id: number) {
    await this.service.delete(id);
    return ok(undefined);
  }

  private toResponse(item: PermissionItem): PermissionVo {
    return {
      id: item.id,
      code: item.code,
      name: item.name,
      type: item.type,
      parentId: item.parentId,
      app: item.app,
      path: item.path,
      sort: item.sort,
      source: item.source,
      resource: item.resource,
      action: item.action,
      description: item.description,
    };
  }
}
