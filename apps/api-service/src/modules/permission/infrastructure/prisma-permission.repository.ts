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
    id: string;
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
    const rows = await this.prisma.permission.findMany({ orderBy: { code: "asc" } });
    return rows.map(this.toItem);
  }

  async findById(id: string): Promise<PermissionItem | null> {
    const row = await this.prisma.permission.findUnique({ where: { id } });
    return row ? this.toItem(row) : null;
  }

  async findByCode(code: string): Promise<PermissionItem | null> {
    const row = await this.prisma.permission.findUnique({ where: { code } });
    return row ? this.toItem(row) : null;
  }

  async create(input: PermissionCreateInput): Promise<PermissionItem> {
    const row = await this.prisma.permission.create({ data: input });
    return this.toItem(row);
  }

  async update(id: string, input: PermissionUpdateInput): Promise<PermissionItem | null> {
    const row = await this.prisma.permission.update({ where: { id }, data: input }).catch(() => null);
    return row ? this.toItem(row) : null;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.permission.delete({ where: { id } });
  }
}
