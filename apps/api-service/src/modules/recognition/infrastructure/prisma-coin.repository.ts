import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CLIENT } from "@owl/database/provider";
import type { PrismaClient } from "@owl/database";
import type { CoinAccountItem, CoinRepositoryPort, CoinTransactionItem } from "../domain/coin.ports";

@Injectable()
export class PrismaCoinRepository implements CoinRepositoryPort {
  constructor(@Inject(DATABASE_CLIENT) private readonly prisma: PrismaClient) {}

  async getAccount(userId: string): Promise<CoinAccountItem> {
    let account = await this.prisma.coinAccount.findUnique({ where: { userId } });
    if (!account) {
      account = await this.prisma.coinAccount.create({ data: { userId } });
    }
    return {
      id: account.id,
      userId: account.userId,
      balance: account.balance,
      totalEarned: account.totalEarned,
      totalSpent: account.totalSpent,
    };
  }

  async addBalance(
    userId: string,
    amount: number,
    source: string,
    referenceId?: string,
    remark?: string,
    operatorId?: string
  ): Promise<void> {
    const account = await this.getAccount(userId);
    const newBalance = account.balance + amount;
    await this.prisma.$transaction([
      this.prisma.coinAccount.update({
        where: { userId },
        data: { balance: newBalance, totalEarned: { increment: amount } },
      }),
      this.prisma.coinTransaction.create({
        data: {
          accountId: account.id,
          type: "earn",
          amount,
          balance: newBalance,
          source,
          referenceId,
          remark,
          operatorId,
        },
      }),
    ]);
  }

  async deductBalance(
    userId: string,
    amount: number,
    source: string,
    referenceId?: string,
    remark?: string
  ): Promise<void> {
    const account = await this.getAccount(userId);
    if (account.balance < amount) throw new Error("insufficient balance");
    const newBalance = account.balance - amount;
    await this.prisma.$transaction([
      this.prisma.coinAccount.update({
        where: { userId },
        data: { balance: newBalance, totalSpent: { increment: amount } },
      }),
      this.prisma.coinTransaction.create({
        data: { accountId: account.id, type: "spend", amount, balance: newBalance, source, referenceId, remark },
      }),
    ]);
  }

  async adjustBalance(userId: string, amount: number, operatorId: string, remark?: string): Promise<void> {
    const account = await this.getAccount(userId);
    const newBalance = account.balance + amount;
    const type = amount >= 0 ? "earn" : "spend";
    await this.prisma.$transaction([
      this.prisma.coinAccount.update({
        where: { userId },
        data: {
          balance: newBalance,
          ...(amount >= 0
            ? { totalEarned: { increment: Math.abs(amount) } }
            : { totalSpent: { increment: Math.abs(amount) } }),
        },
      }),
      this.prisma.coinTransaction.create({
        data: {
          accountId: account.id,
          type,
          amount: Math.abs(amount),
          balance: newBalance,
          source: "admin_adjust",
          remark,
          operatorId,
        },
      }),
    ]);
  }

  async listTransactions(
    userId: string,
    page: number,
    pageSize: number
  ): Promise<{ items: CoinTransactionItem[]; total: number }> {
    const account = await this.prisma.coinAccount.findUnique({ where: { userId } });
    if (!account) return { items: [], total: 0 };

    const where = { accountId: account.id };
    const [rows, total] = await Promise.all([
      this.prisma.coinTransaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.coinTransaction.count({ where }),
    ]);

    return {
      items: rows.map((r) => ({
        id: r.id,
        type: r.type as CoinTransactionItem["type"],
        amount: r.amount,
        balance: r.balance,
        source: r.source,
        referenceId: r.referenceId,
        remark: r.remark,
        createdAt: r.createdAt,
      })),
      total,
    };
  }
}
