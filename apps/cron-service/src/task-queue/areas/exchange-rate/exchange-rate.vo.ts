import { ApiProperty } from "@nestjs/swagger";

export class ExchangeRateDispatchVo {
  @ApiProperty({ description: "任务运行记录 id", example: 1 })
  runId!: number;
}
