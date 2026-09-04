import { Injectable } from "@nestjs/common";
import { PrismaClient } from "@owl/database";
import type { SchedulerConfigRepositoryPort, SchedulerConfigItem } from "../domain/scheduler.ports";

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_TIMEOUT_MS = 60000;

@Injectable()
export class PrismaSchedulerConfigRepository implements SchedulerConfigRepositoryPort {
  constructor(private readonly prisma: PrismaClient) {}

  private toItem(raw: {
    id: string;
    name: string;
    area: string;
    cron: string;
    handler: string;
    tags: string[];
    module: string | null;
    enabled: boolean;
    description: string | null;
    timeoutMs: number;
    updatedAt: Date;
  }): SchedulerConfigItem {
    return {
      id: raw.id,
      name: raw.name,
      area: raw.area,
      cron: raw.cron,
      handler: raw.handler,
      tags: raw.tags,
      module: raw.module,
      enabled: raw.enabled,
      description: raw.description,
      timeoutMs: raw.timeoutMs,
      updatedAt: raw.updatedAt,
    };
  }

  async findAll(): Promise<SchedulerConfigItem[]> {
    const rows = await this.prisma.schedulerConfig.findMany({ orderBy: { updatedAt: "desc" } });
    return rows.map((row) => this.toItem(row));
  }

  async findById(id: string): Promise<SchedulerConfigItem | null> {
    const row = await this.prisma.schedulerConfig.findUnique({ where: { id } });
    return row ? this.toItem(row) : null;
  }

  async create(data: {
    name: string;
    area: string;
    cron: string;
    handler: string;
    tags?: string[];
    module?: string;
    description?: string;
  }): Promise<SchedulerConfigItem> {
    const row = await this.prisma.schedulerConfig.create({
      data: {
        name: data.name,
        area: data.area,
        cron: data.cron,
        handler: data.handler,
        queue: `task-queue:${data.area}`,
        tags: data.tags ?? [],
        module: data.module,
        description: data.description,
        timeoutMs: DEFAULT_TIMEOUT_MS,
        retryPolicy: { maxRetries: DEFAULT_MAX_RETRIES },
      },
    });
    return this.toItem(row);
  }

  async update(
    id: string,
    data: Partial<Pick<SchedulerConfigItem, "cron" | "enabled" | "description" | "timeoutMs" | "tags" | "module">>
  ): Promise<void> {
    await this.prisma.schedulerConfig.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.schedulerConfig.delete({ where: { id } });
  }
}
