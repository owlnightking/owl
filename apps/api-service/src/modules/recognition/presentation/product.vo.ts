import { ApiProperty } from "@nestjs/swagger";
import { PageMetaVo } from "../../../common/response/page.vo";

export class ProductVo {
  @ApiProperty({ description: "商品 id", example: 1 })
  id!: number;

  @ApiProperty({ description: "商品名称", example: "定制马克杯" })
  name!: string;

  @ApiProperty({ description: "商品描述", nullable: true })
  description!: string | null;

  @ApiProperty({ description: "商品图片地址", nullable: true })
  image!: string | null;

  @ApiProperty({ description: "商品价格（金币）", example: 200 })
  price!: number;

  @ApiProperty({ description: "库存数量", example: 10 })
  stock!: number;

  @ApiProperty({ description: "是否上架", example: true })
  enabled!: boolean;

  @ApiProperty({ description: "排序值", example: 1 })
  sortOrder!: number;

  @ApiProperty({ description: "创建时间", example: "2026-09-20T10:00:00.000Z" })
  createdAt!: string;
}

export class ProductPageVo extends PageMetaVo {
  @ApiProperty({ description: "列表", type: [ProductVo] })
  list!: ProductVo[];
}
