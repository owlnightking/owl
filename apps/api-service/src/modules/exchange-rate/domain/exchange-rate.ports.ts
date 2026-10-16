export interface ExchangeRateItem {
  id: number;
  base: string;
  quote: string;
  rate: number;
  source: string;
  verified: boolean;
  effectiveDate: Date;
  createdAt: Date;
}

export interface ExchangeRateCreateInput {
  base: string;
  quote: string;
  rate: number;
  source: string;
  verified?: boolean;
  effectiveDate: Date;
}

export interface ExchangeRateUpdateInput {
  rate?: number;
  verified?: boolean;
  effectiveDate?: Date;
}

export interface ExchangeRateListOptions {
  base?: string;
  quote?: string;
  page: number;
  pageSize: number;
}

export interface ExchangeRateRepositoryPort {
  list(options: ExchangeRateListOptions): Promise<{ items: ExchangeRateItem[]; total: number }>;
  findById(id: number): Promise<ExchangeRateItem | null>;
  findLatest(base: string, quote: string): Promise<ExchangeRateItem | null>;
  create(input: ExchangeRateCreateInput): Promise<ExchangeRateItem>;
  update(id: number, input: ExchangeRateUpdateInput): Promise<ExchangeRateItem | null>;
  remove(id: number): Promise<void>;
}

export interface ExchangeRateServicePort {
  list(options: ExchangeRateListOptions): Promise<{ items: ExchangeRateItem[]; total: number }>;
  latest(base: string, quote: string): Promise<ExchangeRateItem | null>;
  createManual(input: ExchangeRateCreateInput): Promise<ExchangeRateItem>;
  update(id: number, input: ExchangeRateUpdateInput): Promise<ExchangeRateItem>;
  remove(id: number): Promise<void>;
}

export const EXCHANGE_RATE_REPOSITORY = Symbol("EXCHANGE_RATE_REPOSITORY");
export const EXCHANGE_RATE_SERVICE = Symbol("EXCHANGE_RATE_SERVICE");
