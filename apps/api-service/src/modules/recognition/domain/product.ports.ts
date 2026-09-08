export interface ProductItem {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  price: number;
  stock: number;
  enabled: boolean;
  sortOrder: number;
  createdAt: Date;
}

export interface ProductCreateInput {
  name: string;
  description?: string;
  image?: string;
  price: number;
  stock?: number;
  enabled?: boolean;
  sortOrder?: number;
}

export interface ProductUpdateInput {
  name?: string;
  description?: string;
  image?: string;
  price?: number;
  stock?: number;
  enabled?: boolean;
  sortOrder?: number;
}

export interface ProductRepositoryPort {
  list(options?: {
    enabledOnly?: boolean;
    page: number;
    pageSize: number;
  }): Promise<{ items: ProductItem[]; total: number }>;
  findById(id: string): Promise<ProductItem | null>;
  create(input: ProductCreateInput): Promise<ProductItem>;
  update(id: string, input: ProductUpdateInput): Promise<ProductItem | null>;
  delete(id: string): Promise<void>;
  decrementStock(id: string, quantity: number): Promise<boolean>;
  incrementStock(id: string, quantity: number): Promise<void>;
}

export const PRODUCT_REPOSITORY = Symbol("PRODUCT_REPOSITORY");
export const PRODUCT_SERVICE = Symbol("PRODUCT_SERVICE");
