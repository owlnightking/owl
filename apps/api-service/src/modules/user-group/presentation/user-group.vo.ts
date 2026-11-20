import { ApiProperty } from "@nestjs/swagger";
import { PageMetaVo } from "../../../common/response/page.vo";

export class UserGroupRoleVo {
  @ApiProperty({ description: "角色 id", example: 1 })
  id!: number;

  @ApiProperty({ description: "角色编码", example: "member" })
  code!: string;

  @ApiProperty({ description: "角色名称", example: "普通成员" })
  name!: string;
}

export class UserGroupVo {
  @ApiProperty({ description: "用户组 id", example: 1 })
  id!: number;

  @ApiProperty({ description: "用户组编码", example: "all_staff" })
  code!: string;

  @ApiProperty({ description: "用户组名称", example: "全员" })
  name!: string;

  @ApiProperty({ description: "用户组说明", nullable: true })
  description!: string | null;

  @ApiProperty({ description: "是否系统内置", example: true })
  isSystem!: boolean;

  @ApiProperty({ description: "成员数量", example: 18 })
  memberCount!: number;

  @ApiProperty({ description: "已绑定角色", type: [UserGroupRoleVo] })
  roles!: UserGroupRoleVo[];

  @ApiProperty({ description: "创建时间", example: "2026-09-20T10:00:00.000Z" })
  createdAt!: Date;
}

export class UserGroupPageVo extends PageMetaVo {
  @ApiProperty({ description: "用户组列表", type: [UserGroupVo] })
  list!: UserGroupVo[];
}

export class UserGroupMemberVo {
  @ApiProperty({ description: "用户 id", example: 1 })
  id!: number;

  @ApiProperty({ description: "姓名", example: "张三" })
  name!: string;

  @ApiProperty({ description: "邮箱", nullable: true })
  email!: string | null;

  @ApiProperty({ description: "头像", nullable: true })
  avatarUrl!: string | null;

  @ApiProperty({ description: "状态", example: "active" })
  status!: string;

  @ApiProperty({ description: "加入时间", example: "2026-09-20T10:00:00.000Z" })
  joinedAt!: Date;
}

export class UserGroupMemberPageVo extends PageMetaVo {
  @ApiProperty({ description: "成员列表", type: [UserGroupMemberVo] })
  list!: UserGroupMemberVo[];
}
