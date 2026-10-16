import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  EXCHANGE_RATE_REPOSITORY,
  type ExchangeRateCreateInput,
  type ExchangeRateItem,
  type ExchangeRateListOptions,
  type ExchangeRateRepositoryPort,
  type ExchangeRateUpdateInput,
} from "../domain/exchange-rate.ports";

@Injectable()
export class ExchangeRateService {
  constructor(@Inject(EXCHANGE_RATE_REPOSITORY) private readonly repo: ExchangeRateRepositoryPort) {}

  async list(options: ExchangeRateListOptions): Promise<{ items: ExchangeRateItem[]; total: number }> {
    return this.repo.list(options);
  }

  async latest(base: string, quote: string): Promise<ExchangeRateItem | null> {
    return this.repo.findLatest(base, quote);
  }

  async createManual(input: ExchangeRateCreateInput): Promise<ExchangeRateItem> {
    this.assertPositiveRate(input.rate);
    return this.repo.create({ ...input, source: "manual", verified: input.verified ?? true });
  }

  async update(id: number, input: ExchangeRateUpdateInput): Promise<ExchangeRateItem> {
    if (input.rate !== undefined) this.assertPositiveRate(input.rate);
    const item = await this.repo.update(id, input);
    if (!item) throw new NotFoundException(`exchange rate ${id} not found`);
    return item;
  }

  async remove(id: number): Promise<void> {
    const item = await this.repo.findById(id);
    if (!item) throw new NotFoundException(`exchange rate ${id} not found`);
    await this.repo.remove(id);
  }

  private assertPositiveRate(rate: number): void {
    if (!Number.isFinite(rate) || rate <= 0) {
      throw new BadRequestException("汇率必须为大于 0 的数字");
    }
  }
}
