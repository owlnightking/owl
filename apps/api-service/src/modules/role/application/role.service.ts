import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { ApiErrorCode } from "@owl/shared";
import {
  ROLE_REPOSITORY,
  type RoleCreateInput,
  type RoleGroupItem,
  type RoleItem,
  type RoleOption,
  type RoleQuery,
  type RoleRepositoryPort,
  type RoleUpdateInput,
  type RoleServicePort,
} from "../domain/role.ports";

const SYSTEM_ROLE_CODES = new Set(["admin", "business_user", "reader", "member", "super_admin"]);

@Injectable()
export class RoleService implements RoleServicePort {
  constructor(@Inject(ROLE_REPOSITORY) private readonly roles: RoleRepositoryPort) {}

  private async getRoleOrThrow(id: number): Promise<RoleItem> {
    const role = await this.roles.findById(id);
    if (!role) {
      throw new NotFoundException({ code: ApiErrorCode.NOT_FOUND, message: `角色不存在: ${id}` });
    }
    return role;
  }

  async list(query: RoleQuery): Promise<{ items: RoleItem[]; total: number }> {
    return this.roles.list(query);
  }

  async listOptions(): Promise<RoleOption[]> {
    return this.roles.listOptions();
  }

  async create(input: RoleCreateInput): Promise<RoleItem> {
    const exists = await this.roles.findByCode(input.code);
    if (exists) {
      throw new ConflictException({ code: ApiErrorCode.CONFLICT, message: `角色编码已存在: ${input.code}` });
    }
    return this.roles.create(input);
  }

  async update(id: number, input: RoleUpdateInput): Promise<RoleItem> {
    const role = await this.getRoleOrThrow(id);
    // 系统角色允许调整权限（权限树按需变化），但不允许改名或删除
    if (role.isSystem && (input.name || input.description)) {
      throw new ConflictException({ code: ApiErrorCode.FORBIDDEN, message: `系统角色不可修改名称: ${role.code}` });
    }
    const updated = await this.roles.update(id, input);
    if (!updated) {
      throw new NotFoundException({ code: ApiErrorCode.NOT_FOUND, message: `角色不存在: ${id}` });
    }
    return updated;
  }

  async delete(id: number): Promise<void> {
    const role = await this.getRoleOrThrow(id);
    if (SYSTEM_ROLE_CODES.has(role.code)) {
      throw new ConflictException({ code: ApiErrorCode.FORBIDDEN, message: `系统角色不可删除: ${role.code}` });
    }
    await this.roles.delete(id);
  }

  async getGroups(id: number): Promise<RoleGroupItem[]> {
    await this.getRoleOrThrow(id);
    return this.roles.listGroups(id);
  }

  async setGroups(id: number, groupIds: number[]): Promise<RoleGroupItem[]> {
    await this.getRoleOrThrow(id);
    return this.roles.setGroups(id, groupIds);
  }
}
