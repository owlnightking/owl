import { Body, Controller, Delete, Get, Inject, Param, ParseIntPipe, Put, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiParam, ApiProperty, ApiPropertyOptional, ApiTags } from "@nestjs/swagger";
import { IsObject, IsOptional, IsString } from "class-validator";
import { SYSTEM_CONFIG_SERVICE, type SystemConfigItem } from "../domain/system-config.ports";
import { SystemConfigService } from "../application/system-config.service";
import { ok } from "../../../common/response/api-response";
import { JwtAuthGuard, PermissionGuard, RequirePermission, CurrentUser, type AuthPrincipal } from "../../auth/index";
import { SystemConfigVo } from "./system-config.vo";

class SetConfigDto {
  @ApiProperty({ description: "配置值", type: Object, example: { enabled: true } })
  @IsObject()
  value!: unknown;

  @ApiPropertyOptional({ description: "配置说明", example: "订单自动取消时长（分钟）" })
  @IsOptional()
  @IsString()
  description?: string;
}

@ApiTags("系统配置")
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller("system-config")
export class SystemConfigController {
  constructor(
    @Inject(SYSTEM_CONFIG_SERVICE)
    private readonly service: SystemConfigService
  ) {}

  @Get(":id")
  @RequirePermission("system:config:read")
  @ApiOperation({ summary: "配置详情" })
  @ApiParam({ name: "id", description: "主键 id", example: 1 })
  @ApiOkResponse({ description: "配置详情", type: SystemConfigVo })
  async get(@Param("id", ParseIntPipe) id: number) {
    const item = await this.service.getByIdOrThrow(id);
    return ok(this.toResponse(item));
  }

  @Put(":id")
  @RequirePermission("system:config:update")
  @ApiOperation({ summary: "更新配置" })
  @ApiParam({ name: "id", description: "主键 id", example: 1 })
  @ApiOkResponse({ description: "更新成功", type: SystemConfigVo })
  async set(@Param("id", ParseIntPipe) id: number, @Body() dto: SetConfigDto, @CurrentUser() user: AuthPrincipal) {
    const item = await this.service.updateById(id, dto.value, Number(user.userId), dto.description);
    return ok(this.toResponse(item));
  }

  @Delete(":id")
  @RequirePermission("system:config:delete")
  @ApiOperation({ summary: "删除配置" })
  @ApiParam({ name: "id", description: "主键 id", example: 1 })
  @ApiOkResponse({ description: "删除成功" })
  async remove(@Param("id", ParseIntPipe) id: number) {
    await this.service.deleteById(id);
    return ok(undefined);
  }

  private toResponse(item: SystemConfigItem) {
    return {
      id: item.id,
      key: item.key,
      value: item.value,
      description: item.description,
      updatedAt: item.updatedAt.toISOString(),
      updatedBy: item.updatedBy,
    };
  }
}
