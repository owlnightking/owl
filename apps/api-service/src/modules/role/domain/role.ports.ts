export interface RoleItem {
  id: number;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  createdAt: Date;
  permissions: { id: number; code: string; name: string }[];
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

export interface PermissionItem {
  id: number;
  code: string;
  name: string;
  resource: string;
  action: string;
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
  listPermissions(): Promise<PermissionItem[]>;
}

export const ROLE_REPOSITORY = Symbol("ROLE_REPOSITORY");
export const ROLE_SERVICE = Symbol("ROLE_SERVICE");

export interface RoleServicePort {
  list(query: RoleQuery): Promise<{ items: RoleItem[]; total: number }>;
  listOptions(): Promise<RoleOption[]>;
  listPermissions(): Promise<PermissionItem[]>;
  create(input: RoleCreateInput): Promise<RoleItem>;
  update(id: number, input: RoleUpdateInput): Promise<RoleItem>;
  delete(id: number): Promise<void>;
}
