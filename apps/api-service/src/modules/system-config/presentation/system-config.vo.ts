import { ApiProperty } from "@nestjs/swagger";

export class SystemConfigVo {
  @ApiProperty({ description: "配置 id", example: 1 })
  id!: number;

  @ApiProperty({ description: "配置键", example: "order.autoCancelMinutes" })
  key!: string;

  @ApiProperty({ description: "配置值", type: Object, nullable: true, example: { enabled: true } })
  value!: unknown;

  @ApiProperty({ description: "配置说明", nullable: true, example: "订单自动取消时长（分钟）" })
  description!: string | null;

  @ApiProperty({ description: "更新时间", example: "2026-09-20T10:00:00.000Z" })
  updatedAt!: string;

  @ApiProperty({ description: "更新人 id", nullable: true, example: 1 })
  updatedBy!: number | null;
}
