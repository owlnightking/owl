import { ApiProperty } from "@nestjs/swagger";

export class DispatchTaskVo {
  @ApiProperty({ description: "任务运行记录 id", example: 1 })
  runId!: number;
}
