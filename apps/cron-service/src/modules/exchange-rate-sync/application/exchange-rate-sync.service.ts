import { Inject, Injectable, Logger } from "@nestjs/common";
import {
  EXCHANGE_RATE_FETCHER,
  EXCHANGE_RATE_WRITER,
  type ExchangeRateFetcherPort,
  type ExchangeRateWriterPort,
} from "../domain/exchange-rate-sync.ports";

const BASE_CURRENCY = "CNY";
const QUOTE_CURRENCY = "USD";

@Injectable()
export class ExchangeRateSyncService {
  private readonly logger = new Logger(ExchangeRateSyncService.name);

  constructor(
    @Inject(EXCHANGE_RATE_FETCHER) private readonly fetcher: ExchangeRateFetcherPort,
    @Inject(EXCHANGE_RATE_WRITER) private readonly writer: ExchangeRateWriterPort
  ) {}

  // 抓取 CNY→USD 汇率写入汇率表；失败保留旧值（仅告警日志），抓到重复值跳过写入
  async execute(): Promise<void> {
    try {
      const { rate, fetchedAt } = await this.fetcher.fetchCnyToUsd();
      const written = await this.writer.insertIfAbsent({
        base: BASE_CURRENCY,
        quote: QUOTE_CURRENCY,
        rate,
        source: "api",
        effectiveDate: fetchedAt,
      });
      this.logger.log(written ? `exchange rate ${rate} persisted` : `exchange rate ${rate} unchanged, skipped`);
    } catch (error) {
      this.logger.error(`exchange rate sync failed, keep last known rate: ${String(error)}`);
    }
  }
}
