import { ApiProperty } from "@nestjs/swagger";

export class PermissionVo {
  @ApiProperty({ description: "权限 id", example: 1 })
  id!: number;

  @ApiProperty({ description: "权限编码", example: "system:user:create" })
  code!: string;

  @ApiProperty({ description: "权限名称", example: "新增用户" })
  name!: string;

  @ApiProperty({ description: "节点类型", enum: ["page", "tab", "button"], example: "button" })
  type!: string;

  @ApiProperty({ description: "父级权限 id", nullable: true, example: 12 })
  parentId!: number | null;

  @ApiProperty({ description: "所属应用", nullable: true, example: "admin" })
  app!: string | null;

  @ApiProperty({ description: "页面路径（仅页面节点）", nullable: true, example: "/users" })
  path!: string | null;

  @ApiProperty({ description: "排序值", example: 10 })
  sort!: number;

  @ApiProperty({ description: "来源：route 注册表 / manual 手工", example: "route" })
  source!: string;

  @ApiProperty({ description: "资源", example: "system:user" })
  resource!: string;

  @ApiProperty({ description: "操作", example: "create" })
  action!: string;

  @ApiProperty({ description: "权限描述", nullable: true })
  description!: string | null;
}

export class PermissionTreeNodeVo {
  @ApiProperty({ description: "树节点唯一 key", example: "perm:12" })
  key!: string;

  @ApiProperty({ description: "权限编码；菜单/目录为空", nullable: true, example: "system:user:create" })
  code!: string | null;

  @ApiProperty({ description: "节点名称", example: "新增用户" })
  name!: string;

  @ApiProperty({
    description: "节点类型",
    enum: ["directory", "menu", "page", "tab", "button"],
    example: "button",
  })
  type!: string;

  @ApiProperty({ description: "所属应用", example: "admin" })
  app!: string;

  @ApiProperty({ description: "页面路径（仅页面节点）", required: false, example: "/users" })
  path?: string;

  @ApiProperty({ description: "权限 id；菜单/目录为空", nullable: true, example: 12 })
  permissionId!: number | null;

  @ApiProperty({ description: "子节点", type: () => [PermissionTreeNodeVo] })
  children!: PermissionTreeNodeVo[];
}

export class PermissionTreeVo {
  @ApiProperty({ description: "权限树", type: [PermissionTreeNodeVo] })
  nodes!: PermissionTreeNodeVo[];

  @ApiProperty({ description: "角色已勾选的权限 id", type: [Number], example: [1, 2] })
  checkedIds!: number[];
}
