import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CLIENT } from "@owl/database/provider";
import type { PrismaClient } from "@owl/database";
import type {
  BadgeCreateInput,
  BadgeItem,
  BadgeQuery,
  BadgeRepositoryPort,
  BadgeUpdateInput,
} from "../domain/badge.ports";

@Injectable()
export class PrismaBadgeRepository implements BadgeRepositoryPort {
  constructor(@Inject(DATABASE_CLIENT) private readonly prisma: PrismaClient) {}

  private toItem(raw: {
    id: number;
    name: string;
    icon: string | null;
    description: string | null;
    coinReward: number;
    expReward: number;
    enabled: boolean;
    sortOrder: number;
    createdAt: Date;
  }): BadgeItem {
    return {
      id: raw.id,
      name: raw.name,
      icon: raw.icon,
      description: raw.description,
      coinReward: raw.coinReward,
      expReward: raw.expReward,
      enabled: raw.enabled,
      sortOrder: raw.sortOrder,
      createdAt: raw.createdAt,
    };
  }

  async list(query: BadgeQuery): Promise<{ items: BadgeItem[]; total: number }> {
    const where = {
      deletedAt: null,
      ...(query.keyword ? { name: { contains: query.keyword } } : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.badge.findMany({
        where,
        orderBy: { sortOrder: "asc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.badge.count({ where }),
    ]);
    return { items: rows.map(this.toItem), total };
  }

  async listOptions(): Promise<BadgeItem[]> {
    const rows = await this.prisma.badge.findMany({ where: { deletedAt: null }, orderBy: { sortOrder: "asc" } });
    return rows.map(this.toItem);
  }

  async findById(id: number): Promise<BadgeItem | null> {
    const row = await this.prisma.badge.findUnique({ where: { id, deletedAt: null } });
    return row ? this.toItem(row) : null;
  }

  async create(input: BadgeCreateInput): Promise<BadgeItem> {
    const row = await this.prisma.badge.create({ data: input });
    return this.toItem(row);
  }

  async update(id: number, input: BadgeUpdateInput): Promise<BadgeItem | null> {
    const row = await this.prisma.badge.update({ where: { id, deletedAt: null }, data: input }).catch(() => null);
    return row ? this.toItem(row) : null;
  }

  async delete(id: number): Promise<void> {
    await this.prisma.badge.update({ where: { id, deletedAt: null }, data: { deletedAt: new Date() } });
  }
}
