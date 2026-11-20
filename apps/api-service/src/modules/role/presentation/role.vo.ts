import { ApiProperty } from "@nestjs/swagger";
import { PageMetaVo } from "../../../common/response/page.vo";

export class RolePermissionVo {
  @ApiProperty({ description: "权限 id", example: 1 })
  id!: number;

  @ApiProperty({ description: "权限编码", example: "system:role:read" })
  code!: string;

  @ApiProperty({ description: "权限名称", example: "查看角色" })
  name!: string;
}

export class RoleGroupVo {
  @ApiProperty({ description: "用户组 id", example: 1 })
  id!: number;

  @ApiProperty({ description: "用户组编码", example: "all_staff" })
  code!: string;

  @ApiProperty({ description: "用户组名称", example: "全员" })
  name!: string;
}

export class RoleVo {
  @ApiProperty({ description: "角色 id", example: 1 })
  id!: number;

  @ApiProperty({ description: "角色编码", example: "admin" })
  code!: string;

  @ApiProperty({ description: "角色名称", example: "系统管理员" })
  name!: string;

  @ApiProperty({ description: "角色描述", nullable: true })
  description!: string | null;

  @ApiProperty({ description: "是否系统内置", example: true })
  isSystem!: boolean;

  @ApiProperty({ description: "创建时间", example: "2026-09-20T10:00:00.000Z" })
  createdAt!: Date;

  @ApiProperty({ description: "权限列表", type: [RolePermissionVo] })
  permissions!: RolePermissionVo[];

  @ApiProperty({ description: "已绑定的用户组", type: [RoleGroupVo] })
  groups!: RoleGroupVo[];
}

export class RolePageVo extends PageMetaVo {
  @ApiProperty({ description: "角色列表", type: [RoleVo] })
  list!: RoleVo[];
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
