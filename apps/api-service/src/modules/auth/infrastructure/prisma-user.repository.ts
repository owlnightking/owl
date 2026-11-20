import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CLIENT } from "@owl/database/provider";
import type { PrismaClient } from "@owl/database";
import type { FeishuUserInfo, StoredUser, UserRepository } from "../domain/auth.ports";
import { PermissionCacheService } from "./permission-cache.service";

export type { StoredUser, UserRepository };

/** 新用户默认加入的全员组（seed 维护），保证登录后至少有基础权限 */
const DEFAULT_USER_GROUP_CODE = "all_staff";

type UserWithGroups = {
  id: number;
  unionId: string;
  openId: string;
  name: string;
  avatar640: string | null;
  email: string | null;
  status: string;
  groups: {
    group: {
      roles: { role: { code: string } }[];
    };
  }[];
};

const USER_INCLUDE = {
  groups: {
    where: { deletedAt: null, group: { deletedAt: null } },
    include: {
      group: {
        include: {
          roles: {
            where: { deletedAt: null, role: { deletedAt: null } },
            include: { role: true },
          },
        },
      },
    },
  },
} as const;

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(
    @Inject(DATABASE_CLIENT) private readonly prisma: PrismaClient,
    private readonly permissionCache: PermissionCacheService
  ) {}

  private toStored(raw: UserWithGroups): StoredUser {
    const roleCodes = new Set<string>();
    for (const member of raw.groups) {
      for (const roleGroup of member.group.roles) {
        roleCodes.add(roleGroup.role.code);
      }
    }
    return {
      id: raw.id,
      unionId: raw.unionId,
      openId: raw.openId,
      name: raw.name,
      avatarUrl: raw.avatar640,
      email: raw.email,
      status: raw.status,
      roleCodes: Array.from(roleCodes),
    };
  }

  async findById(id: number): Promise<StoredUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
      include: USER_INCLUDE,
    });
    return user ? this.toStored(user) : null;
  }

  async findByUnionId(unionId: string): Promise<StoredUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { unionId, deletedAt: null },
      include: USER_INCLUDE,
    });
    return user ? this.toStored(user) : null;
  }

  async upsertFromFeishu(info: FeishuUserInfo): Promise<StoredUser> {
    const existing = await this.prisma.user.findUnique({ where: { unionId: info.unionId } });
    const user = existing
      ? await this.prisma.user.update({
          where: { id: existing.id },
          data: {
            openId: info.openId,
            name: info.name,
            avatar640: info.avatarUrl,
            email: info.email ?? null,
            deletedAt: null,
          },
        })
      : await this.prisma.user.create({
          data: {
            unionId: info.unionId,
            openId: info.openId,
            name: info.name,
            avatar640: info.avatarUrl,
            email: info.email ?? null,
          },
        });

    const defaultGroup = await this.prisma.userGroup.findUnique({
      where: { code: DEFAULT_USER_GROUP_CODE, deletedAt: null },
    });
    if (defaultGroup) {
      await this.prisma.userGroupMember.upsert({
        where: { groupId_userId: { groupId: defaultGroup.id, userId: user.id } },
        update: { deletedAt: null },
        create: { groupId: defaultGroup.id, userId: user.id },
      });
    }
    await this.permissionCache.clear(user.id);
    const stored = await this.findById(user.id);
    if (!stored) {
      throw new Error(`user ${user.id} 创建后查询失败`);
    }
    return stored;
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
        include: USER_INCLUDE,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);
    return { items: rows.map((row) => this.toStored(row)), total };
  }

  async updateLoginTime(userId: number): Promise<void> {
    await this.prisma.user.update({ where: { id: userId, deletedAt: null }, data: { lastLoginAt: new Date() } });
  }

  async findPermissionCodes(userId: number): Promise<string[]> {
    const cached = await this.permissionCache.get(userId);
    if (cached) {
      return cached;
    }
    const memberships = await this.prisma.userGroupMember.findMany({
      where: { userId, deletedAt: null, group: { deletedAt: null } },
      include: {
        group: {
          include: {
            roles: {
              where: { deletedAt: null, role: { deletedAt: null } },
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
            },
          },
        },
      },
    });
    const codes = new Set<string>();
    for (const membership of memberships) {
      for (const roleGroup of membership.group.roles) {
        for (const rolePermission of roleGroup.role.permissions) {
          codes.add(rolePermission.permission.code);
        }
      }
    }
    const result = Array.from(codes);
    await this.permissionCache.set(userId, result);
    return result;
  }
}
