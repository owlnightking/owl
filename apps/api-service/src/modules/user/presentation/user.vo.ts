import { ApiProperty } from "@nestjs/swagger";
import { PageMetaVo } from "../../../common/response/page.vo";

export class UserRoleVo {
  @ApiProperty({ description: "角色 id", example: 1 })
  id!: number;

  @ApiProperty({ description: "角色编码", example: "admin" })
  code!: string;

  @ApiProperty({ description: "角色名称", example: "系统管理员" })
  name!: string;
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

  @ApiProperty({ description: "头像地址", nullable: true })
  avatarUrl!: string | null;

  @ApiProperty({ description: "邮箱", nullable: true })
  email!: string | null;

  @ApiProperty({ description: "状态（active / disabled）", example: "active" })
  status!: string;

  @ApiProperty({ description: "最近登录时间", nullable: true, example: "2026-09-20T10:00:00.000Z" })
  lastLoginAt!: Date | null;

  @ApiProperty({ description: "创建时间", example: "2026-09-20T10:00:00.000Z" })
  createdAt!: Date;

  @ApiProperty({ description: "角色列表", type: [UserRoleVo] })
  roles!: UserRoleVo[];
}

export class UserPageVo extends PageMetaVo {
  @ApiProperty({ description: "用户列表", type: [UserVo] })
  list!: UserVo[];
}

export class RoleOptionVo {
  @ApiProperty({ description: "角色 id", example: 1 })
  id!: number;

  @ApiProperty({ description: "角色编码", example: "admin" })
  code!: string;

  @ApiProperty({ description: "角色名称", example: "系统管理员" })
  name!: string;

  @ApiProperty({ description: "是否系统内置", example: true })
  isSystem!: boolean;
}
