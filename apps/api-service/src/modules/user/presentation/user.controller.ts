import { Body, Controller, Get, Inject, Param, Put, Query, UseGuards } from "@nestjs/common";
import { Type } from "class-transformer";
import { IsArray, IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { ok } from "../../../common/response/api-response";
import { JwtAuthGuard, PermissionGuard, RequirePermission } from "../../auth/index";
import { USER_SERVICE, type UserService } from "../application/user.use-case";

class ListUsersQueryDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 20;
}

class AssignRolesDto {
  @IsArray()
  @IsString({ each: true })
  roleIds!: string[];
}

class UpdateStatusDto {
  @IsIn(["active", "disabled"])
  status!: "active" | "disabled";
}

@Controller("users")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class UserController {
  constructor(@Inject(USER_SERVICE) private readonly userService: UserService) {}

  @Get()
  @RequirePermission("user:read")
  async list(@Query() query: ListUsersQueryDto) {
    const { items, total } = await this.userService.list(query);
    return ok({ items, total, page: query.page, pageSize: query.pageSize });
  }

  @Get("roles")
  @RequirePermission("role:read")
  async listRoles() {
    const items = await this.userService.listRoles();
    return ok(items);
  }

  @Get(":id/roles")
  @RequirePermission("user:read")
  async getUserRoles(@Param("id") id: string) {
    const items = await this.userService.getUserRoles(id);
    return ok(items);
  }

  @Put(":id/roles")
  @RequirePermission("user:write")
  async assignRoles(@Param("id") id: string, @Body() dto: AssignRolesDto) {
    await this.userService.assignRoles(id, dto.roleIds);
    return ok(null, "roles updated");
  }

  @Put(":id/status")
  @RequirePermission("user:write")
  async updateStatus(@Param("id") id: string, @Body() dto: UpdateStatusDto) {
    await this.userService.updateStatus(id, dto.status);
    return ok(null, "status updated");
  }
}
