import { ApiProperty } from "@nestjs/swagger";
import { PageMetaVo } from "../../../common/response/page.vo";

export class MdDocVo {
  @ApiProperty({ description: "文档 id", example: 1 })
  id!: number;

  @ApiProperty({ description: "作者用户 id", example: 1 })
  authorId!: number;

  @ApiProperty({ description: "文档内容（Markdown）", example: "# 标题" })
  content!: string;

  @ApiProperty({ description: "内容摘要", nullable: true })
  excerpt!: string | null;

  @ApiProperty({ description: "创建时间", example: "2026-09-20T10:00:00.000Z" })
  createdAt!: string;

  @ApiProperty({ description: "更新时间", example: "2026-09-20T10:00:00.000Z" })
  updatedAt!: string;
}

export class MdDocPageVo extends PageMetaVo {
  @ApiProperty({ description: "文档列表", type: [MdDocVo] })
  list!: MdDocVo[];
}

export class UploadImageVo {
  @ApiProperty({ description: "图片访问地址", example: "http://localhost:9000/owl/md-docs/1/1.png" })
  url!: string;

  @ApiProperty({ description: "文件记录 id", example: 1, nullable: true })
  fileId!: number | null;
}
