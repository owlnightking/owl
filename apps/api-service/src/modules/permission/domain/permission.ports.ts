/** 数据库中的权限节点类型：菜单/目录不落库，只存页面、Tab、按钮 */
export type PermissionNodeType = "page" | "tab" | "button";

export interface PermissionItem {
  id: number;
  code: string;
  name: string;
  type: PermissionNodeType;
  parentId: number | null;
  app: string | null;
  path: string | null;
  sort: number;
  source: string;
  resource: string;
  action: string;
  description: string | null;
  createdAt: Date;
}

export interface PermissionCreateInput {
  code: string;
  name: string;
  type: "tab" | "button";
  parentId: number;
  description?: string;
}

export interface PermissionUpdateInput {
  name?: string;
  description?: string;
  sort?: number;
}

export interface PermissionTreeNode {
  key: string;
  code: string | null;
  name: string;
  type: "directory" | "menu" | "page" | "tab" | "button";
  app: string;
  path?: string;
  permissionId: number | null;
  children: PermissionTreeNode[];
}

export interface PermissionTreeResult {
  nodes: PermissionTreeNode[];
  checkedIds: number[];
}

export interface PermissionRepositoryPort {
  list(): Promise<PermissionItem[]>;
  findById(id: number): Promise<PermissionItem | null>;
  findByCode(code: string): Promise<PermissionItem | null>;
  create(input: PermissionCreateInput & { resource: string; action: string }): Promise<PermissionItem>;
  update(id: number, input: PermissionUpdateInput): Promise<PermissionItem | null>;
  delete(id: number): Promise<void>;
  sync(
    defs: {
      code: string;
      name: string;
      type: "page" | "tab" | "button";
      app: string;
      path?: string;
      parentCode?: string;
      sort: number;
    }[]
  ): Promise<number>;
  findRolePermissionIds(roleId: number): Promise<number[]>;
}

/** 权限码 `<resource>:<action>`，resource 可含冒号（如 recognition:badge:read） */
export function splitPermissionCode(code: string): { resource: string; action: string } {
  const index = code.lastIndexOf(":");
  if (index <= 0) {
    return { resource: code, action: "read" };
  }
  return { resource: code.slice(0, index), action: code.slice(index + 1) };
}

export const PERMISSION_REPOSITORY = Symbol("PERMISSION_REPOSITORY");
export const PERMISSION_SERVICE = Symbol("PERMISSION_SERVICE");

export interface PermissionServicePort {
  list(): Promise<PermissionItem[]>;
  tree(roleId?: number): Promise<PermissionTreeResult>;
  sync(): Promise<{ synced: number }>;
  create(input: PermissionCreateInput): Promise<PermissionItem>;
  update(id: number, input: PermissionUpdateInput): Promise<PermissionItem>;
  delete(id: number): Promise<void>;
}
