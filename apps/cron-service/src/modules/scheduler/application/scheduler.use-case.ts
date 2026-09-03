import { Inject, Injectable } from "@nestjs/common";
import {
  SCHEDULER_CONFIG_REPOSITORY,
  SCHEDULER_RUN_REPOSITORY,
  type SchedulerConfigRepositoryPort,
  type SchedulerRunRepositoryPort,
  type SchedulerConfigItem,
  type SchedulerRunItem,
} from "../domain/scheduler.ports";

@Injectable()
export class SchedulerUseCase {
  constructor(
    @Inject(SCHEDULER_CONFIG_REPOSITORY) private readonly configRepo: SchedulerConfigRepositoryPort,
    @Inject(SCHEDULER_RUN_REPOSITORY) private readonly runRepo: SchedulerRunRepositoryPort
  ) {}

  async listConfigs(): Promise<SchedulerConfigItem[]> {
    return this.configRepo.findAll();
  }

  async getConfig(id: string): Promise<SchedulerConfigItem | null> {
    return this.configRepo.findById(id);
  }

  async createConfig(data: {
    name: string;
    area: string;
    cron: string;
    handler: string;
    tags?: string[];
    module?: string;
    description?: string;
  }): Promise<SchedulerConfigItem> {
    return this.configRepo.create(data);
  }

  async updateConfig(
    id: string,
    data: Partial<Pick<SchedulerConfigItem, "cron" | "enabled" | "description" | "timeoutMs" | "tags" | "module">>
  ): Promise<void> {
    await this.configRepo.update(id, data);
  }

  async deleteConfig(id: string): Promise<void> {
    await this.configRepo.delete(id);
  }

  async getRuns(
    configId: string,
    page: number,
    pageSize: number
  ): Promise<{ items: SchedulerRunItem[]; total: number }> {
    return this.runRepo.findByConfigId(configId, { page, pageSize });
  }

  async getAllRuns(
    page: number,
    pageSize: number,
    status?: string
  ): Promise<{ items: SchedulerRunItem[]; total: number }> {
    return this.runRepo.findAll({ page, pageSize, status });
  }
}
