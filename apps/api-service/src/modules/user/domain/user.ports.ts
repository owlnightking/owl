export interface UserGroupBrief {
  id: number;
  code: string;
  name: string;
}

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
  groups: UserGroupBrief[];
}

export interface UserQuery {
  keyword?: string;
  page: number;
  pageSize: number;
}

export interface UserRepositoryPort {
  list(query: UserQuery): Promise<{ items: UserListItem[]; total: number }>;
  findById(id: number): Promise<UserListItem | null>;
  updateStatus(userId: number, status: string): Promise<void>;
  listGroups(): Promise<UserGroupBrief[]>;
}

export const USER_REPOSITORY = Symbol("USER_REPOSITORY");
