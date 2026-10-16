export interface SkuItem {
  id: number;
  spuId: number;
  skuCode: string;
  name: string;
  priceUsd: number;
  limited: boolean;
  stock: number;
  enabled: boolean;
  notes: string | null;
  createdAt: Date;
}

export interface SkuCreateInput {
  skuCode: string;
  name: string;
  priceUsd: number;
  limited?: boolean;
  stock?: number;
  enabled?: boolean;
  notes?: string;
}

export interface SkuUpdateInput {
  name?: string;
  priceUsd?: number;
  limited?: boolean;
  stock?: number;
  enabled?: boolean;
  notes?: string;
}

export interface SpuItem {
  id: number;
  productLineId: number;
  internalCode: string;
  spuCode: string | null;
  name: string;
  status: string;
  launchAt: Date | null;
  notes: string | null;
  skuCount: number;
  createdAt: Date;
}

export interface SpuCreateInput {
  name: string;
  notes?: string;
}

export interface SpuUpdateInput {
  name?: string;
  spuCode?: string | null;
  launchAt?: Date | null;
  notes?: string;
  status?: string;
}

export interface SpuListOptions {
  productLineId?: number;
  status?: string;
  page: number;
  pageSize: number;
}

export interface SpuRepositoryPort {
  list(options: SpuListOptions): Promise<{ items: SpuItem[]; total: number }>;
  findById(id: number): Promise<SpuItem | null>;
  create(productLineId: number, input: SpuCreateInput & { internalCode: string }): Promise<SpuItem>;
  update(id: number, input: SpuUpdateInput): Promise<SpuItem | null>;
  remove(id: number): Promise<void>;
  listAllInternalCodes(): Promise<string[]>;
  listSkus(spuId: number): Promise<SkuItem[]>;
  createSku(spuId: number, input: SkuCreateInput): Promise<SkuItem>;
  updateSku(id: number, input: SkuUpdateInput): Promise<SkuItem | null>;
  removeSku(id: number): Promise<void>;
}

export const SPU_REPOSITORY = Symbol("SPU_REPOSITORY");
export const SPU_SERVICE = Symbol("SPU_SERVICE");
