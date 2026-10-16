export interface ProductLineItem {
  id: number;
  code: string;
  name: string;
  styleDesc: string | null;
  ipdStage: string;
  lifecycleStage: string;
  targetMarket: string | null;
  notes: string | null;
  spuCount: number;
  createdAt: Date;
}

export interface ProductLineCreateInput {
  name: string;
  styleDesc?: string;
  targetMarket?: string;
  notes?: string;
}

export interface ProductLineUpdateInput {
  name?: string;
  styleDesc?: string;
  targetMarket?: string;
  notes?: string;
}

export interface ProductLineStageInput {
  ipdStage?: string;
  lifecycleStage?: string;
}

export interface ProductLineListOptions {
  keyword?: string;
  ipdStage?: string;
  lifecycleStage?: string;
  page: number;
  pageSize: number;
}

export interface ProductLineDetail extends ProductLineItem {
  updatedAt: Date;
}

export interface ProductLineRepositoryPort {
  list(options: ProductLineListOptions): Promise<{ items: ProductLineDetail[]; total: number }>;
  findById(id: number): Promise<ProductLineDetail | null>;
  create(input: ProductLineCreateInput & { code: string }): Promise<ProductLineDetail>;
  update(id: number, input: ProductLineUpdateInput): Promise<ProductLineDetail | null>;
  updateStages(id: number, input: ProductLineStageInput): Promise<ProductLineDetail | null>;
  remove(id: number): Promise<void>;
  listAllCodes(): Promise<string[]>;
}

export const PRODUCT_LINE_REPOSITORY = Symbol("PRODUCT_LINE_REPOSITORY");
export const PRODUCT_LINE_SERVICE = Symbol("PRODUCT_LINE_SERVICE");
