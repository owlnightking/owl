import { Injectable } from "@nestjs/common";
import { PrismaClient } from "@owl/database";
import type { UserListItem, UserQuery, UserRepositoryPort } from "../domain/user.ports";

@Injectable()
export class PrismaUserRepository implements UserRepositoryPort {
  constructor(private readonly prisma: PrismaClient) {}

  private toItem(raw: {
    id: string;
    unionId: string;
    openId: string;
    name: string;
    avatar640: string | null;
    email: string | null;
    status: string;
    lastLoginAt: Date | null;
    createdAt: Date;
    roles: { role: { id: string; code: string; name: string } }[];
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
    const where = query.keyword
      ? { OR: [{ name: { contains: query.keyword } }, { email: { contains: query.keyword } }] }
      : undefined;
    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: { roles: { include: { role: true } } },
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);
    return { items: rows.map((r) => this.toItem(r)), total };
  }

  async findById(id: string): Promise<UserListItem | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { roles: { include: { role: true } } },
    });
    return user ? this.toItem(user) : null;
  }

  async assignRoles(userId: string, roleIds: string[]): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.userRole.deleteMany({ where: { userId } }),
      this.prisma.userRole.createMany({
        data: roleIds.map((roleId) => ({ userId, roleId })),
        skipDuplicates: true,
      }),
    ]);
  }

  async updateStatus(userId: string, status: string): Promise<void> {
    await this.prisma.user.update({ where: { id: userId }, data: { status } });
  }

  async listRoles(): Promise<{ id: string; code: string; name: string; isSystem: boolean }[]> {
    const rows = await this.prisma.role.findMany({ orderBy: { createdAt: "asc" } });
    return rows.map((r) => ({ id: r.id, code: r.code, name: r.name, isSystem: r.isSystem }));
  }
}
