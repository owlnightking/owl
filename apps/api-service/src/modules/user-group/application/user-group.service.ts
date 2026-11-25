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

/** 系统内置用户组：不可编辑、不可删除（当前仅「系统管理」） */
const SYSTEM_GROUP_CODES = new Set(["system_admin"]);
/** 系统管理组内不可移除的成员姓名（精确匹配） */
const PROTECTED_MEMBER_NAMES = new Set(["Calvin"]);

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

  private isSystemGroup(group: UserGroupItem): boolean {
    return SYSTEM_GROUP_CODES.has(group.code) || group.isSystem;
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
    if (this.isSystemGroup(group)) {
      throw new ConflictException({ code: ApiErrorCode.FORBIDDEN, message: `系统用户组不可编辑: ${group.code}` });
    }
    const updated = await this.groups.update(id, input);
    if (!updated) {
      throw new NotFoundException({ code: ApiErrorCode.NOT_FOUND, message: `用户组不存在: ${id}` });
    }
    return updated;
  }

  async delete(id: number): Promise<void> {
    const group = await this.getGroupOrThrow(id);
    if (this.isSystemGroup(group)) {
      throw new ConflictException({ code: ApiErrorCode.FORBIDDEN, message: `系统用户组不可删除: ${group.code}` });
    }
    // 其他用户组：仍绑定角色时不可删
    if (group.roles.length > 0) {
      throw new ConflictException({
        code: ApiErrorCode.CONFLICT,
        message: `用户组仍绑定角色（${group.roles.map((r) => r.name).join("、")}），请先解绑后再删除`,
      });
    }
    await this.groups.delete(id);
  }

  async listMembers(id: number, query: UserGroupMemberQuery): Promise<{ items: UserGroupMemberItem[]; total: number }> {
    await this.getGroupOrThrow(id);
    return this.groups.listMembers(id, query);
  }

  async setMembers(id: number, userIds: number[]): Promise<{ count: number }> {
    const group = await this.getGroupOrThrow(id);
    const unique = Array.from(new Set(userIds));
    if (this.isSystemGroup(group)) {
      // 系统管理组：受保护成员（Calvin）不可移除——从组内按姓名找回并强制保留
      for (const name of PROTECTED_MEMBER_NAMES) {
        const found = await this.groups.listMembers(id, { page: 1, pageSize: 50, keyword: name });
        for (const member of found.items) {
          if (PROTECTED_MEMBER_NAMES.has(member.name) && !unique.includes(member.id)) {
            unique.push(member.id);
          }
        }
      }
    }
    await this.groups.setMembers(id, unique);
    return { count: unique.length };
  }

  async setRoles(id: number, roleIds: number[]): Promise<UserGroupRoleItem[]> {
    const group = await this.getGroupOrThrow(id);
    if (this.isSystemGroup(group)) {
      throw new ConflictException({
        code: ApiErrorCode.FORBIDDEN,
        message: `系统用户组不可修改角色绑定: ${group.code}`,
      });
    }
    return this.groups.setRoles(id, Array.from(new Set(roleIds)));
  }
}
