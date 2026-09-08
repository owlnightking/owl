export interface PermissionItem {
  id: string;
  code: string;
  name: string;
  resource: string;
  action: string;
  description: string | null;
  createdAt: Date;
}

export interface PermissionCreateInput {
  code: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
}

export interface PermissionUpdateInput {
  name?: string;
  resource?: string;
  action?: string;
  description?: string;
}

export interface PermissionRepositoryPort {
  list(): Promise<PermissionItem[]>;
  findById(id: string): Promise<PermissionItem | null>;
  findByCode(code: string): Promise<PermissionItem | null>;
  create(input: PermissionCreateInput): Promise<PermissionItem>;
  update(id: string, input: PermissionUpdateInput): Promise<PermissionItem | null>;
  delete(id: string): Promise<void>;
}

export const PERMISSION_REPOSITORY = Symbol("PERMISSION_REPOSITORY");
export const PERMISSION_SERVICE = Symbol("PERMISSION_SERVICE");
