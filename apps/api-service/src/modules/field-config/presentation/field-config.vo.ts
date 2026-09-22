import { ApiProperty } from "@nestjs/swagger";
import { PageMetaVo } from "../../../common/response/page.vo";

export class FieldConfigVo {
  @ApiProperty({ description: "字段配置 id", example: 1 })
  id!: number;

  @ApiProperty({ description: "字段分类", example: "order" })
  category!: string;

  @ApiProperty({ description: "所属模块", example: "order-list" })
  module!: string;

  @ApiProperty({ description: "字段显示名", example: "订单状态" })
  label!: string;

  @ApiProperty({ description: "可选项配置", type: Object, nullable: true, example: [{ label: "待付款", value: 1 }] })
  options!: unknown;

  @ApiProperty({ description: "字段值", nullable: true, example: "pending" })
  value!: string | null;

  @ApiProperty({ description: "字段说明", nullable: true, example: "订单当前状态" })
  description!: string | null;

  @ApiProperty({ description: "创建时间", example: "2026-09-20T10:00:00.000Z" })
  createdAt!: Date;

  @ApiProperty({ description: "更新时间", example: "2026-09-20T10:00:00.000Z" })
  updatedAt!: Date;
}

export class FieldConfigPageVo extends PageMetaVo {
  @ApiProperty({ description: "字段配置列表", type: [FieldConfigVo] })
  list!: FieldConfigVo[];
}
