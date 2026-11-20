export interface RolePermissionItem {
  id: number;
  code: string;
  name: string;
}

export interface RoleGroupItem {
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
  createdAt: Date;
  permissions: RolePermissionItem[];
  groups: RoleGroupItem[];
}

export interface RoleCreateInput {
  code: string;
  name: string;
  description?: string;
  permissionIds: number[];
}

export interface RoleUpdateInput {
  name?: string;
  description?: string;
  permissionIds?: number[];
}

export interface RoleQuery {
  page: number;
  pageSize: number;
  keyword?: string;
}

/** 下拉选项形态：只需 id/code/name/isSystem，不带上权限明细 */
export interface RoleOption {
  id: number;
  code: string;
  name: string;
  isSystem: boolean;
}

export interface RoleRepositoryPort {
  list(query: RoleQuery): Promise<{ items: RoleItem[]; total: number }>;
  listOptions(): Promise<RoleOption[]>;
  findById(id: number): Promise<RoleItem | null>;
  findByCode(code: string): Promise<RoleItem | null>;
  create(input: RoleCreateInput): Promise<RoleItem>;
  update(id: number, input: RoleUpdateInput): Promise<RoleItem | null>;
  delete(id: number): Promise<void>;
  listGroups(roleId: number): Promise<RoleGroupItem[]>;
  setGroups(roleId: number, groupIds: number[]): Promise<RoleGroupItem[]>;
}

export const ROLE_REPOSITORY = Symbol("ROLE_REPOSITORY");
export const ROLE_SERVICE = Symbol("ROLE_SERVICE");

export interface RoleServicePort {
  list(query: RoleQuery): Promise<{ items: RoleItem[]; total: number }>;
  listOptions(): Promise<RoleOption[]>;
  create(input: RoleCreateInput): Promise<RoleItem>;
  update(id: number, input: RoleUpdateInput): Promise<RoleItem>;
  delete(id: number): Promise<void>;
  getGroups(id: number): Promise<RoleGroupItem[]>;
  setGroups(id: number, groupIds: number[]): Promise<RoleGroupItem[]>;
}
