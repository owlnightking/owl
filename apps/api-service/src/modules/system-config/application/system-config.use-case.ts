import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  SYSTEM_CONFIG_REPOSITORY,
  type SystemConfigItem,
  type SystemConfigRepositoryPort,
} from "../domain/system-config.ports";

@Injectable()
export class SystemConfigUseCase {
  constructor(
    @Inject(SYSTEM_CONFIG_REPOSITORY)
    private readonly repo: SystemConfigRepositoryPort
  ) {}

  async get(key: string): Promise<SystemConfigItem | null> {
    return this.repo.findByKey(key);
  }

  async getOrThrow(key: string): Promise<SystemConfigItem> {
    const item = await this.repo.findByKey(key);
    if (!item) throw new NotFoundException(`config "${key}" not found`);
    return item;
  }

  async set(key: string, value: unknown, updatedBy?: string, description?: string): Promise<SystemConfigItem> {
    return this.repo.upsert(key, value, updatedBy, description);
  }

  async remove(key: string): Promise<void> {
    await this.repo.delete(key);
  }
}
