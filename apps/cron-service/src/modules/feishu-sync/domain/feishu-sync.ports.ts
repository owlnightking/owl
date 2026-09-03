export interface FeishuDepartment {
  feishuId: string;
  openDepartmentId: string;
  name: string;
  i18nName?: Record<string, string>;
  parentId: string | null;
  order: number;
  leaderUserId?: string;
  leaders?: Array<{ leaderID: string; leaderType: number }>;
  memberCount?: number;
  primaryMemberCount?: number;
  isDeleted?: boolean;
}

export interface FeishuUser {
  unionId: string;
  openId: string;
  name: string;
  nickname?: string;
  enName?: string;
  description?: string;
  email?: string | null;
  avatar72?: string | null;
  avatar240?: string | null;
  avatar640?: string | null;
  avatarOrigin?: string | null;
  mobileVisible?: boolean;
  departmentIds?: string[];
  departmentId?: string | null;
}

export interface FeishuSyncPort {
  getTenantAccessToken(): Promise<string>;
  getDepartmentTree(): Promise<FeishuDepartment[]>;
  getAllUsers(departmentIds: string[]): Promise<FeishuUser[]>;
}

export interface DepartmentRepositoryPort {
  replaceAll(depts: FeishuDepartment[]): Promise<void>;
}

export interface UserSyncRepositoryPort {
  upsertBatch(users: FeishuUser[]): Promise<void>;
}

export interface SyncLogRepositoryPort {
  create(type: string): Promise<string>;
  update(
    id: string,
    data: { status: string; total?: number; created?: number; updated?: number; errorMsg?: string }
  ): Promise<void>;
}

export const FEISHU_SYNC_PORT = Symbol("FEISHU_SYNC_PORT");
export const DEPARTMENT_REPOSITORY = Symbol("DEPARTMENT_REPOSITORY");
export const USER_SYNC_REPOSITORY = Symbol("USER_SYNC_REPOSITORY");
export const SYNC_LOG_REPOSITORY = Symbol("SYNC_LOG_REPOSITORY");
