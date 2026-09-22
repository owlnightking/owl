import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CLIENT } from "@owl/database/provider";
import type { PrismaClient } from "@owl/database";
import type { UserListItem, UserQuery, UserRepositoryPort } from "../domain/user.ports";

@Injectable()
export class PrismaUserRepository implements UserRepositoryPort {
  constructor(@Inject(DATABASE_CLIENT) private readonly prisma: PrismaClient) {}

  private toItem(raw: {
    id: number;
    unionId: string;
    openId: string;
    name: string;
    avatar640: string | null;
    email: string | null;
    status: string;
    lastLoginAt: Date | null;
    createdAt: Date;
    roles: { role: { id: number; code: string; name: string } }[];
  }): UserListItem {
    return {
      id: raw.id,
      unionId: raw.unionId,
      openId: raw.openId,
      name: raw.name,
      avatarUrl: raw.avatar640,
      email: raw.email,
      status: raw.status,
      lastLoginAt: raw.lastLoginAt,
      createdAt: raw.createdAt,
      roles: raw.roles.map((r) => r.role),
    };
  }

  async list(query: UserQuery): Promise<{ items: UserListItem[]; total: number }> {
    const where = {
      deletedAt: null,
      ...(query.keyword ? { OR: [{ name: { contains: query.keyword } }, { email: { contains: query.keyword } }] } : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: { roles: { where: { deletedAt: null, role: { deletedAt: null } }, include: { role: true } } },
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);
    return { items: rows.map((r) => this.toItem(r)), total };
  }

  async findById(id: number): Promise<UserListItem | null> {
    const user = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
      include: { roles: { where: { deletedAt: null, role: { deletedAt: null } }, include: { role: true } } },
    });
    return user ? this.toItem(user) : null;
  }

  async assignRoles(userId: number, roleIds: number[]): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.userRole.updateMany({ where: { userId }, data: { deletedAt: new Date() } });
      for (const roleId of roleIds) {
        await tx.userRole.upsert({
          where: { userId_roleId: { userId, roleId } },
          update: { deletedAt: null },
          create: { userId, roleId },
        });
      }
    });
  }

  async updateStatus(userId: number, status: string): Promise<void> {
    await this.prisma.user.update({ where: { id: userId, deletedAt: null }, data: { status } });
  }

  async listRoles(): Promise<{ id: number; code: string; name: string; isSystem: boolean }[]> {
    const rows = await this.prisma.role.findMany({ where: { deletedAt: null }, orderBy: { createdAt: "asc" } });
    return rows.map((r) => ({ id: r.id, code: r.code, name: r.name, isSystem: r.isSystem }));
  }
}
