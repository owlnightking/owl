/** 权限配置页共用类型 */

export interface PermissionRef {
  id: number;
  code: string;
  name: string;
}

export interface RoleItem {
  id: number;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  createdAt: string;
  permissions: PermissionRef[];
  groups: { id: number; code: string; name: string }[];
}

export interface RolePageData {
  list: RoleItem[];
  pageNum: number;
  pageSize: number;
  total: number;
}

export interface UserGroupRoleRef {
  id: number;
  code: string;
  name: string;
}

export interface UserGroupItem {
  id: number;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  memberCount: number;
  roles: UserGroupRoleRef[];
  createdAt: string;
}

export interface UserGroupPageData {
  list: UserGroupItem[];
  pageNum: number;
  pageSize: number;
  total: number;
}

export interface UserGroupMemberItem {
  id: number;
  name: string;
  email: string | null;
  avatarUrl: string | null;
  status: string;
  joinedAt: string;
}

export interface UserGroupMemberPageData {
  list: UserGroupMemberItem[];
  pageNum: number;
  pageSize: number;
  total: number;
}

export interface RoleOption {
  id: number;
  code: string;
  name: string;
  isSystem: boolean;
}

export interface UserOption {
  id: number;
  name: string;
  nickname?: string | null;
  email?: string | null;
  status?: string;
}

export type PermissionTreeNodeType = "directory" | "menu" | "page" | "tab" | "button";

export interface PermissionTreeNode {
  key: string;
  code: string | null;
  name: string;
  type: PermissionTreeNodeType;
  app: string;
  path?: string;
  permissionId: number | null;
  children: PermissionTreeNode[];
}

export interface PermissionTreeResult {
  nodes: PermissionTreeNode[];
  checkedIds: number[];
}

export const TYPE_LABEL: Record<PermissionTreeNodeType, string> = {
  directory: "目录",
  menu: "菜单",
  page: "页面",
  tab: "Tab",
  button: "按钮",
};
