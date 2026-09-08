import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CLIENT } from "@owl/database/provider";
import type { PrismaClient } from "@owl/database";
import type { BadgeCreateInput, BadgeItem, BadgeRepositoryPort, BadgeUpdateInput } from "../domain/badge.ports";

@Injectable()
export class PrismaBadgeRepository implements BadgeRepositoryPort {
  constructor(@Inject(DATABASE_CLIENT) private readonly prisma: PrismaClient) {}

  private toItem(raw: {
    id: string;
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

  async list(): Promise<BadgeItem[]> {
    const rows = await this.prisma.badge.findMany({ orderBy: { sortOrder: "asc" } });
    return rows.map(this.toItem);
  }

  async findById(id: string): Promise<BadgeItem | null> {
    const row = await this.prisma.badge.findUnique({ where: { id } });
    return row ? this.toItem(row) : null;
  }

  async create(input: BadgeCreateInput): Promise<BadgeItem> {
    const row = await this.prisma.badge.create({ data: input });
    return this.toItem(row);
  }

  async update(id: string, input: BadgeUpdateInput): Promise<BadgeItem | null> {
    const row = await this.prisma.badge.update({ where: { id }, data: input }).catch(() => null);
    return row ? this.toItem(row) : null;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.badge.delete({ where: { id } });
  }
}
