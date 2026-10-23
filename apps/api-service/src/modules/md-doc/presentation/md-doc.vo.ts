import { ApiProperty } from "@nestjs/swagger";
import { PageMetaVo } from "../../../common/response/page.vo";

export class MdDocCollaboratorVo {
  @ApiProperty({ description: "可编辑人员用户 id", example: 1 })
  userId!: number;

  @ApiProperty({ description: "可编辑人员姓名", example: "张三" })
  name!: string;

  @ApiProperty({ description: "可编辑人员头像地址", nullable: true })
  avatarUrl!: string | null;
}

export class MdDocUserOptionVo {
  @ApiProperty({ description: "用户 id", example: 1 })
  id!: number;

  @ApiProperty({ description: "用户姓名", example: "张三" })
  name!: string;

  @ApiProperty({ description: "邮箱", nullable: true })
  email!: string | null;

  @ApiProperty({ description: "头像地址", nullable: true })
  avatarUrl!: string | null;
}

export class MdDocVo {
  @ApiProperty({ description: "文档 id", example: 1 })
  id!: number;

  @ApiProperty({ description: "owner 用户 id", example: 1 })
  authorId!: number;

  @ApiProperty({ description: "owner 姓名", nullable: true })
  authorName!: string | null;

  @ApiProperty({ description: "owner 头像地址", nullable: true })
  authorAvatarUrl!: string | null;

  @ApiProperty({ description: "最后更新人用户 id", nullable: true })
  updatedBy!: number | null;

  @ApiProperty({ description: "最后更新人姓名", nullable: true })
  updatedByName!: string | null;

  @ApiProperty({ description: "最后更新人头像地址", nullable: true })
  updatedByAvatarUrl!: string | null;

  @ApiProperty({ description: "文档内容（Markdown）", example: "# 标题" })
  content!: string;

  @ApiProperty({ description: "内容摘要", nullable: true })
  excerpt!: string | null;

  @ApiProperty({ description: "创建时间", example: "2026-09-20T10:00:00.000Z" })
  createdAt!: string;

  @ApiProperty({ description: "更新时间", example: "2026-09-20T10:00:00.000Z" })
  updatedAt!: string;

  @ApiProperty({ description: "可编辑人员", type: [MdDocCollaboratorVo] })
  collaborators!: MdDocCollaboratorVo[];

  @ApiProperty({ description: "当前用户是否可以管理文档编辑权限（仅 owner）", example: false })
  canManageCollaborators!: boolean;
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
