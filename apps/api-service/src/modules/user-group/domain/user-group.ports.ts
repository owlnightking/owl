export interface UserGroupRoleItem {
  id: number;
  code: string;
  name: string;
}

export interface UserGroupItem {
  id: number;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  memberCount: number;
  roles: UserGroupRoleItem[];
  createdAt: Date;
}

export interface UserGroupMemberItem {
  id: number;
  name: string;
  email: string | null;
  avatarUrl: string | null;
  status: string;
  joinedAt: Date;
}

export interface UserGroupQuery {
  page: number;
  pageSize: number;
  keyword?: string;
}

export interface UserGroupMemberQuery {
  page: number;
  pageSize: number;
  keyword?: string;
}

export interface UserGroupCreateInput {
  code: string;
  name: string;
  description?: string;
}

export interface UserGroupUpdateInput {
  name?: string;
  description?: string;
}

export interface UserGroupRepositoryPort {
  list(query: UserGroupQuery): Promise<{ items: UserGroupItem[]; total: number }>;
  listOptions(): Promise<UserGroupItem[]>;
  findById(id: number): Promise<UserGroupItem | null>;
  findByCode(code: string): Promise<UserGroupItem | null>;
  create(input: UserGroupCreateInput): Promise<UserGroupItem>;
  update(id: number, input: UserGroupUpdateInput): Promise<UserGroupItem | null>;
  delete(id: number): Promise<void>;
  listMembers(groupId: number, query: UserGroupMemberQuery): Promise<{ items: UserGroupMemberItem[]; total: number }>;
  setMembers(groupId: number, userIds: number[]): Promise<void>;
  setRoles(groupId: number, roleIds: number[]): Promise<UserGroupRoleItem[]>;
}

export const USER_GROUP_REPOSITORY = Symbol("USER_GROUP_REPOSITORY");
export const USER_GROUP_SERVICE = Symbol("USER_GROUP_SERVICE");

export interface UserGroupServicePort {
  list(query: UserGroupQuery): Promise<{ items: UserGroupItem[]; total: number }>;
  listOptions(): Promise<UserGroupItem[]>;
  create(input: UserGroupCreateInput): Promise<UserGroupItem>;
  update(id: number, input: UserGroupUpdateInput): Promise<UserGroupItem>;
  delete(id: number): Promise<void>;
  listMembers(id: number, query: UserGroupMemberQuery): Promise<{ items: UserGroupMemberItem[]; total: number }>;
  setMembers(id: number, userIds: number[]): Promise<{ count: number }>;
  setRoles(id: number, roleIds: number[]): Promise<UserGroupRoleItem[]>;
}
