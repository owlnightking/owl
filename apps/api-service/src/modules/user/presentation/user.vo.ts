import { ApiProperty } from "@nestjs/swagger";
import { PageMetaVo } from "../../../common/response/page.vo";

export class UserGroupBriefVo {
  @ApiProperty({ description: "用户组 id", example: 1 })
  id!: number;

  @ApiProperty({ description: "用户组编码", example: "all_staff" })
  code!: string;

  @ApiProperty({ description: "用户组名称", example: "全员" })
  name!: string;
}

export class UserDepartmentBriefVo {
  @ApiProperty({ description: "部门 id", example: 1 })
  id!: number;

  @ApiProperty({ description: "部门名称", example: "后端组" })
  name!: string;

  @ApiProperty({ description: "组织架构路径", example: "总公司/技术部/后端组" })
  path!: string;
}

export class UserVo {
  @ApiProperty({ description: "用户 id", example: 1 })
  id!: number;

  @ApiProperty({ description: "飞书 unionId" })
  unionId!: string;

  @ApiProperty({ description: "飞书 openId" })
  openId!: string;

  @ApiProperty({ description: "姓名", example: "张三" })
  name!: string;

  @ApiProperty({ description: "别称", nullable: true, example: "老张" })
  nickname!: string | null;

  @ApiProperty({ description: "头像地址", nullable: true })
  avatarUrl!: string | null;

  @ApiProperty({ description: "邮箱", nullable: true })
  email!: string | null;

  @ApiProperty({ description: "状态（active / disabled）", example: "active" })
  status!: string;

  @ApiProperty({ description: "所属部门", nullable: true, type: UserDepartmentBriefVo })
  department!: UserDepartmentBriefVo | null;

  @ApiProperty({ description: "最近登录时间", nullable: true, example: "2026-09-20T10:00:00.000Z" })
  lastLoginAt!: Date | null;

  @ApiProperty({ description: "创建时间", example: "2026-09-20T10:00:00.000Z" })
  createdAt!: Date;

  @ApiProperty({ description: "所属用户组", type: [UserGroupBriefVo] })
  groups!: UserGroupBriefVo[];
}

export class UserPageVo extends PageMetaVo {
  @ApiProperty({ description: "用户列表", type: [UserVo] })
  list!: UserVo[];
}
