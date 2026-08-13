import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { ApiErrorCode } from "@owl/shared";
import {
  ROLE_REPOSITORY,
  type RoleCreateInput,
  type RoleItem,
  type RoleRepositoryPort,
  type RoleUpdateInput,
  type RoleService,
} from "../domain/role.ports";

const SYSTEM_ROLE_CODES = new Set(["admin", "business_user", "reader", "member"]);

@Injectable()
export class RoleUseCase implements RoleService {
  constructor(@Inject(ROLE_REPOSITORY) private readonly roles: RoleRepositoryPort) {}

  async list(): Promise<RoleItem[]> {
    return this.roles.list();
  }

  async listPermissions(): Promise<{ id: string; code: string; name: string; resource: string; action: string }[]> {
    return this.roles.listPermissions();
  }

  async create(input: RoleCreateInput): Promise<RoleItem> {
    const exists = await this.roles.findByCode(input.code);
    if (exists) {
      throw new ConflictException({ code: ApiErrorCode.CONFLICT, message: `角色编码已存在: ${input.code}` });
    }
    return this.roles.create(input);
  }

  async update(id: string, input: RoleUpdateInput): Promise<RoleItem> {
    const role = await this.roles.findById(id);
    if (!role) {
      throw new NotFoundException({ code: ApiErrorCode.NOT_FOUND, message: `角色不存在: ${id}` });
    }
    if (role.isSystem && (input.name || input.description || input.permissionIds)) {
      throw new ConflictException({ code: ApiErrorCode.FORBIDDEN, message: `系统角色不可修改: ${role.code}` });
    }
    const updated = await this.roles.update(id, input);
    if (!updated) {
      throw new NotFoundException({ code: ApiErrorCode.NOT_FOUND, message: `角色不存在: ${id}` });
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    const role = await this.roles.findById(id);
    if (!role) {
      throw new NotFoundException({ code: ApiErrorCode.NOT_FOUND, message: `角色不存在: ${id}` });
    }
    if (SYSTEM_ROLE_CODES.has(role.code)) {
      throw new ConflictException({ code: ApiErrorCode.FORBIDDEN, message: `系统角色不可删除: ${role.code}` });
    }
    await this.roles.delete(id);
  }
}
