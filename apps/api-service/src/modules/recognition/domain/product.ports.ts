export interface ProductItem {
  id: number;
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

export interface ProductListOptions {
  keyword?: string;
  enabled?: boolean;
  page: number;
  pageSize: number;
}

export interface ProductRepositoryPort {
  list(options?: ProductListOptions): Promise<{ items: ProductItem[]; total: number }>;
  findById(id: number): Promise<ProductItem | null>;
  create(input: ProductCreateInput): Promise<ProductItem>;
  update(id: number, input: ProductUpdateInput): Promise<ProductItem | null>;
  delete(id: number): Promise<void>;
  decrementStock(id: number, quantity: number): Promise<boolean>;
  incrementStock(id: number, quantity: number): Promise<void>;
}

export const PRODUCT_REPOSITORY = Symbol("PRODUCT_REPOSITORY");
export const PRODUCT_SERVICE = Symbol("PRODUCT_SERVICE");
