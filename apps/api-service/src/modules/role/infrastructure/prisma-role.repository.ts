import { Injectable } from "@nestjs/common";
import { PrismaClient } from "@owl/database";
import type {
  PermissionItem,
  RoleCreateInput,
  RoleItem,
  RoleRepositoryPort,
  RoleUpdateInput,
} from "../domain/role.ports";

@Injectable()
export class PrismaRoleRepository implements RoleRepositoryPort {
  constructor(private readonly prisma: PrismaClient) {}

  private toItem(raw: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    isSystem: boolean;
    createdAt: Date;
    permissions: { permission: { id: string; code: string; name: string } }[];
  }): RoleItem {
    return {
      id: raw.id,
      code: raw.code,
      name: raw.name,
      description: raw.description,
      isSystem: raw.isSystem,
      createdAt: raw.createdAt,
      permissions: raw.permissions.map((p) => p.permission),
    };
  }

  async list(): Promise<RoleItem[]> {
    const rows = await this.prisma.role.findMany({
      include: { permissions: { include: { permission: true } } },
      orderBy: { createdAt: "asc" },
    });
    return rows.map((r) => this.toItem(r));
  }

  async findById(id: string): Promise<RoleItem | null> {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: { permissions: { include: { permission: true } } },
    });
    return role ? this.toItem(role) : null;
  }

  async findByCode(code: string): Promise<RoleItem | null> {
    const role = await this.prisma.role.findUnique({
      where: { code },
      include: { permissions: { include: { permission: true } } },
    });
    return role ? this.toItem(role) : null;
  }

  async create(input: RoleCreateInput): Promise<RoleItem> {
    const role = await this.prisma.role.create({
      data: {
        code: input.code,
        name: input.name,
        description: input.description,
        permissions: {
          create: input.permissionIds.map((permissionId) => ({ permissionId })),
        },
      },
      include: { permissions: { include: { permission: true } } },
    });
    return this.toItem(role);
  }

  async update(id: string, input: RoleUpdateInput): Promise<RoleItem | null> {
    const role = await this.prisma.$transaction(async (tx) => {
      if (input.permissionIds) {
        await tx.rolePermission.deleteMany({ where: { roleId: id } });
        await tx.rolePermission.createMany({
          data: input.permissionIds.map((permissionId) => ({ roleId: id, permissionId })),
          skipDuplicates: true,
        });
      }
      return tx.role.update({
        where: { id },
        data: { name: input.name, description: input.description },
        include: { permissions: { include: { permission: true } } },
      });
    });
    return this.toItem(role);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.role.delete({ where: { id } });
  }

  async listPermissions(): Promise<PermissionItem[]> {
    const rows = await this.prisma.permission.findMany({ orderBy: [{ resource: "asc" }, { action: "asc" }] });
    return rows.map((p) => ({ id: p.id, code: p.code, name: p.name, resource: p.resource, action: p.action }));
  }
}
