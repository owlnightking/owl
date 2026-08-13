import { Body, Controller, Delete, Get, Inject, Param, Post, Put, UseGuards } from "@nestjs/common";
import { IsArray, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { ok } from "../../../common/response/api-response";
import { JwtAuthGuard, PermissionGuard, RequirePermission } from "../../auth/index";
import { ROLE_SERVICE, type RoleService } from "../domain/role.ports";

class CreateRoleDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  code!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @IsArray()
  @IsString({ each: true })
  permissionIds!: string[];
}

class UpdateRoleDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissionIds?: string[];
}

@Controller("roles")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class RoleController {
  constructor(@Inject(ROLE_SERVICE) private readonly roleService: RoleService) {}

  @Get()
  @RequirePermission("role:read")
  async list() {
    const items = await this.roleService.list();
    return ok(items);
  }

  @Get("permissions")
  @RequirePermission("role:read")
  async permissions() {
    const items = await this.roleService.listPermissions();
    return ok(items);
  }

  @Post()
  @RequirePermission("role:write")
  async create(@Body() dto: CreateRoleDto) {
    const role = await this.roleService.create(dto);
    return ok(role);
  }

  @Put(":id")
  @RequirePermission("role:write")
  async update(@Param("id") id: string, @Body() dto: UpdateRoleDto) {
    const role = await this.roleService.update(id, dto);
    return ok(role);
  }

  @Delete(":id")
  @RequirePermission("role:write")
  async delete(@Param("id") id: string) {
    await this.roleService.delete(id);
    return ok(null, "deleted");
  }
}
