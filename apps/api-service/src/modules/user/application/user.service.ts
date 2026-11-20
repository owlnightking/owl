import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { ApiErrorCode } from "@owl/shared";
import {
  USER_REPOSITORY,
  type UserGroupBrief,
  type UserListItem,
  type UserQuery,
  type UserRepositoryPort,
} from "../domain/user.ports";

export const USER_SERVICE = Symbol("USER_SERVICE");

export interface UserServicePort {
  list(query: UserQuery): Promise<{ items: UserListItem[]; total: number }>;
  listGroups(): Promise<UserGroupBrief[]>;
  updateStatus(userId: number, status: "active" | "disabled"): Promise<void>;
}

@Injectable()
export class UserService implements UserServicePort {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort) {}

  async list(query: UserQuery): Promise<{ items: UserListItem[]; total: number }> {
    return this.users.list(query);
  }

  async listGroups(): Promise<UserGroupBrief[]> {
    return this.users.listGroups();
  }

  async updateStatus(userId: number, status: "active" | "disabled"): Promise<void> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new NotFoundException({ code: ApiErrorCode.NOT_FOUND, message: `用户不存在: ${userId}` });
    }
    await this.users.updateStatus(userId, status);
  }
}
