import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CLIENT } from "@owl/database/provider";
import type { PrismaClient } from "@owl/database";
import type {
  ExchangeRateCreateInput,
  ExchangeRateItem,
  ExchangeRateListOptions,
  ExchangeRateRepositoryPort,
  ExchangeRateUpdateInput,
} from "../domain/exchange-rate.ports";

@Injectable()
export class PrismaExchangeRateRepository implements ExchangeRateRepositoryPort {
  constructor(@Inject(DATABASE_CLIENT) private readonly prisma: PrismaClient) {}

  private toItem(raw: {
    id: number;
    base: string;
    quote: string;
    rate: unknown;
    source: string;
    verified: boolean;
    effectiveDate: Date;
    createdAt: Date;
  }): ExchangeRateItem {
    return {
      id: raw.id,
      base: raw.base,
      quote: raw.quote,
      rate: Number(raw.rate),
      source: raw.source,
      verified: raw.verified,
      effectiveDate: raw.effectiveDate,
      createdAt: raw.createdAt,
    };
  }

  async list(options: ExchangeRateListOptions): Promise<{ items: ExchangeRateItem[]; total: number }> {
    const where: Record<string, unknown> = { deletedAt: null };
    if (options.base) where.base = options.base;
    if (options.quote) where.quote = options.quote;

    const [rows, total] = await Promise.all([
      this.prisma.exchangeRate.findMany({
        where,
        orderBy: [{ effectiveDate: "desc" }, { createdAt: "desc" }],
        skip: (options.page - 1) * options.pageSize,
        take: options.pageSize,
      }),
      this.prisma.exchangeRate.count({ where }),
    ]);
    return { items: rows.map((row) => this.toItem(row)), total };
  }

  async findById(id: number): Promise<ExchangeRateItem | null> {
    const row = await this.prisma.exchangeRate.findUnique({ where: { id, deletedAt: null } });
    return row ? this.toItem(row) : null;
  }

  async findLatest(base: string, quote: string): Promise<ExchangeRateItem | null> {
    const row = await this.prisma.exchangeRate.findFirst({
      where: { base, quote, deletedAt: null },
      orderBy: [{ effectiveDate: "desc" }, { createdAt: "desc" }],
    });
    return row ? this.toItem(row) : null;
  }

  async create(input: ExchangeRateCreateInput): Promise<ExchangeRateItem> {
    const row = await this.prisma.exchangeRate.create({ data: input });
    return this.toItem(row);
  }

  async update(id: number, input: ExchangeRateUpdateInput): Promise<ExchangeRateItem | null> {
    const row = await this.prisma.exchangeRate
      .update({ where: { id, deletedAt: null }, data: input })
      .catch(() => null);
    return row ? this.toItem(row) : null;
  }

  async remove(id: number): Promise<void> {
    await this.prisma.exchangeRate.update({ where: { id, deletedAt: null }, data: { deletedAt: new Date() } });
  }
}
