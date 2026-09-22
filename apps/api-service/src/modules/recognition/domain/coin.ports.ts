export interface CoinAccountItem {
  id: number;
  userId: number;
  balance: number;
  totalEarned: number;
  totalSpent: number;
}

export interface CoinTransactionItem {
  id: number;
  type: "earn" | "spend" | "adjust";
  amount: number;
  balance: number;
  source: string;
  referenceId: string | null;
  remark: string | null;
  createdAt: Date;
}

export interface CoinRepositoryPort {
  getAccount(userId: number): Promise<CoinAccountItem>;
  addBalance(
    userId: number,
    amount: number,
    source: string,
    referenceId?: string,
    remark?: string,
    operatorId?: number
  ): Promise<void>;
  deductBalance(userId: number, amount: number, source: string, referenceId?: string, remark?: string): Promise<void>;
  adjustBalance(userId: number, amount: number, operatorId: number, remark?: string): Promise<void>;
  listTransactions(
    userId: number,
    page: number,
    pageSize: number
  ): Promise<{ items: CoinTransactionItem[]; total: number }>;
}

export const COIN_REPOSITORY = Symbol("COIN_REPOSITORY");
export const COIN_SERVICE = Symbol("COIN_SERVICE");
