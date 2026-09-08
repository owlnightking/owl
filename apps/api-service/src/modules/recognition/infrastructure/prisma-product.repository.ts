import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CLIENT } from "@owl/database/provider";
import type { PrismaClient } from "@owl/database";
import type {
  ProductCreateInput,
  ProductItem,
  ProductRepositoryPort,
  ProductUpdateInput,
} from "../domain/product.ports";

@Injectable()
export class PrismaProductRepository implements ProductRepositoryPort {
  constructor(@Inject(DATABASE_CLIENT) private readonly prisma: PrismaClient) {}

  private toItem(raw: {
    id: string;
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

  async list(options?: {
    enabledOnly?: boolean;
    page: number;
    pageSize: number;
  }): Promise<{ items: ProductItem[]; total: number }> {
    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 20;
    const where = options?.enabledOnly ? { enabled: true } : {};

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

  async findById(id: string): Promise<ProductItem | null> {
    const row = await this.prisma.product.findUnique({ where: { id } });
    return row ? this.toItem(row) : null;
  }

  async create(input: ProductCreateInput): Promise<ProductItem> {
    const row = await this.prisma.product.create({ data: input });
    return this.toItem(row);
  }

  async update(id: string, input: ProductUpdateInput): Promise<ProductItem | null> {
    const row = await this.prisma.product.update({ where: { id }, data: input }).catch(() => null);
    return row ? this.toItem(row) : null;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.product.delete({ where: { id } });
  }

  async decrementStock(id: string, quantity: number): Promise<boolean> {
    const result = await this.prisma.product.updateMany({
      where: { id, stock: { gte: quantity } },
      data: { stock: { decrement: quantity } },
    });
    return result.count > 0;
  }

  async incrementStock(id: string, quantity: number): Promise<void> {
    await this.prisma.product.update({ where: { id }, data: { stock: { increment: quantity } } });
  }
}
