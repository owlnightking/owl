import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { PERMISSION_SERVICE, type PermissionItem } from "../domain/permission.ports";
import { PermissionUseCase } from "../application/permission.use-case";
import { ok } from "../../../common/response/api-response";
import { Inject } from "@nestjs/common";
import { JwtAuthGuard, PermissionGuard, RequirePermission } from "../../auth/index";

class CreatePermissionDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  resource!: string;

  @IsString()
  @IsNotEmpty()
  action!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

class UpdatePermissionDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  resource?: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller("permissions")
export class PermissionController {
  constructor(
    @Inject(PERMISSION_SERVICE)
    private readonly service: PermissionUseCase
  ) {}

  @Get()
  @RequirePermission("system:permission:read")
  async list() {
    const items = await this.service.list();
    return ok(items.map(this.toResponse));
  }

  @Get(":id")
  @RequirePermission("system:permission:read")
  async findById(@Param("id") id: string) {
    const item = await this.service.findById(id);
    return ok(this.toResponse(item));
  }

  @Post()
  @RequirePermission("system:permission:create")
  async create(@Body() dto: CreatePermissionDto) {
    const item = await this.service.create(dto);
    return ok(this.toResponse(item));
  }

  @Put(":id")
  @RequirePermission("system:permission:update")
  async update(@Param("id") id: string, @Body() dto: UpdatePermissionDto) {
    const item = await this.service.update(id, dto);
    return ok(this.toResponse(item));
  }

  @Delete(":id")
  @RequirePermission("system:permission:delete")
  async remove(@Param("id") id: string) {
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
