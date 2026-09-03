import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  FIELD_CONFIG_REPOSITORY,
  type FieldConfigRepositoryPort,
  type FieldConfigItem,
} from "../domain/field-config.ports";

@Injectable()
export class FieldConfigUseCase {
  constructor(@Inject(FIELD_CONFIG_REPOSITORY) private readonly repo: FieldConfigRepositoryPort) {}

  async listByCategory(category: string): Promise<FieldConfigItem[]> {
    return this.repo.findByCategory(category);
  }

  async getByCategoryAndModule(category: string, module: string): Promise<FieldConfigItem> {
    const item = await this.repo.findByCategoryAndModule(category, module);
    if (!item) {
      throw new NotFoundException(`Field config not found: ${category}/${module}`);
    }
    return item;
  }

  async upsert(data: {
    category: string;
    module: string;
    label: string;
    options?: unknown;
    value?: string;
    description?: string;
  }): Promise<FieldConfigItem> {
    return this.repo.upsert(data);
  }

  async deleteByKey(category: string, module: string): Promise<void> {
    await this.repo.deleteByKey(category, module);
  }
}
