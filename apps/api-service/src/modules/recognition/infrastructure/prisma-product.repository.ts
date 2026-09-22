import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CLIENT } from "@owl/database/provider";
import type { PrismaClient } from "@owl/database";
import type {
  ProductCreateInput,
  ProductItem,
  ProductListOptions,
  ProductRepositoryPort,
  ProductUpdateInput,
} from "../domain/product.ports";

@Injectable()
export class PrismaProductRepository implements ProductRepositoryPort {
  constructor(@Inject(DATABASE_CLIENT) private readonly prisma: PrismaClient) {}

  private toItem(raw: {
    id: number;
    name: string;
    description: string | null;
    image: string | null;
    price: number;
    stock: number;
    enabled: boolean;
    sortOrder: number;
    createdAt: Date;
  }): ProductItem {
    return {
      id: raw.id,
      name: raw.name,
      description: raw.description,
      image: raw.image,
      price: raw.price,
      stock: raw.stock,
      enabled: raw.enabled,
      sortOrder: raw.sortOrder,
      createdAt: raw.createdAt,
    };
  }

  async list(options?: ProductListOptions): Promise<{ items: ProductItem[]; total: number }> {
    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 20;

    const where: Record<string, unknown> = { deletedAt: null };
    if (options?.keyword) {
      where.name = { contains: options.keyword, mode: "insensitive" };
    }
    if (options?.enabled !== undefined) {
      where.enabled = options.enabled;
    }

    const [rows, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy: { sortOrder: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.product.count({ where }),
    ]);

    return { items: rows.map(this.toItem), total };
  }

  async findById(id: number): Promise<ProductItem | null> {
    const row = await this.prisma.product.findUnique({ where: { id, deletedAt: null } });
    return row ? this.toItem(row) : null;
  }

  async create(input: ProductCreateInput): Promise<ProductItem> {
    const row = await this.prisma.product.create({ data: input });
    return this.toItem(row);
  }

  async update(id: number, input: ProductUpdateInput): Promise<ProductItem | null> {
    const row = await this.prisma.product.update({ where: { id, deletedAt: null }, data: input }).catch(() => null);
    return row ? this.toItem(row) : null;
  }

  async delete(id: number): Promise<void> {
    await this.prisma.product.update({ where: { id, deletedAt: null }, data: { deletedAt: new Date() } });
  }

  async decrementStock(id: number, quantity: number): Promise<boolean> {
    const result = await this.prisma.product.updateMany({
      where: { id, deletedAt: null, stock: { gte: quantity } },
      data: { stock: { decrement: quantity } },
    });
    return result.count > 0;
  }

  async incrementStock(id: number, quantity: number): Promise<void> {
    await this.prisma.product.update({ where: { id, deletedAt: null }, data: { stock: { increment: quantity } } });
  }
}
