import { Injectable } from "@nestjs/common";
import { PrismaClient } from "@owl/database";
import type { ExchangeRateRecordInput, ExchangeRateWriterPort } from "../domain/exchange-rate-sync.ports";

const DAY_START_HOUR = 0;
const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class PrismaExchangeRateWriter implements ExchangeRateWriterPort {
  constructor(private readonly prisma: PrismaClient) {}

  async findTodayApiRate(base: string, quote: string, effectiveDate: Date): Promise<number | null> {
    const dayStart = this.dayStart(effectiveDate);
    const row = await this.prisma.exchangeRate.findFirst({
      where: {
        base,
        quote,
        source: "api",
        deletedAt: null,
        effectiveDate: { gte: dayStart, lt: new Date(dayStart.getTime() + DAY_MS) },
      },
      orderBy: { createdAt: "desc" },
    });
    return row ? Number(row.rate) : null;
  }

  async insertIfAbsent(input: ExchangeRateRecordInput): Promise<boolean> {
    const existing = await this.findTodayApiRate(input.base, input.quote, input.effectiveDate);
    if (existing !== null && existing === input.rate) {
      return false;
    }
    await this.prisma.exchangeRate.create({
      data: {
        base: input.base,
        quote: input.quote,
        rate: input.rate,
        source: input.source,
        verified: false,
        effectiveDate: this.dayStart(input.effectiveDate),
      },
    });
    return true;
  }

  private dayStart(date: Date): Date {
    const start = new Date(date);
    start.setUTCHours(DAY_START_HOUR, 0, 0, 0);
    return start;
  }
}
