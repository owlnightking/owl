import { Controller, Get, Post, Put, Delete, Param, Body, Query, Inject, ParseIntPipe } from "@nestjs/common";
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from "@nestjs/swagger";
import { SchedulerService } from "../application/scheduler.service";
import { SCHEDULER_SERVICE } from "../domain/scheduler.ports";
import { ok, page } from "../../../common/response/api-response";
import { IsArray, IsBoolean, IsIn, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { Type } from "class-transformer";
import { SchedulerConfigVo, SchedulerRunPageVo } from "./scheduler.vo";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

class CreateSchedulerDto {
  @ApiProperty({ description: "任务名称", example: "基础数据同步" })
  @IsString()
  name!: string;

  @ApiProperty({ description: "业务域", example: "base-data" })
  @IsString()
  area!: string;

  @ApiProperty({ description: "Cron 表达式", example: "0 0 * * *" })
  @IsString()
  cron!: string;

  @ApiProperty({ description: "处理器", example: "syncBaseData" })
  @IsString()
  handler!: string;

  @ApiPropertyOptional({ description: "标签列表", type: [String], example: ["base-data"] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: "所属模块", example: "base-data" })
  @IsOptional()
  @IsString()
  module?: string;

  @ApiPropertyOptional({ description: "运行环境", enum: ["dev", "prod", "all"], example: "all" })
  @IsOptional()
  @IsString()
  @IsIn(["dev", "prod", "all"])
  env?: string;

  @ApiPropertyOptional({ description: "描述", example: "每日同步基础数据" })
  @IsOptional()
  @IsString()
  description?: string;
}

class UpdateSchedulerDto {
  @ApiPropertyOptional({ description: "Cron 表达式", example: "0 0 * * *" })
  @IsOptional()
  @IsString()
  cron?: string;

  @ApiPropertyOptional({ description: "是否启用", example: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ description: "描述", example: "每日同步基础数据" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: "标签列表", type: [String], example: ["base-data"] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: "所属模块", example: "base-data" })
  @IsOptional()
  @IsString()
  module?: string;

  @ApiPropertyOptional({ description: "运行环境", enum: ["dev", "prod", "all"], example: "all" })
  @IsOptional()
  @IsString()
  @IsIn(["dev", "prod", "all"])
  env?: string;
}

class RunQueryDto {
  @ApiPropertyOptional({ description: "页码", example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: "每页条数", example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  pageSize?: number;

  @ApiPropertyOptional({ description: "执行状态", example: "PENDING" })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: "运行环境", enum: ["dev", "prod"], example: "dev" })
  @IsOptional()
  @IsString()
  @IsIn(["dev", "prod"])
  env?: string;
}

@ApiTags("定时任务")
@Controller("schedulers")
export class SchedulerController {
  constructor(@Inject(SCHEDULER_SERVICE) private readonly schedulerService: SchedulerService) {}

  @Get()
  @ApiOperation({ summary: "定时任务配置列表" })
  @ApiOkResponse({ description: "定时任务配置列表", type: [SchedulerConfigVo] })
  async list() {
    return ok(await this.schedulerService.listConfigs());
  }

  @Get("runs")
  @ApiOperation({ summary: "全部运行记录分页" })
  @ApiOkResponse({ description: "运行记录分页列表", type: SchedulerRunPageVo })
  async getAllRuns(@Query() query: RunQueryDto) {
    const pageNum = query.page ?? DEFAULT_PAGE;
    const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
    const result = await this.schedulerService.getAllRuns(pageNum, pageSize, query.status, query.env);
    return page(result.items, pageNum, pageSize, result.total);
  }

  @Get(":id/runs")
  @ApiOperation({ summary: "指定配置运行记录分页" })
  @ApiParam({ name: "id", description: "主键 id", example: 1 })
  @ApiOkResponse({ description: "运行记录分页列表", type: SchedulerRunPageVo })
  async getRuns(@Param("id", ParseIntPipe) id: number, @Query() query: RunQueryDto) {
    const pageNum = query.page ?? DEFAULT_PAGE;
    const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
    const result = await this.schedulerService.getRuns(id, pageNum, pageSize);
    return page(result.items, pageNum, pageSize, result.total);
  }

  @Get(":id")
  @ApiOperation({ summary: "定时任务配置详情" })
  @ApiParam({ name: "id", description: "主键 id", example: 1 })
  @ApiOkResponse({ description: "定时任务配置详情", type: SchedulerConfigVo })
  async getById(@Param("id", ParseIntPipe) id: number) {
    return ok(await this.schedulerService.getConfig(id));
  }

  @Post()
  @ApiOperation({ summary: "新建定时任务配置" })
  @ApiCreatedResponse({ description: "新建成功", type: SchedulerConfigVo })
  async create(@Body() dto: CreateSchedulerDto) {
    return ok(await this.schedulerService.createConfig(dto));
  }

  @Put(":id")
  @ApiOperation({ summary: "编辑定时任务配置" })
  @ApiParam({ name: "id", description: "主键 id", example: 1 })
  @ApiOkResponse({ description: "更新成功" })
  async update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateSchedulerDto) {
    await this.schedulerService.updateConfig(id, dto);
    return ok(null);
  }

  @Delete(":id")
  @ApiOperation({ summary: "删除定时任务配置" })
  @ApiParam({ name: "id", description: "主键 id", example: 1 })
  @ApiOkResponse({ description: "删除成功" })
  async remove(@Param("id", ParseIntPipe) id: number) {
    await this.schedulerService.deleteConfig(id);
    return ok(null);
  }
}
