import { Inject, Injectable } from "@nestjs/common";
import {
  COIN_REPOSITORY,
  type CoinAccountItem,
  type CoinRepositoryPort,
  type CoinTransactionItem,
} from "../domain/coin.ports";

@Injectable()
export class CoinService {
  constructor(@Inject(COIN_REPOSITORY) private readonly repo: CoinRepositoryPort) {}

  async getAccount(userId: number): Promise<CoinAccountItem> {
    return this.repo.getAccount(userId);
  }

  async addBalance(
    userId: number,
    amount: number,
    source: string,
    referenceId?: string,
    remark?: string,
    operatorId?: number
  ): Promise<void> {
    await this.repo.addBalance(userId, amount, source, referenceId, remark, operatorId);
  }

  async deductBalance(
    userId: number,
    amount: number,
    source: string,
    referenceId?: string,
    remark?: string
  ): Promise<void> {
    await this.repo.deductBalance(userId, amount, source, referenceId, remark);
  }

  async adjustBalance(userId: number, amount: number, operatorId: number, remark?: string): Promise<void> {
    await this.repo.adjustBalance(userId, amount, operatorId, remark);
  }

  async listTransactions(
    userId: number,
    page: number,
    pageSize: number
  ): Promise<{ items: CoinTransactionItem[]; total: number }> {
    return this.repo.listTransactions(userId, page, pageSize);
  }
}
