import { Injectable, Logger } from "@nestjs/common";
import type { ExchangeRateFetcherPort, FetchedRate } from "../domain/exchange-rate-sync.ports";

// open.er-api.com 免费汇率接口：/v6/latest/{base} 返回 { rates: { USD: number } }
const FETCH_TIMEOUT_MS = 10_000;
const API_BASE_URL = "https://open.er-api.com/v6/latest";
const BASE_CURRENCY = "CNY";
const QUOTE_CURRENCY = "USD";

@Injectable()
export class ErApiClient implements ExchangeRateFetcherPort {
  private readonly logger = new Logger(ErApiClient.name);

  async fetchCnyToUsd(): Promise<FetchedRate> {
    const url = `${API_BASE_URL}/${BASE_CURRENCY}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!response.ok) {
      throw new Error(`exchange rate api http ${response.status}`);
    }
    const body = (await response.json()) as { rates?: Record<string, unknown> };
    const rawRate = body.rates?.[QUOTE_CURRENCY];
    const rate = typeof rawRate === "number" ? rawRate : Number(rawRate);
    if (!Number.isFinite(rate) || rate <= 0) {
      throw new Error("exchange rate api returned invalid CNY->USD rate");
    }
    this.logger.log(`fetched CNY->USD rate ${rate}`);
    return { rate, fetchedAt: new Date() };
  }
}
