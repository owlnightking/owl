import { ApiProperty } from "@nestjs/swagger";

export class HealthVo {
  @ApiProperty({ description: "服务健康状态", example: "ok" })
  status!: string;

  @ApiProperty({ description: "服务名称", example: "api-service" })
  service!: string;

  @ApiProperty({ description: "服务器当前时间", example: "2026-09-20T10:00:00.000Z" })
  time!: string;
}
