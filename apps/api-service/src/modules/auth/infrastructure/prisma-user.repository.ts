import { Injectable } from "@nestjs/common";
import { PrismaClient } from "@owl/database";
import type { FeishuUserInfo, StoredUser, UserRepository } from "../domain/auth.ports";

export type { StoredUser, UserRepository };

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toStored(raw: {
    id: string;
    unionId: string;
    openId: string;
    name: string;
    avatarUrl: string | null;
    email: string | null;
    status: string;
    roles: { role: { code: string } }[];
  }): StoredUser {
    return {
      id: raw.id,
      unionId: raw.unionId,
      openId: raw.openId,
      name: raw.name,
      avatarUrl: raw.avatarUrl,
      email: raw.email,
      status: raw.status,
      roleCodes: raw.roles.map((r) => r.role.code),
    };
  }

  async findById(id: string): Promise<StoredUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { roles: { include: { role: true } } },
    });
    return user ? this.toStored(user) : null;
  }

  async findByUnionId(unionId: string): Promise<StoredUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { unionId },
      include: { roles: { include: { role: true } } },
    });
    return user ? this.toStored(user) : null;
  }

  async upsertFromFeishu(info: FeishuUserInfo): Promise<StoredUser> {
    const user = await this.prisma.user.upsert({
      where: { unionId: info.unionId },
      update: {
        openId: info.openId,
        name: info.name,
        avatarUrl: info.avatarUrl,
        email: info.email ?? null,
      },
      create: {
        unionId: info.unionId,
        openId: info.openId,
        name: info.name,
        avatarUrl: info.avatarUrl,
        email: info.email ?? null,
      },
      include: { roles: { include: { role: true } } },
    });
    return this.toStored(user);
  }

  async list(options: {
    keyword?: string;
    page: number;
    pageSize: number;
  }): Promise<{ items: StoredUser[]; total: number }> {
    const { keyword, page, pageSize } = options;
    const where = keyword
      ? { OR: [{ name: { contains: keyword } }, { email: { contains: keyword } }, { unionId: { contains: keyword } }] }
      : undefined;
    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: { roles: { include: { role: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);
    return { items: rows.map((r) => this.toStored(r)), total };
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

  async updateLoginTime(userId: string): Promise<void> {
    await this.prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
  }

  async findPermissionCodes(userId: string): Promise<string[]> {
    const rows = await this.prisma.userRole.findMany({
      where: { userId },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });
    const codes = new Set<string>();
    for (const ur of rows) {
      for (const rp of ur.role.permissions) {
        codes.add(rp.permission.code);
      }
    }
    return Array.from(codes);
  }
}
