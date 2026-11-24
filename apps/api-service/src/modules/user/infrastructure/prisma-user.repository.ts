import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CLIENT } from "@owl/database/provider";
import type { PrismaClient } from "@owl/database";
import type {
  UserDepartmentBrief,
  UserGroupBrief,
  UserListItem,
  UserQuery,
  UserRepositoryPort,
} from "../domain/user.ports";

const USER_INCLUDE = {
  groups: {
    where: { deletedAt: null, group: { deletedAt: null } },
    include: { group: true },
  },
  department: {
    where: { deletedAt: null },
    select: { id: true, name: true, feishuDepartmentId: true, parentId: true },
  },
} as const;

/** 部门路径回溯上限，防止脏 parentId 环导致死循环 */
const MAX_DEPT_PATH_DEPTH = 50;

type DepartmentRow = {
  id: number;
  name: string;
  feishuDepartmentId: string;
  parentId: string | null;
};

type UserRow = {
  id: number;
  unionId: string;
  openId: string;
  name: string;
  nickname: string | null;
  avatar640: string | null;
  email: string | null;
  status: string;
  lastLoginAt: Date | null;
  createdAt: Date;
  department: DepartmentRow | null;
  groups: { group: { id: number; code: string; name: string } }[];
};

@Injectable()
export class PrismaUserRepository implements UserRepositoryPort {
  constructor(@Inject(DATABASE_CLIENT) private readonly prisma: PrismaClient) {}

  private toItem(raw: UserRow, deptPathById: Map<string, string>): UserListItem {
    let department: UserDepartmentBrief | null = null;
    if (raw.department) {
      department = {
        id: raw.department.id,
        name: raw.department.name,
        path: deptPathById.get(raw.department.feishuDepartmentId) ?? raw.department.name,
      };
    }
    return {
      id: raw.id,
      unionId: raw.unionId,
      openId: raw.openId,
      name: raw.name,
      nickname: raw.nickname,
      avatarUrl: raw.avatar640,
      email: raw.email,
      status: raw.status,
      department,
      lastLoginAt: raw.lastLoginAt,
      createdAt: raw.createdAt,
      groups: raw.groups.map((item) => item.group),
    };
  }

  private async loadDeptPaths(): Promise<Map<string, string>> {
    const depts = await this.prisma.department.findMany({
      where: { deletedAt: null },
      select: { id: true, feishuDepartmentId: true, name: true, parentId: true },
    });
    const byId = new Map<string, DepartmentRow>();
    for (const d of depts) {
      byId.set(d.feishuDepartmentId, d);
    }

    const pathCache = new Map<string, string>();
    const buildPath = (feishuId: string): string => {
      const cached = pathCache.get(feishuId);
      if (cached !== undefined) return cached;
      const parts: string[] = [];
      let current = byId.get(feishuId);
      let guard = 0;
      while (current && guard < MAX_DEPT_PATH_DEPTH) {
        parts.unshift(current.name);
        current = current.parentId ? byId.get(current.parentId) : undefined;
        guard += 1;
      }
      const path = parts.length > 0 ? parts.join("/") : feishuId;
      pathCache.set(feishuId, path);
      return path;
    };

    for (const id of byId.keys()) {
      buildPath(id);
    }
    return pathCache;
  }

  async list(query: UserQuery): Promise<{ items: UserListItem[]; total: number }> {
    const where = {
      deletedAt: null,
      ...(query.keyword
        ? {
            OR: [
              { name: { contains: query.keyword } },
              { nickname: { contains: query.keyword } },
              { email: { contains: query.keyword } },
            ],
          }
        : {}),
    };
    const [rows, total, deptPathById] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: USER_INCLUDE,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.user.count({ where }),
      this.loadDeptPaths(),
    ]);
    return { items: rows.map((row) => this.toItem(row, deptPathById)), total };
  }

  async findById(id: number): Promise<UserListItem | null> {
    const [user, deptPathById] = await Promise.all([
      this.prisma.user.findUnique({ where: { id, deletedAt: null }, include: USER_INCLUDE }),
      this.loadDeptPaths(),
    ]);
    return user ? this.toItem(user, deptPathById) : null;
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
