import { Injectable } from "@nestjs/common";
import { PrismaClient } from "@owl/database";
import type {
  SchedulerConfigQuery,
  SchedulerConfigRepositoryPort,
  SchedulerConfigItem,
} from "../domain/scheduler.ports";

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_TIMEOUT_MS = 60000;

@Injectable()
export class PrismaSchedulerConfigRepository implements SchedulerConfigRepositoryPort {
  constructor(private readonly prisma: PrismaClient) {}

  private toItem(raw: {
    id: number;
    name: string;
    area: string;
    cron: string;
    handler: string;
    tags: string[];
    module: string | null;
    env: string;
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
      env: raw.env,
      enabled: raw.enabled,
      description: raw.description,
      timeoutMs: raw.timeoutMs,
      updatedAt: raw.updatedAt,
    };
  }

  async findPage(query: SchedulerConfigQuery): Promise<{ items: SchedulerConfigItem[]; total: number }> {
    const where = {
      deletedAt: null,
      ...(query.keyword
        ? { OR: [{ name: { contains: query.keyword } }, { handler: { contains: query.keyword } }] }
        : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.schedulerConfig.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.schedulerConfig.count({ where }),
    ]);
    return { items: rows.map((row) => this.toItem(row)), total };
  }

  async findAll(): Promise<SchedulerConfigItem[]> {
    const rows = await this.prisma.schedulerConfig.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: "desc" },
    });
    return rows.map((row) => this.toItem(row));
  }

  async findById(id: number): Promise<SchedulerConfigItem | null> {
    const row = await this.prisma.schedulerConfig.findUnique({ where: { id, deletedAt: null } });
    return row ? this.toItem(row) : null;
  }

  async create(data: {
    name: string;
    area: string;
    cron: string;
    handler: string;
    tags?: string[];
    module?: string;
    env?: string;
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
        env: data.env ?? "all",
        description: data.description,
        timeoutMs: DEFAULT_TIMEOUT_MS,
        retryPolicy: { maxRetries: DEFAULT_MAX_RETRIES },
      },
    });
    return this.toItem(row);
  }

  async update(
    id: number,
    data: Partial<
      Pick<SchedulerConfigItem, "cron" | "enabled" | "description" | "timeoutMs" | "tags" | "module" | "env">
    >
  ): Promise<void> {
    await this.prisma.schedulerConfig.update({ where: { id, deletedAt: null }, data });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.schedulerConfig.update({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }
}
