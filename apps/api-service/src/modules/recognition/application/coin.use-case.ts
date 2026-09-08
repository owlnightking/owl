import { Inject, Injectable } from "@nestjs/common";
import {
  COIN_REPOSITORY,
  type CoinAccountItem,
  type CoinRepositoryPort,
  type CoinTransactionItem,
} from "../domain/coin.ports";

@Injectable()
export class CoinUseCase {
  constructor(@Inject(COIN_REPOSITORY) private readonly repo: CoinRepositoryPort) {}

  async getAccount(userId: string): Promise<CoinAccountItem> {
    return this.repo.getAccount(userId);
  }

  async addBalance(
    userId: string,
    amount: number,
    source: string,
    referenceId?: string,
    remark?: string,
    operatorId?: string
  ): Promise<void> {
    await this.repo.addBalance(userId, amount, source, referenceId, remark, operatorId);
  }

  async deductBalance(
    userId: string,
    amount: number,
    source: string,
    referenceId?: string,
    remark?: string
  ): Promise<void> {
    await this.repo.deductBalance(userId, amount, source, referenceId, remark);
  }

  async adjustBalance(userId: string, amount: number, operatorId: string, remark?: string): Promise<void> {
    await this.repo.adjustBalance(userId, amount, operatorId, remark);
  }

  async listTransactions(
    userId: string,
    page: number,
    pageSize: number
  ): Promise<{ items: CoinTransactionItem[]; total: number }> {
    return this.repo.listTransactions(userId, page, pageSize);
  }
}
