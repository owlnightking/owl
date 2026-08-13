export interface RoleItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  createdAt: Date;
  permissions: { id: string; code: string; name: string }[];
}

export interface RoleCreateInput {
  code: string;
  name: string;
  description?: string;
  permissionIds: string[];
}

export interface RoleUpdateInput {
  name?: string;
  description?: string;
  permissionIds?: string[];
}

export interface PermissionItem {
  id: string;
  code: string;
  name: string;
  resource: string;
  action: string;
}

export interface RoleRepositoryPort {
  list(): Promise<RoleItem[]>;
  findById(id: string): Promise<RoleItem | null>;
  findByCode(code: string): Promise<RoleItem | null>;
  create(input: RoleCreateInput): Promise<RoleItem>;
  update(id: string, input: RoleUpdateInput): Promise<RoleItem | null>;
  delete(id: string): Promise<void>;
  listPermissions(): Promise<PermissionItem[]>;
}

export const ROLE_REPOSITORY = Symbol("ROLE_REPOSITORY");
export const ROLE_SERVICE = Symbol("ROLE_SERVICE");

export interface RoleService {
  list(): Promise<RoleItem[]>;
  listPermissions(): Promise<PermissionItem[]>;
  create(input: RoleCreateInput): Promise<RoleItem>;
  update(id: string, input: RoleUpdateInput): Promise<RoleItem>;
  delete(id: string): Promise<void>;
}
