import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CLIENT } from "@owl/database/provider";
import type { PrismaClient } from "@owl/database";
import type {
  PermissionCreateInput,
  PermissionItem,
  PermissionRepositoryPort,
  PermissionUpdateInput,
} from "../domain/permission.ports";

@Injectable()
export class PrismaPermissionRepository implements PermissionRepositoryPort {
  constructor(@Inject(DATABASE_CLIENT) private readonly prisma: PrismaClient) {}

  private toItem(raw: {
    id: number;
    code: string;
    name: string;
    resource: string;
    action: string;
    description: string | null;
    createdAt: Date;
  }): PermissionItem {
    return {
      id: raw.id,
      code: raw.code,
      name: raw.name,
      resource: raw.resource,
      action: raw.action,
      description: raw.description,
      createdAt: raw.createdAt,
    };
  }

  async list(): Promise<PermissionItem[]> {
    const rows = await this.prisma.permission.findMany({ where: { deletedAt: null }, orderBy: { code: "asc" } });
    return rows.map(this.toItem);
  }

  async findById(id: number): Promise<PermissionItem | null> {
    const row = await this.prisma.permission.findUnique({ where: { id, deletedAt: null } });
    return row ? this.toItem(row) : null;
  }

  async findByCode(code: string): Promise<PermissionItem | null> {
    const row = await this.prisma.permission.findUnique({ where: { code, deletedAt: null } });
    return row ? this.toItem(row) : null;
  }

  async create(input: PermissionCreateInput): Promise<PermissionItem> {
    const existing = await this.prisma.permission.findUnique({ where: { code: input.code } });
    const row = existing
      ? await this.prisma.permission.update({ where: { id: existing.id }, data: { ...input, deletedAt: null } })
      : await this.prisma.permission.create({ data: input });
    return this.toItem(row);
  }

  async update(id: number, input: PermissionUpdateInput): Promise<PermissionItem | null> {
    const row = await this.prisma.permission.update({ where: { id, deletedAt: null }, data: input }).catch(() => null);
    return row ? this.toItem(row) : null;
  }

  async delete(id: number): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.permission.update({ where: { id }, data: { deletedAt: new Date() } }),
      this.prisma.rolePermission.updateMany({ where: { permissionId: id }, data: { deletedAt: new Date() } }),
    ]);
  }
}
