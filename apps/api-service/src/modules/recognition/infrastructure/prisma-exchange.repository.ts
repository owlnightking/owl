import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CLIENT } from "@owl/database/provider";
import type { PrismaClient } from "@owl/database";
import type {
  ExchangeCreateInput,
  ExchangeListQuery,
  ExchangeOrderItem,
  ExchangeRepositoryPort,
} from "../domain/exchange.ports";

@Injectable()
export class PrismaExchangeRepository implements ExchangeRepositoryPort {
  constructor(@Inject(DATABASE_CLIENT) private readonly prisma: PrismaClient) {}

  private async toItem(raw: {
    id: number;
    userId: number;
    productId: number;
    quantity: number;
    totalCost: number;
    status: string;
    approverId: number | null;
    approvedAt: Date | null;
    rejectReason: string | null;
    fulfilledAt: Date | null;
    createdAt: Date;
    user?: { name: string } | null;
    product?: { name: string; image: string | null } | null;
  }): Promise<ExchangeOrderItem> {
    return {
      id: raw.id,
      userId: raw.userId,
      userName: raw.user?.name,
      productId: raw.productId,
      productName: raw.product?.name,
      productImage: raw.product?.image ?? undefined,
      quantity: raw.quantity,
      totalCost: raw.totalCost,
      status: raw.status as ExchangeOrderItem["status"],
      approverId: raw.approverId,
      approvedAt: raw.approvedAt,
      rejectReason: raw.rejectReason,
      fulfilledAt: raw.fulfilledAt,
      createdAt: raw.createdAt,
    };
  }

  async findById(id: number): Promise<ExchangeOrderItem | null> {
    const row = await this.prisma.exchangeOrder.findUnique({
      where: { id, deletedAt: null },
      include: { user: { select: { name: true } }, product: { select: { name: true, image: true } } },
    });
    return row ? this.toItem(row) : null;
  }

  async list(query: ExchangeListQuery): Promise<{ items: ExchangeOrderItem[]; total: number }> {
    const where: Record<string, unknown> = { deletedAt: null };
    if (query.status) where.status = query.status;
    if (query.userId) where.userId = query.userId;

    const [rows, total] = await Promise.all([
      this.prisma.exchangeOrder.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: { user: { select: { name: true } }, product: { select: { name: true, image: true } } },
      }),
      this.prisma.exchangeOrder.count({ where }),
    ]);

    const items = await Promise.all(rows.map((r) => this.toItem(r)));
    return { items, total };
  }

  async create(userId: number, input: ExchangeCreateInput): Promise<ExchangeOrderItem> {
    const quantity = input.quantity ?? 1;
    const product = await this.prisma.product.findUnique({ where: { id: input.productId, deletedAt: null } });
    if (!product) throw new Error("product not found");
    if (product.stock < quantity) throw new Error("insufficient stock");

    const row = await this.prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: input.productId, deletedAt: null },
        data: { stock: { decrement: quantity } },
      });
      return tx.exchangeOrder.create({
        data: { userId, productId: input.productId, quantity, totalCost: product.price * quantity },
        include: { user: { select: { name: true } }, product: { select: { name: true, image: true } } },
      });
    });

    return this.toItem(row);
  }

  async approve(id: number, approverId: number): Promise<void> {
    await this.prisma.exchangeOrder.update({
      where: { id, deletedAt: null },
      data: { status: "approved", approverId, approvedAt: new Date() },
    });
  }

  async reject(id: number, approverId: number, reason?: string): Promise<void> {
    const order = await this.prisma.exchangeOrder.findUnique({ where: { id, deletedAt: null } });
    if (!order) throw new Error("order not found");

    await this.prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: order.productId, deletedAt: null },
        data: { stock: { increment: order.quantity } },
      });
      await tx.exchangeOrder.update({
        where: { id, deletedAt: null },
        data: { status: "rejected", approverId, rejectReason: reason },
      });
    });
  }

  async fulfill(id: number): Promise<void> {
    await this.prisma.exchangeOrder.update({
      where: { id, deletedAt: null },
      data: { status: "fulfilled", fulfilledAt: new Date() },
    });
  }

  async countPending(): Promise<number> {
    return this.prisma.exchangeOrder.count({ where: { status: "pending", deletedAt: null } });
  }
}
