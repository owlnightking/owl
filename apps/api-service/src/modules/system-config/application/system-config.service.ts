import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  SYSTEM_CONFIG_REPOSITORY,
  type SystemConfigItem,
  type SystemConfigRepositoryPort,
} from "../domain/system-config.ports";

@Injectable()
export class SystemConfigService {
  constructor(
    @Inject(SYSTEM_CONFIG_REPOSITORY)
    private readonly repo: SystemConfigRepositoryPort
  ) {}

  async findByKey(key: string): Promise<SystemConfigItem | null> {
    return this.repo.findByKey(key);
  }

  async get(key: string): Promise<SystemConfigItem | null> {
    return this.repo.findByKey(key);
  }

  async getOrThrow(key: string): Promise<SystemConfigItem> {
    const item = await this.repo.findByKey(key);
    if (!item) throw new NotFoundException(`config "${key}" not found`);
    return item;
  }

  async findById(id: number): Promise<SystemConfigItem | null> {
    return this.repo.findById(id);
  }

  async getByIdOrThrow(id: number): Promise<SystemConfigItem> {
    const item = await this.repo.findById(id);
    if (!item) throw new NotFoundException(`config ${id} not found`);
    return item;
  }

  async set(key: string, value: unknown, updatedBy?: number, description?: string): Promise<SystemConfigItem> {
    return this.repo.upsert(key, value, updatedBy, description);
  }

  async updateById(id: number, value: unknown, updatedBy?: number, description?: string): Promise<SystemConfigItem> {
    await this.getByIdOrThrow(id);
    return this.repo.updateById(id, value, updatedBy, description);
  }

  async deleteById(id: number): Promise<void> {
    await this.getByIdOrThrow(id);
    await this.repo.deleteById(id);
  }
}
