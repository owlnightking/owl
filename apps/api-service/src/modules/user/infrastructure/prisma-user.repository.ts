import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CLIENT } from "@owl/database/provider";
import type { PrismaClient } from "@owl/database";
import type { UserGroupBrief, UserListItem, UserQuery, UserRepositoryPort } from "../domain/user.ports";

const USER_INCLUDE = {
  groups: {
    where: { deletedAt: null, group: { deletedAt: null } },
    include: { group: true },
  },
} as const;

type UserRow = {
  id: number;
  unionId: string;
  openId: string;
  name: string;
  avatar640: string | null;
  email: string | null;
  status: string;
  lastLoginAt: Date | null;
  createdAt: Date;
  groups: { group: { id: number; code: string; name: string } }[];
};

@Injectable()
export class PrismaUserRepository implements UserRepositoryPort {
  constructor(@Inject(DATABASE_CLIENT) private readonly prisma: PrismaClient) {}

  private toItem(raw: UserRow): UserListItem {
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
      groups: raw.groups.map((item) => item.group),
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
        include: USER_INCLUDE,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);
    return { items: rows.map((row) => this.toItem(row)), total };
  }

  async findById(id: number): Promise<UserListItem | null> {
    const user = await this.prisma.user.findUnique({ where: { id, deletedAt: null }, include: USER_INCLUDE });
    return user ? this.toItem(user) : null;
  }

  async updateStatus(userId: number, status: string): Promise<void> {
    await this.prisma.user.update({ where: { id: userId, deletedAt: null }, data: { status } });
  }

  async listGroups(): Promise<UserGroupBrief[]> {
    const rows = await this.prisma.userGroup.findMany({
      where: { deletedAt: null },
      orderBy: [{ isSystem: "desc" }, { createdAt: "asc" }],
    });
    return rows.map((row) => ({ id: row.id, code: row.code, name: row.name }));
  }
}
