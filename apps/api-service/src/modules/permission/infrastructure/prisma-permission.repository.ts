import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CLIENT } from "@owl/database/provider";
import type { PrismaClient } from "@owl/database";
import type {
  PermissionCreateInput,
  PermissionItem,
  PermissionNodeType,
  PermissionRepositoryPort,
  PermissionUpdateInput,
} from "../domain/permission.ports";
import { splitPermissionCode } from "../domain/permission.ports";

type PermissionRow = {
  id: number;
  code: string;
  name: string;
  type: string;
  parentId: number | null;
  app: string | null;
  path: string | null;
  sort: number;
  source: string;
  resource: string;
  action: string;
  description: string | null;
  createdAt: Date;
};

function toNodeType(value: string): PermissionNodeType {
  return value === "page" || value === "tab" ? value : "button";
}

@Injectable()
export class PrismaPermissionRepository implements PermissionRepositoryPort {
  constructor(@Inject(DATABASE_CLIENT) private readonly prisma: PrismaClient) {}

  private toItem(raw: PermissionRow): PermissionItem {
    return {
      id: raw.id,
      code: raw.code,
      name: raw.name,
      type: toNodeType(raw.type),
      parentId: raw.parentId,
      app: raw.app,
      path: raw.path,
      sort: raw.sort,
      source: raw.source,
      resource: raw.resource,
      action: raw.action,
      description: raw.description,
      createdAt: raw.createdAt,
    };
  }

  async list(): Promise<PermissionItem[]> {
    const rows = await this.prisma.permission.findMany({
      where: { deletedAt: null },
      orderBy: [{ app: "asc" }, { sort: "asc" }, { id: "asc" }],
    });
    return rows.map((row) => this.toItem(row));
  }

  async findById(id: number): Promise<PermissionItem | null> {
    const row = await this.prisma.permission.findUnique({ where: { id, deletedAt: null } });
    return row ? this.toItem(row) : null;
  }

  async findByCode(code: string): Promise<PermissionItem | null> {
    const row = await this.prisma.permission.findUnique({ where: { code, deletedAt: null } });
    return row ? this.toItem(row) : null;
  }

  async create(input: PermissionCreateInput & { resource: string; action: string }): Promise<PermissionItem> {
    // 编码唯一约束包含已软删除的行，用 upsert 复用历史节点而不是插入冲突
    const row = await this.prisma.permission.upsert({
      where: { code: input.code },
      update: {
        name: input.name,
        type: input.type,
        parentId: input.parentId,
        resource: input.resource,
        action: input.action,
        description: input.description ?? null,
        source: "manual",
        deletedAt: null,
      },
      create: {
        code: input.code,
        name: input.name,
        type: input.type,
        parentId: input.parentId,
        resource: input.resource,
        action: input.action,
        description: input.description ?? null,
        source: "manual",
      },
    });
    return this.toItem(row);
  }

  async update(id: number, input: PermissionUpdateInput): Promise<PermissionItem | null> {
    const exists = await this.prisma.permission.findUnique({ where: { id, deletedAt: null } });
    if (!exists) {
      return null;
    }
    const row = await this.prisma.permission.update({ where: { id }, data: input });
    return this.toItem(row);
  }

  async delete(id: number): Promise<void> {
    const now = new Date();
    const descendants = await this.collectDescendantIds(id);
    const ids = [id, ...descendants];
    await this.prisma.$transaction([
      this.prisma.permission.updateMany({ where: { id: { in: ids } }, data: { deletedAt: now } }),
      this.prisma.rolePermission.updateMany({ where: { permissionId: { in: ids } }, data: { deletedAt: now } }),
    ]);
  }

  /** 权限树最多三层（页面 → Tab → 按钮），循环查询足够且避免递归 SQL */
  private async collectDescendantIds(rootId: number): Promise<number[]> {
    const collected: number[] = [];
    let frontier = [rootId];
    while (frontier.length > 0) {
      const children = await this.prisma.permission.findMany({
        where: { parentId: { in: frontier }, deletedAt: null },
        select: { id: true },
      });
      frontier = children.map((item) => item.id);
      collected.push(...frontier);
    }
    return collected;
  }

  async sync(
    defs: {
      code: string;
      name: string;
      type: "page" | "tab" | "button";
      app: string;
      path?: string;
      parentCode?: string;
      sort: number;
    }[]
  ): Promise<number> {
    const idByCode = new Map<string, number>();
    let synced = 0;

    for (const def of defs) {
      const { resource, action } = splitPermissionCode(def.code);
      const parentId = def.parentCode ? (idByCode.get(def.parentCode) ?? null) : null;
      const row = await this.prisma.permission.upsert({
        where: { code: def.code },
        update: {
          name: def.name,
          type: def.type,
          app: def.app,
          path: def.path ?? null,
          sort: def.sort,
          source: "route",
          resource,
          action,
          parentId,
          deletedAt: null,
        },
        create: {
          code: def.code,
          name: def.name,
          type: def.type,
          app: def.app,
          path: def.path ?? null,
          sort: def.sort,
          source: "route",
          resource,
          action,
          parentId,
        },
      });
      idByCode.set(def.code, row.id);
      synced += 1;
    }

    // 注册表里已删除的路由节点软删除；手工节点保持不动
    await this.prisma.permission.updateMany({
      where: { source: "route", code: { notIn: defs.map((def) => def.code) }, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    return synced;
  }

  async findRolePermissionIds(roleId: number): Promise<number[]> {
    const rows = await this.prisma.rolePermission.findMany({
      where: { roleId, deletedAt: null, permission: { deletedAt: null } },
      select: { permissionId: true },
    });
    return rows.map((row) => row.permissionId);
  }
}
