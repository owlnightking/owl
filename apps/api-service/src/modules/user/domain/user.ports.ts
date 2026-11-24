export interface UserGroupBrief {
  id: number;
  code: string;
  name: string;
}

export interface UserDepartmentBrief {
  id: number;
  name: string;
  /** 从根到当前部门的路径，如「总公司/技术部/后端组」 */
  path: string;
}

export interface UserListItem {
  id: number;
  unionId: string;
  openId: string;
  name: string;
  nickname: string | null;
  avatarUrl: string | null;
  email: string | null;
  status: string;
  department: UserDepartmentBrief | null;
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
