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

export interface DepartmentSyncResult {
  upserted: number;
  hardDeleted: number;
}

export interface UserSyncResult {
  created: number;
  updated: number;
  softDeleted: number;
}

export interface DepartmentRepositoryPort {
  /** upsert 本次全量部门，并硬删飞书已不存在的孤儿部门（ADR 014）；空列表由 Service 中止，不在此清空 */
  replaceAll(depts: FeishuDepartment[]): Promise<DepartmentSyncResult>;
}

export interface UserSyncRepositoryPort {
  /** upsert 本次全量用户（含别称/部门），并软删未出现的离职人员；复活时清 deletedAt */
  upsertBatch(users: FeishuUser[]): Promise<UserSyncResult>;
}

export interface SyncLogRepositoryPort {
  create(type: string): Promise<number>;
  update(
    id: number,
    data: { status: string; total?: number; created?: number; updated?: number; errorMsg?: string }
  ): Promise<void>;
}

export const FEISHU_SYNC_PORT = Symbol("FEISHU_SYNC_PORT");
export const DEPARTMENT_REPOSITORY = Symbol("DEPARTMENT_REPOSITORY");
export const USER_SYNC_REPOSITORY = Symbol("USER_SYNC_REPOSITORY");
export const SYNC_LOG_REPOSITORY = Symbol("SYNC_LOG_REPOSITORY");
