import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CLIENT } from "@owl/database/provider";
import type { PrismaClient } from "@owl/database";
import type {
  PermissionItem,
  RoleCreateInput,
  RoleItem,
  RoleOption,
  RoleQuery,
  RoleRepositoryPort,
  RoleUpdateInput,
} from "../domain/role.ports";

@Injectable()
export class PrismaRoleRepository implements RoleRepositoryPort {
  constructor(@Inject(DATABASE_CLIENT) private readonly prisma: PrismaClient) {}

  private toItem(raw: {
    id: number;
    code: string;
    name: string;
    description: string | null;
    isSystem: boolean;
    createdAt: Date;
    permissions: { permission: { id: number; code: string; name: string } }[];
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

  async list(query: RoleQuery): Promise<{ items: RoleItem[]; total: number }> {
    const where = {
      deletedAt: null,
      ...(query.keyword ? { OR: [{ code: { contains: query.keyword } }, { name: { contains: query.keyword } }] } : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.role.findMany({
        where,
        include: {
          permissions: { where: { deletedAt: null, permission: { deletedAt: null } }, include: { permission: true } },
        },
        orderBy: { createdAt: "asc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.role.count({ where }),
    ]);
    return { items: rows.map((r) => this.toItem(r)), total };
  }

  async listOptions(): Promise<RoleOption[]> {
    const rows = await this.prisma.role.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "asc" },
    });
    return rows.map((r) => ({ id: r.id, code: r.code, name: r.name, isSystem: r.isSystem }));
  }

  async findById(id: number): Promise<RoleItem | null> {
    const role = await this.prisma.role.findUnique({
      where: { id, deletedAt: null },
      include: {
        permissions: { where: { deletedAt: null, permission: { deletedAt: null } }, include: { permission: true } },
      },
    });
    return role ? this.toItem(role) : null;
  }

  async findByCode(code: string): Promise<RoleItem | null> {
    const role = await this.prisma.role.findUnique({
      where: { code, deletedAt: null },
      include: {
        permissions: { where: { deletedAt: null, permission: { deletedAt: null } }, include: { permission: true } },
      },
    });
    return role ? this.toItem(role) : null;
  }

  async create(input: RoleCreateInput): Promise<RoleItem> {
    const existing = await this.prisma.role.findUnique({ where: { code: input.code } });
    const role = await this.prisma.$transaction(async (tx) => {
      const target = existing
        ? await tx.role.update({
            where: { id: existing.id },
            data: { name: input.name, description: input.description, deletedAt: null },
          })
        : await tx.role.create({
            data: { code: input.code, name: input.name, description: input.description },
          });
      await tx.rolePermission.updateMany({ where: { roleId: target.id }, data: { deletedAt: new Date() } });
      for (const permissionId of input.permissionIds) {
        await tx.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: target.id, permissionId } },
          update: { deletedAt: null },
          create: { roleId: target.id, permissionId },
        });
      }
      return tx.role.findUniqueOrThrow({
        where: { id: target.id },
        include: {
          permissions: { where: { deletedAt: null, permission: { deletedAt: null } }, include: { permission: true } },
        },
      });
    });
    return this.toItem(role);
  }

  async update(id: number, input: RoleUpdateInput): Promise<RoleItem | null> {
    const role = await this.prisma.$transaction(async (tx) => {
      if (input.permissionIds) {
        await tx.rolePermission.updateMany({ where: { roleId: id }, data: { deletedAt: new Date() } });
        for (const permissionId of input.permissionIds) {
          await tx.rolePermission.upsert({
            where: { roleId_permissionId: { roleId: id, permissionId } },
            update: { deletedAt: null },
            create: { roleId: id, permissionId },
          });
        }
      }
      return tx.role.update({
        where: { id, deletedAt: null },
        data: { name: input.name, description: input.description },
        include: {
          permissions: { where: { deletedAt: null, permission: { deletedAt: null } }, include: { permission: true } },
        },
      });
    });
    return this.toItem(role);
  }

  async delete(id: number): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.role.update({ where: { id }, data: { deletedAt: new Date() } }),
      this.prisma.rolePermission.updateMany({ where: { roleId: id }, data: { deletedAt: new Date() } }),
      this.prisma.userRole.updateMany({ where: { roleId: id }, data: { deletedAt: new Date() } }),
    ]);
  }

  async listPermissions(): Promise<PermissionItem[]> {
    const rows = await this.prisma.permission.findMany({
      where: { deletedAt: null },
      orderBy: [{ resource: "asc" }, { action: "asc" }],
    });
    return rows.map((p) => ({ id: p.id, code: p.code, name: p.name, resource: p.resource, action: p.action }));
  }
}
