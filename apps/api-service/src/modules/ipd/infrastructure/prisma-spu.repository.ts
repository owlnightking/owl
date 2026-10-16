import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CLIENT } from "@owl/database/provider";
import type { PrismaClient } from "@owl/database";
import type {
  SkuCreateInput,
  SkuItem,
  SkuUpdateInput,
  SpuCreateInput,
  SpuItem,
  SpuListOptions,
  SpuRepositoryPort,
  SpuUpdateInput,
} from "../domain/spu.ports";

type SpuRow = {
  id: number;
  productLineId: number;
  internalCode: string;
  spuCode: string | null;
  name: string;
  status: string;
  launchAt: Date | null;
  notes: string | null;
  createdAt: Date;
  _count?: { skus: number };
};

type SkuRow = {
  id: number;
  spuId: number;
  skuCode: string;
  name: string;
  priceUsd: unknown;
  limited: boolean;
  stock: number;
  enabled: boolean;
  notes: string | null;
  createdAt: Date;
};

@Injectable()
export class PrismaSpuRepository implements SpuRepositoryPort {
  constructor(@Inject(DATABASE_CLIENT) private readonly prisma: PrismaClient) {}

  private toSpu(row: SpuRow): SpuItem {
    return {
      id: row.id,
      productLineId: row.productLineId,
      internalCode: row.internalCode,
      spuCode: row.spuCode,
      name: row.name,
      status: row.status,
      launchAt: row.launchAt,
      notes: row.notes,
      skuCount: row._count?.skus ?? 0,
      createdAt: row.createdAt,
    };
  }

  private toSku(row: SkuRow): SkuItem {
    return {
      id: row.id,
      spuId: row.spuId,
      skuCode: row.skuCode,
      name: row.name,
      priceUsd: Number(row.priceUsd),
      limited: row.limited,
      stock: row.stock,
      enabled: row.enabled,
      notes: row.notes,
      createdAt: row.createdAt,
    };
  }

  async list(options: SpuListOptions): Promise<{ items: SpuItem[]; total: number }> {
    const where: Record<string, unknown> = { deletedAt: null };
    if (options.productLineId !== undefined) where.productLineId = options.productLineId;
    if (options.status) where.status = options.status;

    const [rows, total] = await Promise.all([
      this.prisma.spu.findMany({
        where,
        include: { _count: { select: { skus: { where: { deletedAt: null } } } } },
        orderBy: { createdAt: "desc" },
        skip: (options.page - 1) * options.pageSize,
        take: options.pageSize,
      }),
      this.prisma.spu.count({ where }),
    ]);
    return { items: rows.map((row) => this.toSpu(row)), total };
  }

  async findById(id: number): Promise<SpuItem | null> {
    const row = await this.prisma.spu.findFirst({
      where: { id, deletedAt: null },
      include: { _count: { select: { skus: { where: { deletedAt: null } } } } },
    });
    return row ? this.toSpu(row) : null;
  }

  async create(productLineId: number, input: SpuCreateInput & { internalCode: string }): Promise<SpuItem> {
    const row = await this.prisma.spu.create({
      data: {
        productLineId,
        internalCode: input.internalCode,
        name: input.name,
        notes: input.notes,
      },
      include: { _count: { select: { skus: { where: { deletedAt: null } } } } },
    });
    return this.toSpu(row);
  }

  async update(id: number, input: SpuUpdateInput): Promise<SpuItem | null> {
    const row = await this.prisma.spu
      .update({
        where: { id, deletedAt: null },
        data: input,
        include: { _count: { select: { skus: { where: { deletedAt: null } } } } },
      })
      .catch(() => null);
    return row ? this.toSpu(row) : null;
  }

  async remove(id: number): Promise<void> {
    await this.prisma.spu.update({ where: { id, deletedAt: null }, data: { deletedAt: new Date() } });
  }

  async listAllInternalCodes(): Promise<string[]> {
    const rows = await this.prisma.spu.findMany({
      where: { deletedAt: null },
      select: { internalCode: true },
    });
    return rows.map((row) => row.internalCode);
  }

  async listSkus(spuId: number): Promise<SkuItem[]> {
    const rows = await this.prisma.sku.findMany({
      where: { spuId, deletedAt: null },
      orderBy: { createdAt: "asc" },
    });
    return rows.map((row) => this.toSku(row));
  }

  async createSku(spuId: number, input: SkuCreateInput): Promise<SkuItem> {
    const row = await this.prisma.sku.create({ data: { ...input, spuId } });
    return this.toSku(row);
  }

  async updateSku(id: number, input: SkuUpdateInput): Promise<SkuItem | null> {
    const row = await this.prisma.sku.update({ where: { id, deletedAt: null }, data: input }).catch(() => null);
    return row ? this.toSku(row) : null;
  }

  async removeSku(id: number): Promise<void> {
    await this.prisma.sku.update({ where: { id, deletedAt: null }, data: { deletedAt: new Date() } });
  }
}
