import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CLIENT } from "@owl/database/provider";
import type { PrismaClient } from "@owl/database";
import type {
  ProductLineCreateInput,
  ProductLineDetail,
  ProductLineListOptions,
  ProductLineRepositoryPort,
  ProductLineStageInput,
  ProductLineUpdateInput,
} from "../domain/product-line.ports";

type ProductLineRow = {
  id: number;
  code: string;
  name: string;
  styleDesc: string | null;
  ipdStage: string;
  lifecycleStage: string;
  targetMarket: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: { spus: number };
};

@Injectable()
export class PrismaProductLineRepository implements ProductLineRepositoryPort {
  constructor(@Inject(DATABASE_CLIENT) private readonly prisma: PrismaClient) {}

  private toDetail(row: ProductLineRow): ProductLineDetail {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      styleDesc: row.styleDesc,
      ipdStage: row.ipdStage,
      lifecycleStage: row.lifecycleStage,
      targetMarket: row.targetMarket,
      notes: row.notes,
      spuCount: row._count?.spus ?? 0,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async list(options: ProductLineListOptions): Promise<{ items: ProductLineDetail[]; total: number }> {
    const where: Record<string, unknown> = { deletedAt: null };
    if (options.keyword) {
      where.OR = [
        { name: { contains: options.keyword, mode: "insensitive" } },
        { code: { contains: options.keyword, mode: "insensitive" } },
      ];
    }
    if (options.ipdStage) where.ipdStage = options.ipdStage;
    if (options.lifecycleStage) where.lifecycleStage = options.lifecycleStage;

    const [rows, total] = await Promise.all([
      this.prisma.productLine.findMany({
        where,
        include: { _count: { select: { spus: { where: { deletedAt: null } } } } },
        orderBy: { createdAt: "desc" },
        skip: (options.page - 1) * options.pageSize,
        take: options.pageSize,
      }),
      this.prisma.productLine.count({ where }),
    ]);
    return { items: rows.map((row) => this.toDetail(row)), total };
  }

  async findById(id: number): Promise<ProductLineDetail | null> {
    const row = await this.prisma.productLine.findFirst({
      where: { id, deletedAt: null },
      include: { _count: { select: { spus: { where: { deletedAt: null } } } } },
    });
    return row ? this.toDetail(row) : null;
  }

  async create(input: ProductLineCreateInput & { code: string }): Promise<ProductLineDetail> {
    const row = await this.prisma.productLine.create({
      data: {
        code: input.code,
        name: input.name,
        styleDesc: input.styleDesc,
        targetMarket: input.targetMarket,
        notes: input.notes,
      },
      include: { _count: { select: { spus: { where: { deletedAt: null } } } } },
    });
    return this.toDetail(row);
  }

  async update(id: number, input: ProductLineUpdateInput): Promise<ProductLineDetail | null> {
    const row = await this.prisma.productLine
      .update({
        where: { id, deletedAt: null },
        data: input,
        include: { _count: { select: { spus: { where: { deletedAt: null } } } } },
      })
      .catch(() => null);
    return row ? this.toDetail(row) : null;
  }

  async updateStages(id: number, input: ProductLineStageInput): Promise<ProductLineDetail | null> {
    const row = await this.prisma.productLine
      .update({
        where: { id, deletedAt: null },
        data: {
          ...(input.ipdStage !== undefined ? { ipdStage: input.ipdStage } : {}),
          ...(input.lifecycleStage !== undefined ? { lifecycleStage: input.lifecycleStage } : {}),
        },
        include: { _count: { select: { spus: { where: { deletedAt: null } } } } },
      })
      .catch(() => null);
    return row ? this.toDetail(row) : null;
  }

  async remove(id: number): Promise<void> {
    await this.prisma.productLine.update({ where: { id, deletedAt: null }, data: { deletedAt: new Date() } });
  }

  async listAllCodes(): Promise<string[]> {
    const rows = await this.prisma.productLine.findMany({
      where: { deletedAt: null },
      select: { code: true },
    });
    return rows.map((row) => row.code);
  }
}
