import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsObject, IsOptional, IsString } from "class-validator";

export class DispatchTaskDto {
  @ApiPropertyOptional({ description: "任务名称", example: "syncBaseData" })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: "任务名称（兼容字段，优先使用 name）", example: "syncBaseData" })
  @IsString()
  @IsOptional()
  task?: string;

  @ApiPropertyOptional({ description: "业务域", example: "base-data" })
  @IsOptional()
  @IsString()
  area?: string;

  @ApiPropertyOptional({ description: "任务参数", type: Object, example: {} })
  @IsOptional()
  @IsObject()
  params?: Record<string, unknown>;

  get resolvedTask(): string {
    return this.name ?? this.task ?? "";
  }
}
