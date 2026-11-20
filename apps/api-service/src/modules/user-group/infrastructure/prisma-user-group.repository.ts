import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CLIENT } from "@owl/database/provider";
import type { PrismaClient } from "@owl/database";
import type {
  UserGroupCreateInput,
  UserGroupItem,
  UserGroupMemberItem,
  UserGroupMemberQuery,
  UserGroupQuery,
  UserGroupRepositoryPort,
  UserGroupRoleItem,
  UserGroupUpdateInput,
} from "../domain/user-group.ports";

const GROUP_INCLUDE = {
  roles: { where: { deletedAt: null, role: { deletedAt: null } }, include: { role: true } },
  _count: { select: { members: { where: { deletedAt: null, user: { deletedAt: null } } } } },
} as const;

type GroupRow = {
  id: number;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  createdAt: Date;
  roles: { role: { id: number; code: string; name: string } }[];
  _count: { members: number };
};

@Injectable()
export class PrismaUserGroupRepository implements UserGroupRepositoryPort {
  constructor(@Inject(DATABASE_CLIENT) private readonly prisma: PrismaClient) {}

  private toItem(raw: GroupRow): UserGroupItem {
    return {
      id: raw.id,
      code: raw.code,
      name: raw.name,
      description: raw.description,
      isSystem: raw.isSystem,
      memberCount: raw._count.members,
      roles: raw.roles.map((item) => item.role),
      createdAt: raw.createdAt,
    };
  }

  async list(query: UserGroupQuery): Promise<{ items: UserGroupItem[]; total: number }> {
    const where = {
      deletedAt: null,
      ...(query.keyword ? { OR: [{ code: { contains: query.keyword } }, { name: { contains: query.keyword } }] } : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.userGroup.findMany({
        where,
        include: GROUP_INCLUDE,
        orderBy: [{ isSystem: "desc" }, { createdAt: "asc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.userGroup.count({ where }),
    ]);
    return { items: rows.map((row) => this.toItem(row)), total };
  }

  async listOptions(): Promise<UserGroupItem[]> {
    const rows = await this.prisma.userGroup.findMany({
      where: { deletedAt: null },
      include: GROUP_INCLUDE,
      orderBy: [{ isSystem: "desc" }, { createdAt: "asc" }],
    });
    return rows.map((row) => this.toItem(row));
  }

  async findById(id: number): Promise<UserGroupItem | null> {
    const row = await this.prisma.userGroup.findUnique({ where: { id, deletedAt: null }, include: GROUP_INCLUDE });
    return row ? this.toItem(row) : null;
  }

  async findByCode(code: string): Promise<UserGroupItem | null> {
    const row = await this.prisma.userGroup.findUnique({ where: { code, deletedAt: null }, include: GROUP_INCLUDE });
    return row ? this.toItem(row) : null;
  }

  async create(input: UserGroupCreateInput): Promise<UserGroupItem> {
    // code 唯一约束包含已软删除的行，用 upsert 复用历史用户组
    const row = await this.prisma.userGroup.upsert({
      where: { code: input.code },
      update: { name: input.name, description: input.description ?? null, deletedAt: null },
      create: { code: input.code, name: input.name, description: input.description ?? null },
      include: GROUP_INCLUDE,
    });
    return this.toItem(row);
  }

  async update(id: number, input: UserGroupUpdateInput): Promise<UserGroupItem | null> {
    const exists = await this.prisma.userGroup.findUnique({ where: { id, deletedAt: null } });
    if (!exists) {
      return null;
    }
    const row = await this.prisma.userGroup.update({ where: { id }, data: input, include: GROUP_INCLUDE });
    return this.toItem(row);
  }

  async delete(id: number): Promise<void> {
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.userGroup.update({ where: { id }, data: { deletedAt: now } }),
      this.prisma.userGroupMember.updateMany({ where: { groupId: id }, data: { deletedAt: now } }),
      this.prisma.roleGroup.updateMany({ where: { groupId: id }, data: { deletedAt: now } }),
    ]);
  }

  async listMembers(
    groupId: number,
    query: UserGroupMemberQuery
  ): Promise<{ items: UserGroupMemberItem[]; total: number }> {
    const where = {
      groupId,
      deletedAt: null,
      group: { deletedAt: null },
      user: {
        deletedAt: null,
        ...(query.keyword
          ? { OR: [{ name: { contains: query.keyword } }, { email: { contains: query.keyword } }] }
          : {}),
      },
    };
    const [rows, total] = await Promise.all([
      this.prisma.userGroupMember.findMany({
        where,
        include: { user: true },
        orderBy: { id: "asc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.userGroupMember.count({ where }),
    ]);
    return {
      items: rows.map((row) => ({
        id: row.user.id,
        name: row.user.name,
        email: row.user.email,
        avatarUrl: row.user.avatar640,
        status: row.user.status,
        joinedAt: row.createdAt,
      })),
      total,
    };
  }

  async setMembers(groupId: number, userIds: number[]): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.userGroupMember.updateMany({ where: { groupId }, data: { deletedAt: new Date() } });
      for (const userId of userIds) {
        await tx.userGroupMember.upsert({
          where: { groupId_userId: { groupId, userId } },
          update: { deletedAt: null },
          create: { groupId, userId },
        });
      }
    });
  }

  async setRoles(groupId: number, roleIds: number[]): Promise<UserGroupRoleItem[]> {
    await this.prisma.$transaction(async (tx) => {
      await tx.roleGroup.updateMany({ where: { groupId }, data: { deletedAt: new Date() } });
      for (const roleId of roleIds) {
        await tx.roleGroup.upsert({
          where: { roleId_groupId: { roleId, groupId } },
          update: { deletedAt: null },
          create: { roleId, groupId },
        });
      }
    });
    const rows = await this.prisma.roleGroup.findMany({
      where: { groupId, deletedAt: null, role: { deletedAt: null } },
      include: { role: true },
    });
    return rows.map((row) => ({ id: row.role.id, code: row.role.code, name: row.role.name }));
  }
}
