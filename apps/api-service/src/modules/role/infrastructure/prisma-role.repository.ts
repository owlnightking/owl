import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CLIENT } from "@owl/database/provider";
import type { PrismaClient } from "@owl/database";
import type {
  RoleCreateInput,
  RoleGroupItem,
  RoleItem,
  RoleOption,
  RoleQuery,
  RoleRepositoryPort,
  RoleUpdateInput,
} from "../domain/role.ports";

type RoleRow = {
  id: number;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  createdAt: Date;
  permissions: { permission: { id: number; code: string; name: string } }[];
  groups: { group: { id: number; code: string; name: string } }[];
};

const ROLE_INCLUDE = {
  permissions: { where: { deletedAt: null, permission: { deletedAt: null } }, include: { permission: true } },
  groups: { where: { deletedAt: null, group: { deletedAt: null } }, include: { group: true } },
} as const;

@Injectable()
export class PrismaRoleRepository implements RoleRepositoryPort {
  constructor(@Inject(DATABASE_CLIENT) private readonly prisma: PrismaClient) {}

  private toItem(raw: RoleRow): RoleItem {
    return {
      id: raw.id,
      code: raw.code,
      name: raw.name,
      description: raw.description,
      isSystem: raw.isSystem,
      createdAt: raw.createdAt,
      permissions: raw.permissions.map((p) => p.permission),
      groups: raw.groups.map((g) => g.group),
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
        include: ROLE_INCLUDE,
        orderBy: { createdAt: "asc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.role.count({ where }),
    ]);
    return { items: rows.map((row) => this.toItem(row)), total };
  }

  async listOptions(): Promise<RoleOption[]> {
    const rows = await this.prisma.role.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "asc" },
    });
    return rows.map((row) => ({ id: row.id, code: row.code, name: row.name, isSystem: row.isSystem }));
  }

  async findById(id: number): Promise<RoleItem | null> {
    const role = await this.prisma.role.findUnique({
      where: { id, deletedAt: null },
      include: ROLE_INCLUDE,
    });
    return role ? this.toItem(role) : null;
  }

  async findByCode(code: string): Promise<RoleItem | null> {
    const role = await this.prisma.role.findUnique({
      where: { code, deletedAt: null },
      include: ROLE_INCLUDE,
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
      return tx.role.findUniqueOrThrow({ where: { id: target.id }, include: ROLE_INCLUDE });
    });
    return this.toItem(role);
  }

  async update(id: number, input: RoleUpdateInput): Promise<RoleItem | null> {
    const exists = await this.prisma.role.findUnique({ where: { id, deletedAt: null } });
    if (!exists) {
      return null;
    }
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
        where: { id },
        data: { name: input.name, description: input.description },
        include: ROLE_INCLUDE,
      });
    });
    return this.toItem(role);
  }

  async delete(id: number): Promise<void> {
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.role.update({ where: { id }, data: { deletedAt: now } }),
      this.prisma.rolePermission.updateMany({ where: { roleId: id }, data: { deletedAt: now } }),
      this.prisma.roleGroup.updateMany({ where: { roleId: id }, data: { deletedAt: now } }),
    ]);
  }

  async listGroups(roleId: number): Promise<RoleGroupItem[]> {
    const rows = await this.prisma.roleGroup.findMany({
      where: { roleId, deletedAt: null, group: { deletedAt: null } },
      include: { group: true },
    });
    return rows.map((row) => ({ id: row.group.id, code: row.group.code, name: row.group.name }));
  }

  async setGroups(roleId: number, groupIds: number[]): Promise<RoleGroupItem[]> {
    await this.prisma.$transaction(async (tx) => {
      await tx.roleGroup.updateMany({ where: { roleId }, data: { deletedAt: new Date() } });
      for (const groupId of groupIds) {
        await tx.roleGroup.upsert({
          where: { roleId_groupId: { roleId, groupId } },
          update: { deletedAt: null },
          create: { roleId, groupId },
        });
      }
    });
    return this.listGroups(roleId);
  }
}
