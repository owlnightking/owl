export interface UserListItem {
  id: number;
  unionId: string;
  openId: string;
  name: string;
  avatarUrl: string | null;
  email: string | null;
  status: string;
  lastLoginAt: Date | null;
  createdAt: Date;
  roles: { id: number; code: string; name: string }[];
}

export interface UserQuery {
  keyword?: string;
  page: number;
  pageSize: number;
}

export interface UserRepositoryPort {
  list(query: UserQuery): Promise<{ items: UserListItem[]; total: number }>;
  findById(id: number): Promise<UserListItem | null>;
  assignRoles(userId: number, roleIds: number[]): Promise<void>;
  updateStatus(userId: number, status: string): Promise<void>;
  listRoles(): Promise<{ id: number; code: string; name: string; isSystem: boolean }[]>;
}

export const USER_REPOSITORY = Symbol("USER_REPOSITORY");
export const ROLE_REPOSITORY = Symbol("ROLE_REPOSITORY");
export const PERMISSION_REPOSITORY = Symbol("PERMISSION_REPOSITORY");
