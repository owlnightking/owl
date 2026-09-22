import { Controller, Get, Inject, Query, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiPropertyOptional, ApiTags } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { AUDIT_LOG_SERVICE } from "../domain/audit-log.ports";
import { AuditLogService } from "../application/audit-log.service";
import { page } from "../../../common/response/api-response";
import { JwtAuthGuard, PermissionGuard, RequirePermission } from "../../auth/index";
import { AuditLogPageVo } from "./audit-log.vo";

class ListAuditLogsQueryDto {
  @ApiPropertyOptional({ description: "用户 id", example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userId?: number;

  @ApiPropertyOptional({ description: "资源标识", example: "user" })
  @IsOptional()
  @IsString()
  resource?: string;

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
  @Max(100)
  pageSize: number = 20;
}

@ApiTags("审计日志")
@Controller("audit-logs")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AuditLogController {
  constructor(@Inject(AUDIT_LOG_SERVICE) private readonly service: AuditLogService) {}

  @Get()
  @RequirePermission("role:read")
  @ApiOperation({ summary: "审计日志分页列表" })
  @ApiOkResponse({ description: "审计日志分页列表", type: AuditLogPageVo })
  async list(@Query() query: ListAuditLogsQueryDto) {
    const result = await this.service.list({
      userId: query.userId,
      resource: query.resource,
      page: query.page,
      pageSize: query.pageSize,
    });
    return page(result.items, query.page, query.pageSize, result.total);
  }
}
