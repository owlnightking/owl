import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  FIELD_CONFIG_REPOSITORY,
  type FieldConfigRepositoryPort,
  type FieldConfigItem,
  type FieldConfigUpdateInput,
  type FieldConfigUpsertInput,
} from "../domain/field-config.ports";

@Injectable()
export class FieldConfigService {
  constructor(@Inject(FIELD_CONFIG_REPOSITORY) private readonly repo: FieldConfigRepositoryPort) {}

  async listByCategory(category: string): Promise<FieldConfigItem[]> {
    return this.repo.findByCategory(category);
  }

  async getById(id: number): Promise<FieldConfigItem> {
    const item = await this.repo.findById(id);
    if (!item) {
      throw new NotFoundException(`Field config not found: ${id}`);
    }
    return item;
  }

  async upsert(data: FieldConfigUpsertInput): Promise<FieldConfigItem> {
    return this.repo.upsert(data);
  }

  async updateById(id: number, data: FieldConfigUpdateInput): Promise<FieldConfigItem> {
    await this.getById(id);
    return this.repo.updateById(id, data);
  }

  async deleteById(id: number): Promise<void> {
    await this.getById(id);
    await this.repo.deleteById(id);
  }
}
