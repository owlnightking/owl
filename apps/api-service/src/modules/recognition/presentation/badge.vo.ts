import { ApiProperty } from "@nestjs/swagger";
import { PageMetaVo } from "../../../common/response/page.vo";

export class BadgeVo {
  @ApiProperty({ description: "徽章 id", example: 1 })
  id!: number;

  @ApiProperty({ description: "徽章名称", example: "团队之星" })
  name!: string;

  @ApiProperty({ description: "徽章图标", nullable: true })
  icon!: string | null;

  @ApiProperty({ description: "徽章描述", nullable: true })
  description!: string | null;

  @ApiProperty({ description: "金币奖励", example: 100 })
  coinReward!: number;

  @ApiProperty({ description: "经验奖励", example: 50 })
  expReward!: number;

  @ApiProperty({ description: "是否启用", example: true })
  enabled!: boolean;

  @ApiProperty({ description: "排序值", example: 1 })
  sortOrder!: number;

  @ApiProperty({ description: "创建时间", example: "2026-09-20T10:00:00.000Z" })
  createdAt!: string;
}

export class BadgePageVo extends PageMetaVo {
  @ApiProperty({ description: "徽章列表", type: [BadgeVo] })
  list!: BadgeVo[];
}
