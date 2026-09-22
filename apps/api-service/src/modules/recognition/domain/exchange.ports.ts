export interface ExchangeOrderItem {
  id: number;
  userId: number;
  userName?: string;
  productId: number;
  productName?: string;
  productImage?: string;
  quantity: number;
  totalCost: number;
  status: "pending" | "approved" | "rejected" | "fulfilled";
  approverId: number | null;
  approvedAt: Date | null;
  rejectReason: string | null;
  fulfilledAt: Date | null;
  createdAt: Date;
}

export interface ExchangeCreateInput {
  productId: number;
  quantity?: number;
}

export interface ExchangeListQuery {
  status?: "pending" | "approved" | "rejected" | "fulfilled";
  userId?: number;
  page: number;
  pageSize: number;
}

export interface ExchangeRepositoryPort {
  findById(id: number): Promise<ExchangeOrderItem | null>;
  list(query: ExchangeListQuery): Promise<{ items: ExchangeOrderItem[]; total: number }>;
  create(userId: number, input: ExchangeCreateInput): Promise<ExchangeOrderItem>;
  approve(id: number, approverId: number): Promise<void>;
  reject(id: number, approverId: number, reason?: string): Promise<void>;
  fulfill(id: number): Promise<void>;
  countPending(): Promise<number>;
}

export const EXCHANGE_REPOSITORY = Symbol("EXCHANGE_REPOSITORY");
export const EXCHANGE_SERVICE = Symbol("EXCHANGE_SERVICE");
