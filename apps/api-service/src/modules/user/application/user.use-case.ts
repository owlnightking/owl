import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { ApiErrorCode } from "@owl/shared";
import { ROLE_REPOSITORY, type RoleItem, type RoleRepositoryPort } from "../../role/index";
import { USER_REPOSITORY, type UserListItem, type UserQuery, type UserRepositoryPort } from "../domain/user.ports";

export const USER_SERVICE = Symbol("USER_SERVICE");

export interface UserService {
  list(query: UserQuery): Promise<{ items: UserListItem[]; total: number }>;
  getUserRoles(userId: string): Promise<RoleItem[]>;
  assignRoles(userId: string, roleIds: string[]): Promise<void>;
  updateStatus(userId: string, status: "active" | "disabled"): Promise<void>;
  listRoles(): Promise<{ id: string; code: string; name: string; isSystem: boolean }[]>;
}

@Injectable()
export class UserUseCase implements UserService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepositoryPort
  ) {}

  async list(query: UserQuery): Promise<{ items: UserListItem[]; total: number }> {
    return this.users.list(query);
  }

  async getUserRoles(userId: string): Promise<RoleItem[]> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new NotFoundException({ code: ApiErrorCode.NOT_FOUND, message: `用户不存在: ${userId}` });
    }
    const allRoles = await this.roles.list();
    const userRoleIds = new Set(user.roles.map((r) => r.id));
    return allRoles.filter((r) => userRoleIds.has(r.id));
  }

  async assignRoles(userId: string, roleIds: string[]): Promise<void> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new NotFoundException({ code: ApiErrorCode.NOT_FOUND, message: `用户不存在: ${userId}` });
    }
    const validRoleIds = new Set((await this.roles.list()).map((r) => r.id));
    const invalid = roleIds.filter((id) => !validRoleIds.has(id));
    if (invalid.length > 0) {
      throw new NotFoundException({ code: ApiErrorCode.NOT_FOUND, message: `角色不存在: ${invalid.join(",")}` });
    }
    await this.users.assignRoles(userId, roleIds);
  }

  async updateStatus(userId: string, status: "active" | "disabled"): Promise<void> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new NotFoundException({ code: ApiErrorCode.NOT_FOUND, message: `用户不存在: ${userId}` });
    }
    await this.users.updateStatus(userId, status);
  }

  async listRoles(): Promise<{ id: string; code: string; name: string; isSystem: boolean }[]> {
    return this.users.listRoles();
  }
}
