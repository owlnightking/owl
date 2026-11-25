import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { ApiErrorCode } from "@owl/shared";
import {
  USER_GROUP_REPOSITORY,
  type UserGroupCreateInput,
  type UserGroupItem,
  type UserGroupMemberItem,
  type UserGroupMemberQuery,
  type UserGroupQuery,
  type UserGroupRepositoryPort,
  type UserGroupRoleItem,
  type UserGroupServicePort,
  type UserGroupUpdateInput,
} from "../domain/user-group.ports";

/** 系统内置用户组：不允许删除，避免全员组/管理组/超管组被误删导致所有人掉权限 */
const SYSTEM_GROUP_CODES = new Set(["all_staff", "admin_group", "super_admin_group"]);

@Injectable()
export class UserGroupService implements UserGroupServicePort {
  constructor(@Inject(USER_GROUP_REPOSITORY) private readonly groups: UserGroupRepositoryPort) {}

  private async getGroupOrThrow(id: number): Promise<UserGroupItem> {
    const group = await this.groups.findById(id);
    if (!group) {
      throw new NotFoundException({ code: ApiErrorCode.NOT_FOUND, message: `用户组不存在: ${id}` });
    }
    return group;
  }

  async list(query: UserGroupQuery): Promise<{ items: UserGroupItem[]; total: number }> {
    return this.groups.list(query);
  }

  async listOptions(): Promise<UserGroupItem[]> {
    return this.groups.listOptions();
  }

  async create(input: UserGroupCreateInput): Promise<UserGroupItem> {
    const exists = await this.groups.findByCode(input.code);
    if (exists) {
      throw new ConflictException({ code: ApiErrorCode.CONFLICT, message: `用户组编码已存在: ${input.code}` });
    }
    return this.groups.create(input);
  }

  async update(id: number, input: UserGroupUpdateInput): Promise<UserGroupItem> {
    const group = await this.getGroupOrThrow(id);
    if (group.isSystem && input.name) {
      throw new ConflictException({ code: ApiErrorCode.FORBIDDEN, message: `系统用户组不可改名: ${group.code}` });
    }
    const updated = await this.groups.update(id, input);
    if (!updated) {
      throw new NotFoundException({ code: ApiErrorCode.NOT_FOUND, message: `用户组不存在: ${id}` });
    }
    return updated;
  }

  async delete(id: number): Promise<void> {
    const group = await this.getGroupOrThrow(id);
    if (SYSTEM_GROUP_CODES.has(group.code)) {
      throw new ConflictException({ code: ApiErrorCode.FORBIDDEN, message: `系统用户组不可删除: ${group.code}` });
    }
    await this.groups.delete(id);
  }

  async listMembers(id: number, query: UserGroupMemberQuery): Promise<{ items: UserGroupMemberItem[]; total: number }> {
    await this.getGroupOrThrow(id);
    return this.groups.listMembers(id, query);
  }

  async setMembers(id: number, userIds: number[]): Promise<{ count: number }> {
    await this.getGroupOrThrow(id);
    const unique = Array.from(new Set(userIds));
    await this.groups.setMembers(id, unique);
    return { count: unique.length };
  }

  async setRoles(id: number, roleIds: number[]): Promise<UserGroupRoleItem[]> {
    await this.getGroupOrThrow(id);
    return this.groups.setRoles(id, Array.from(new Set(roleIds)));
  }
}
