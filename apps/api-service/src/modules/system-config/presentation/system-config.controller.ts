import { Body, Controller, Delete, Get, Inject, Param, Put, UseGuards } from "@nestjs/common";
import { IsObject, IsOptional, IsString } from "class-validator";
import { SYSTEM_CONFIG_SERVICE, type SystemConfigItem } from "../domain/system-config.ports";
import { SystemConfigUseCase } from "../application/system-config.use-case";
import { ok } from "../../../common/response/api-response";
import { JwtAuthGuard, PermissionGuard, RequirePermission } from "../../auth/index";

class SetConfigDto {
  @IsObject()
  value!: unknown;

  @IsOptional()
  @IsString()
  description?: string;
}

@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller("system-config")
export class SystemConfigController {
  constructor(
    @Inject(SYSTEM_CONFIG_SERVICE)
    private readonly service: SystemConfigUseCase
  ) {}

  @Get(":key")
  @RequirePermission("system:config:read")
  async get(@Param("key") key: string) {
    const item = await this.service.getOrThrow(key);
    return ok(this.toResponse(item));
  }

  @Put(":key")
  @RequirePermission("system:config:update")
  async set(@Param("key") key: string, @Body() dto: SetConfigDto, @Inject("CURRENT_USER_ID") userId?: string) {
    const item = await this.service.set(key, dto.value, userId, dto.description);
    return ok(this.toResponse(item));
  }

  @Delete(":key")
  @RequirePermission("system:config:delete")
  async remove(@Param("key") key: string) {
    await this.service.remove(key);
    return ok(undefined);
  }

  private toResponse(item: SystemConfigItem) {
    return {
      key: item.key,
      value: item.value,
      description: item.description,
      updatedAt: item.updatedAt.toISOString(),
      updatedBy: item.updatedBy,
    };
  }
}
