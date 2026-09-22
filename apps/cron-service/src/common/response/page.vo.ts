import { ApiProperty } from "@nestjs/swagger";

export class PageMetaVo {
  @ApiProperty({ description: "当前页码", example: 1 })
  pageNum!: number;

  @ApiProperty({ description: "每页条数", example: 20 })
  pageSize!: number;

  @ApiProperty({ description: "总条数", example: 100 })
  total!: number;
}
