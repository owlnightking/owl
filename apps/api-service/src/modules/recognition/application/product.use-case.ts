import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  PRODUCT_REPOSITORY,
  type ProductCreateInput,
  type ProductItem,
  type ProductRepositoryPort,
  type ProductUpdateInput,
} from "../domain/product.ports";

@Injectable()
export class ProductUseCase {
  constructor(@Inject(PRODUCT_REPOSITORY) private readonly repo: ProductRepositoryPort) {}

  async list(options?: {
    enabledOnly?: boolean;
    page: number;
    pageSize: number;
  }): Promise<{ items: ProductItem[]; total: number }> {
    return this.repo.list(options);
  }

  async findById(id: string): Promise<ProductItem> {
    const item = await this.repo.findById(id);
    if (!item) throw new NotFoundException(`product ${id} not found`);
    return item;
  }

  async create(input: ProductCreateInput): Promise<ProductItem> {
    return this.repo.create(input);
  }

  async update(id: string, input: ProductUpdateInput): Promise<ProductItem> {
    const item = await this.repo.update(id, input);
    if (!item) throw new NotFoundException(`product ${id} not found`);
    return item;
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
