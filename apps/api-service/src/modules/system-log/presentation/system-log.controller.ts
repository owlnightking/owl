import { Controller, Get, Inject, Query, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiPropertyOptional, ApiTags } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { page } from "../../../common/response/api-response";
import { JwtAuthGuard, PermissionGuard, RequirePermission } from "../../auth/index";
import { SYSTEM_LOG_SERVICE } from "../domain/system-log.ports";
import { SystemLogService } from "../application/system-log.service";
import { SystemLogPageVo } from "./system-log.vo";

class SystemLogQueryDto {
  @ApiPropertyOptional({ description: "级别筛选", enum: ["error", "warn"], example: "error" })
  @IsOptional()
  @IsString()
  @IsIn(["error", "warn"])
  level?: string;

  @ApiPropertyOptional({ description: "来源服务筛选", example: "api-service" })
  @IsOptional()
  @IsString()
  service?: string;

  @ApiPropertyOptional({ description: "关键字（错误信息 / 请求地址）", example: "missing access token" })
  @IsOptional()
  @IsString()
  keyword?: string;

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

@ApiTags("系统日志")
@Controller("system-logs")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class SystemLogController {
  constructor(@Inject(SYSTEM_LOG_SERVICE) private readonly service: SystemLogService) {}

  @Get()
  @RequirePermission("role:read")
  @ApiOperation({ summary: "系统日志分页列表" })
  @ApiOkResponse({ description: "系统日志分页列表", type: SystemLogPageVo })
  async list(@Query() query: SystemLogQueryDto) {
    const result = await this.service.list({
      level: query.level,
      service: query.service,
      keyword: query.keyword,
      page: query.page,
      pageSize: query.pageSize,
    });
    return page(result.items, query.page, query.pageSize, result.total);
  }
}
