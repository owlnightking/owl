import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CLIENT } from "@owl/database/provider";
import type { PrismaClient } from "@owl/database";
import type { FeishuUserInfo, StoredUser, UserRepository } from "../domain/auth.ports";

export type { StoredUser, UserRepository };

const DEFAULT_NEW_USER_ROLE_CODE = "business_user";

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(@Inject(DATABASE_CLIENT) private readonly prisma: PrismaClient) {}

  private toStored(raw: {
    id: number;
    unionId: string;
    openId: string;
    name: string;
    avatar640: string | null;
    email: string | null;
    status: string;
    roles: { role: { code: string } }[];
  }): StoredUser {
    return {
      id: raw.id,
      unionId: raw.unionId,
      openId: raw.openId,
      name: raw.name,
      avatarUrl: raw.avatar640,
      email: raw.email,
      status: raw.status,
      roleCodes: raw.roles.map((r) => r.role.code),
    };
  }

  async findById(id: number): Promise<StoredUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
      include: { roles: { where: { deletedAt: null, role: { deletedAt: null } }, include: { role: true } } },
    });
    return user ? this.toStored(user) : null;
  }

  async findByUnionId(unionId: string): Promise<StoredUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { unionId, deletedAt: null },
      include: { roles: { where: { deletedAt: null, role: { deletedAt: null } }, include: { role: true } } },
    });
    return user ? this.toStored(user) : null;
  }

  async upsertFromFeishu(info: FeishuUserInfo): Promise<StoredUser> {
    const existing = await this.prisma.user.findUnique({ where: { unionId: info.unionId } });
    if (existing) {
      const updated = await this.prisma.user.update({
        where: { id: existing.id },
        data: {
          openId: info.openId,
          name: info.name,
          avatar640: info.avatarUrl,
          email: info.email ?? null,
          deletedAt: null,
        },
        include: { roles: { where: { deletedAt: null, role: { deletedAt: null } }, include: { role: true } } },
      });
      return this.toStored(updated);
    }
    const role = await this.prisma.role.findUnique({ where: { code: DEFAULT_NEW_USER_ROLE_CODE, deletedAt: null } });
    const created = await this.prisma.user.create({
      data: {
        unionId: info.unionId,
        openId: info.openId,
        name: info.name,
        avatar640: info.avatarUrl,
        email: info.email ?? null,
        roles: role ? { create: [{ roleId: role.id }] } : undefined,
      },
      include: { roles: { where: { deletedAt: null, role: { deletedAt: null } }, include: { role: true } } },
    });
    return this.toStored(created);
  }

  async list(options: {
    keyword?: string;
    page: number;
    pageSize: number;
  }): Promise<{ items: StoredUser[]; total: number }> {
    const { keyword, page, pageSize } = options;
    const where = {
      deletedAt: null,
      ...(keyword
        ? {
            OR: [{ name: { contains: keyword } }, { email: { contains: keyword } }, { unionId: { contains: keyword } }],
          }
        : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: { roles: { where: { deletedAt: null, role: { deletedAt: null } }, include: { role: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);
    return { items: rows.map((r) => this.toStored(r)), total };
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

  async updateLoginTime(userId: number): Promise<void> {
    await this.prisma.user.update({ where: { id: userId, deletedAt: null }, data: { lastLoginAt: new Date() } });
  }

  async findPermissionCodes(userId: number): Promise<string[]> {
    const rows = await this.prisma.userRole.findMany({
      where: { userId, deletedAt: null, role: { deletedAt: null } },
      include: {
        role: {
          include: {
            permissions: {
              where: { deletedAt: null, permission: { deletedAt: null } },
              include: { permission: true },
            },
          },
        },
      },
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
