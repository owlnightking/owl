// ISC 域端口：供应商（含报价）/ 生产批次 / 头程物流
// 金额口径：报价与头程成本以人民币录入，按汇率快照折算美元；展示主美元副人民币

export interface SupplierItem {
  id: number;
  name: string;
  contact: string | null;
  region: string | null;
  coopStatus: string;
  capability: string | null;
  notes: string | null;
  createdAt: Date;
}

export interface SupplierCreateInput {
  name: string;
  contact?: string;
  region?: string;
  coopStatus?: string;
  capability?: string;
  notes?: string;
}

export interface SupplierUpdateInput {
  name?: string;
  contact?: string;
  region?: string;
  coopStatus?: string;
  capability?: string;
  notes?: string;
}

export interface SupplierListOptions {
  keyword?: string;
  coopStatus?: string;
  page: number;
  pageSize: number;
}

export interface QuoteItem {
  id: number;
  supplierId: number;
  supplierName: string;
  productLineId: number | null;
  productLineName: string | null;
  spuId: number | null;
  spuName: string | null;
  itemName: string;
  amountCny: number;
  exchangeRate: number;
  amountUsd: number;
  quotedAt: Date;
  notes: string | null;
  createdAt: Date;
}

export interface QuoteCreateInput {
  supplierId: number;
  productLineId?: number;
  spuId?: number;
  itemName: string;
  amountCny: number;
  exchangeRate?: number;
  notes?: string;
  quotedAt?: Date;
}

export interface QuoteUpdateInput {
  itemName?: string;
  amountCny?: number;
  exchangeRate?: number;
  notes?: string;
}

export interface QuoteListOptions {
  supplierId?: number;
  productLineId?: number;
  spuId?: number;
  page: number;
  pageSize: number;
}

export interface ProductionItem {
  id: number;
  spuId: number;
  spuName: string;
  supplierId: number;
  supplierName: string;
  type: string;
  quantity: number;
  status: string;
  plannedAt: Date | null;
  completedAt: Date | null;
  notes: string | null;
  createdAt: Date;
}

export interface ProductionCreateInput {
  supplierId: number;
  type: string;
  quantity?: number;
  status?: string;
  plannedAt?: Date;
  completedAt?: Date;
  notes?: string;
}

export interface ProductionUpdateInput {
  supplierId?: number;
  type?: string;
  quantity?: number;
  status?: string;
  plannedAt?: Date;
  completedAt?: Date;
  notes?: string;
}

export interface ProductionListOptions {
  spuId?: number;
  supplierId?: number;
  type?: string;
  status?: string;
  page: number;
  pageSize: number;
}

export interface ShipmentItem {
  id: number;
  productLineId: number;
  productLineName: string;
  spuId: number | null;
  spuName: string | null;
  supplierId: number | null;
  supplierName: string | null;
  mode: string;
  warehouse: string;
  status: string;
  trackingRef: string | null;
  costCny: number | null;
  exchangeRate: number | null;
  costUsd: number | null;
  etaDate: Date | null;
  receivedAt: Date | null;
  notes: string | null;
  createdAt: Date;
}

export interface ShipmentCreateInput {
  productLineId?: number;
  spuId?: number;
  supplierId?: number;
  mode: string;
  warehouse?: string;
  status?: string;
  trackingRef?: string;
  costCny?: number;
  exchangeRate?: number;
  etaDate?: Date;
  notes?: string;
}

export interface ShipmentUpdateInput {
  spuId?: number;
  supplierId?: number;
  mode?: string;
  warehouse?: string;
  status?: string;
  trackingRef?: string;
  costCny?: number;
  exchangeRate?: number;
  etaDate?: Date;
  receivedAt?: Date;
  notes?: string;
}

export interface ShipmentListOptions {
  productLineId?: number;
  spuId?: number;
  mode?: string;
  warehouse?: string;
  status?: string;
  page: number;
  pageSize: number;
}

export interface IscRepositoryPort {
  listSuppliers(options: SupplierListOptions): Promise<{ items: SupplierItem[]; total: number }>;
  findSupplierById(id: number): Promise<SupplierItem | null>;
  createSupplier(input: SupplierCreateInput): Promise<SupplierItem>;
  updateSupplier(id: number, input: SupplierUpdateInput): Promise<SupplierItem | null>;
  removeSupplier(id: number): Promise<void>;

  listQuotes(options: QuoteListOptions): Promise<{ items: QuoteItem[]; total: number }>;
  findQuoteById(id: number): Promise<QuoteItem | null>;
  createQuote(input: QuoteCreateInput & { amountUsd: number; exchangeRate: number }): Promise<QuoteItem>;
  updateQuote(
    id: number,
    input: QuoteUpdateInput & { amountUsd?: number; exchangeRate?: number }
  ): Promise<QuoteItem | null>;
  removeQuote(id: number): Promise<void>;

  listProductions(options: ProductionListOptions): Promise<{ items: ProductionItem[]; total: number }>;
  createProduction(spuId: number, input: ProductionCreateInput): Promise<ProductionItem>;
  updateProduction(id: number, input: ProductionUpdateInput): Promise<ProductionItem | null>;
  removeProduction(id: number): Promise<void>;

  listShipments(options: ShipmentListOptions): Promise<{ items: ShipmentItem[]; total: number }>;
  findShipmentById(id: number): Promise<ShipmentItem | null>;
  createShipment(
    input: ShipmentCreateInput & { productLineId: number; costUsd?: number; exchangeRate?: number }
  ): Promise<ShipmentItem>;
  updateShipment(id: number, input: ShipmentUpdateInput & { costUsd?: number }): Promise<ShipmentItem | null>;
  removeShipment(id: number): Promise<void>;
}

export const ISC_REPOSITORY = Symbol("ISC_REPOSITORY");
export const SUPPLIER_SERVICE = Symbol("SUPPLIER_SERVICE");
export const PRODUCTION_SERVICE = Symbol("PRODUCTION_SERVICE");
export const SHIPMENT_SERVICE = Symbol("SHIPMENT_SERVICE");
