export interface CoinAccountItem {
  id: string;
  userId: string;
  balance: number;
  totalEarned: number;
  totalSpent: number;
}

export interface CoinTransactionItem {
  id: string;
  type: "earn" | "spend" | "adjust";
  amount: number;
  balance: number;
  source: string;
  referenceId: string | null;
  remark: string | null;
  createdAt: Date;
}

export interface CoinRepositoryPort {
  getAccount(userId: string): Promise<CoinAccountItem>;
  addBalance(
    userId: string,
    amount: number,
    source: string,
    referenceId?: string,
    remark?: string,
    operatorId?: string
  ): Promise<void>;
  deductBalance(userId: string, amount: number, source: string, referenceId?: string, remark?: string): Promise<void>;
  adjustBalance(userId: string, amount: number, operatorId: string, remark?: string): Promise<void>;
  listTransactions(
    userId: string,
    page: number,
    pageSize: number
  ): Promise<{ items: CoinTransactionItem[]; total: number }>;
}

export const COIN_REPOSITORY = Symbol("COIN_REPOSITORY");
export const COIN_SERVICE = Symbol("COIN_SERVICE");
