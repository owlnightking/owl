export interface ExchangeOrderItem {
  id: string;
  userId: string;
  userName?: string;
  productId: string;
  productName?: string;
  productImage?: string;
  quantity: number;
  totalCost: number;
  status: "pending" | "approved" | "rejected" | "fulfilled";
  approverId: string | null;
  approvedAt: Date | null;
  rejectReason: string | null;
  fulfilledAt: Date | null;
  createdAt: Date;
}

export interface ExchangeCreateInput {
  productId: string;
  quantity?: number;
}

export interface ExchangeListQuery {
  status?: "pending" | "approved" | "rejected" | "fulfilled";
  userId?: string;
  page: number;
  pageSize: number;
}

export interface ExchangeRepositoryPort {
  findById(id: string): Promise<ExchangeOrderItem | null>;
  list(query: ExchangeListQuery): Promise<{ items: ExchangeOrderItem[]; total: number }>;
  create(userId: string, input: ExchangeCreateInput): Promise<ExchangeOrderItem>;
  approve(id: string, approverId: string): Promise<void>;
  reject(id: string, approverId: string, reason?: string): Promise<void>;
  fulfill(id: string): Promise<void>;
  countPending(): Promise<number>;
}

export const EXCHANGE_REPOSITORY = Symbol("EXCHANGE_REPOSITORY");
export const EXCHANGE_SERVICE = Symbol("EXCHANGE_SERVICE");
