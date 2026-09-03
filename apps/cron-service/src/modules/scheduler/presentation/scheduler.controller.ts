import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Inject } from "@nestjs/common";
import { SchedulerUseCase } from "../application/scheduler.use-case";
import { SCHEDULER_CONFIG_REPOSITORY, SCHEDULER_RUN_REPOSITORY } from "../domain/scheduler.ports";
import { PrismaSchedulerConfigRepository } from "../infrastructure/prisma-scheduler-config.repository";
import { PrismaSchedulerRunRepository } from "../infrastructure/prisma-scheduler-run.repository";
import { ok } from "../../../common/response/api-response";
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { Type } from "class-transformer";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

class CreateSchedulerDto {
  @IsString()
  name!: string;

  @IsString()
  area!: string;

  @IsString()
  cron!: string;

  @IsString()
  handler!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  module?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

class UpdateSchedulerDto {
  @IsOptional()
  @IsString()
  cron?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  module?: string;
}

class RunQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  pageSize?: number;

  @IsOptional()
  @IsString()
  status?: string;
}

@Controller("schedulers")
export class SchedulerController {
  private readonly schedulerUseCase: SchedulerUseCase;

  constructor(
    @Inject(SCHEDULER_CONFIG_REPOSITORY) configRepo: PrismaSchedulerConfigRepository,
    @Inject(SCHEDULER_RUN_REPOSITORY) runRepo: PrismaSchedulerRunRepository
  ) {
    this.schedulerUseCase = new SchedulerUseCase(configRepo, runRepo);
  }

  @Get()
  async list() {
    return ok(await this.schedulerUseCase.listConfigs());
  }

  @Get("runs")
  async getAllRuns(@Query() query: RunQueryDto) {
    return ok(
      await this.schedulerUseCase.getAllRuns(
        query.page ?? DEFAULT_PAGE,
        query.pageSize ?? DEFAULT_PAGE_SIZE,
        query.status
      )
    );
  }

  @Get(":id/runs")
  async getRuns(@Param("id") id: string, @Query() query: RunQueryDto) {
    return ok(await this.schedulerUseCase.getRuns(id, query.page ?? DEFAULT_PAGE, query.pageSize ?? DEFAULT_PAGE_SIZE));
  }

  @Get(":id")
  async getById(@Param("id") id: string) {
    return ok(await this.schedulerUseCase.getConfig(id));
  }

  @Post()
  async create(@Body() dto: CreateSchedulerDto) {
    return ok(await this.schedulerUseCase.createConfig(dto));
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: UpdateSchedulerDto) {
    await this.schedulerUseCase.updateConfig(id, dto);
    return ok(null);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    await this.schedulerUseCase.deleteConfig(id);
    return ok(null);
  }
}
