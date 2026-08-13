import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { PrismaClient } from "@owl/database";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { ok } from "../../../common/response/api-response";
import { JwtAuthGuard, PermissionGuard, RequirePermission } from "../../auth/index";

class ListAuditLogsQueryDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  resource?: string;

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

@Controller("audit-logs")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AuditLogController {
  constructor(private readonly prisma: PrismaClient) {}

  @Get()
  @RequirePermission("role:read")
  async list(@Query() query: ListAuditLogsQueryDto) {
    const where = {
      ...(query.userId ? { userId: query.userId } : {}),
      ...(query.resource ? { resource: query.resource } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return ok({ items, total, page: query.page, pageSize: query.pageSize });
  }
}
