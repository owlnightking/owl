import { ApiProperty } from "@nestjs/swagger";
import { PageMetaVo } from "../../../common/response/page.vo";

export class SchedulerConfigVo {
  @ApiProperty({ description: "配置 id", example: 1 })
  id!: number;

  @ApiProperty({ description: "任务名称", example: "基础数据同步" })
  name!: string;

  @ApiProperty({ description: "业务域", example: "base-data" })
  area!: string;

  @ApiProperty({ description: "Cron 表达式", example: "0 0 * * *" })
  cron!: string;

  @ApiProperty({ description: "处理器", example: "syncBaseData" })
  handler!: string;

  @ApiProperty({ description: "标签列表", type: [String], example: ["base-data"] })
  tags!: string[];

  @ApiProperty({ description: "所属模块", nullable: true, example: "base-data" })
  module!: string | null;

  @ApiProperty({ description: "运行环境（dev / prod / all）", example: "all" })
  env!: string;

  @ApiProperty({ description: "是否启用", example: true })
  enabled!: boolean;

  @ApiProperty({ description: "描述", nullable: true, example: "每日同步基础数据" })
  description!: string | null;

  @ApiProperty({ description: "超时时间（毫秒）", example: 300000 })
  timeoutMs!: number;

  @ApiProperty({ description: "更新时间", example: "2026-09-20T10:00:00.000Z" })
  updatedAt!: Date;
}

export class SchedulerRunVo {
  @ApiProperty({ description: "运行记录 id", example: 1 })
  id!: number;

  @ApiProperty({ description: "任务运行唯一标识", example: "0f1e2d3c-4b5a-6789-abcd-ef0123456789" })
  taskRunId!: string;

  @ApiProperty({ description: "业务域", nullable: true, example: "base-data" })
  area!: string | null;

  @ApiProperty({ description: "任务名称", nullable: true, example: "syncBaseData" })
  taskName!: string | null;

  @ApiProperty({ description: "计划执行时间", example: "2026-09-20T10:00:00.000Z" })
  scheduledAt!: Date;

  @ApiProperty({ description: "开始执行时间", nullable: true, example: "2026-09-20T10:00:01.000Z" })
  startedAt!: Date | null;

  @ApiProperty({ description: "执行完成时间", nullable: true, example: "2026-09-20T10:00:05.000Z" })
  finishedAt!: Date | null;

  @ApiProperty({ description: "执行状态（PENDING / RUNNING / SUCCESS / FAILED）", example: "PENDING" })
  status!: string;

  @ApiProperty({ description: "重试次数", example: 0 })
  attempts!: number;

  @ApiProperty({ description: "最近一次错误信息", nullable: true, example: null })
  lastError!: string | null;

  @ApiProperty({ description: "创建时间", example: "2026-09-20T10:00:00.000Z" })
  createdAt!: Date;
}

export class SchedulerRunPageVo extends PageMetaVo {
  @ApiProperty({ description: "运行记录列表", type: [SchedulerRunVo] })
  list!: SchedulerRunVo[];
}

export class SchedulerConfigPageVo extends PageMetaVo {
  @ApiProperty({ description: "定时任务配置列表", type: [SchedulerConfigVo] })
  list!: SchedulerConfigVo[];
}
