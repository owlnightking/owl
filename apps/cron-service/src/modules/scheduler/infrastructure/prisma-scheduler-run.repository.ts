import { Injectable } from "@nestjs/common";
import { PrismaClient } from "@owl/database";
import type { SchedulerRunRepositoryPort, SchedulerRunItem } from "../domain/scheduler.ports";

@Injectable()
export class PrismaSchedulerRunRepository implements SchedulerRunRepositoryPort {
  constructor(private readonly prisma: PrismaClient) {}

  private toItem(raw: {
    id: string;
    taskRunId: string;
    area: string | null;
    taskName: string | null;
    scheduledAt: Date;
    startedAt: Date | null;
    finishedAt: Date | null;
    status: string;
    attempts: number;
    lastError: string | null;
    createdAt: Date;
  }): SchedulerRunItem {
    return {
      id: raw.id,
      taskRunId: raw.taskRunId,
      area: raw.area,
      taskName: raw.taskName,
      scheduledAt: raw.scheduledAt,
      startedAt: raw.startedAt,
      finishedAt: raw.finishedAt,
      status: raw.status,
      attempts: raw.attempts,
      lastError: raw.lastError,
      createdAt: raw.createdAt,
    };
  }

  async findByConfigId(
    configId: string,
    options: { page: number; pageSize: number }
  ): Promise<{ items: SchedulerRunItem[]; total: number }> {
    const { page, pageSize } = options;
    const [rows, total] = await Promise.all([
      this.prisma.schedulerRun.findMany({
        where: { configId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.schedulerRun.count({ where: { configId } }),
    ]);
    return { items: rows.map((r) => this.toItem(r)), total };
  }

  async findAll(options: {
    page: number;
    pageSize: number;
    status?: string;
  }): Promise<{ items: SchedulerRunItem[]; total: number }> {
    const { page, pageSize, status } = options;
    const where = status ? { status } : undefined;
    const [rows, total] = await Promise.all([
      this.prisma.schedulerRun.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.schedulerRun.count({ where }),
    ]);
    return { items: rows.map((r) => this.toItem(r)), total };
  }
}
