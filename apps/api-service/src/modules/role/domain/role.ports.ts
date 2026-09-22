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

export interface RoleRepositoryPort {
  list(): Promise<RoleItem[]>;
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
  list(): Promise<RoleItem[]>;
  listPermissions(): Promise<PermissionItem[]>;
  create(input: RoleCreateInput): Promise<RoleItem>;
  update(id: number, input: RoleUpdateInput): Promise<RoleItem>;
  delete(id: number): Promise<void>;
}
