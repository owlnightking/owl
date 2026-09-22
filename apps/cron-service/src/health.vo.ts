import { ApiProperty } from "@nestjs/swagger";

export class HealthVo {
  @ApiProperty({ description: "服务状态", example: "ok" })
  status!: string;

  @ApiProperty({ description: "服务名称", example: "cron-service" })
  service!: string;

  @ApiProperty({ description: "当前时间", example: "2026-09-20T10:00:00.000Z" })
  time!: string;
}

export class HealthEnvVo {
  @ApiProperty({ description: "运行环境", example: "dev" })
  env!: string;
}
