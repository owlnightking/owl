export interface FetchedRate {
  rate: number;
  fetchedAt: Date;
}

export interface ExchangeRateFetcherPort {
  fetchCnyToUsd(): Promise<FetchedRate>;
}

export interface ExchangeRateRecordInput {
  base: string;
  quote: string;
  rate: number;
  source: string;
  effectiveDate: Date;
}

export interface ExchangeRateWriterPort {
  // 当日同源同汇率已存在则跳过，返回是否写入
  insertIfAbsent(input: ExchangeRateRecordInput): Promise<boolean>;
  findTodayApiRate(base: string, quote: string, effectiveDate: Date): Promise<number | null>;
}

export const EXCHANGE_RATE_FETCHER = Symbol("EXCHANGE_RATE_FETCHER");
export const EXCHANGE_RATE_WRITER = Symbol("EXCHANGE_RATE_WRITER");
