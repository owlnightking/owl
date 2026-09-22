import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CLIENT } from "@owl/database/provider";
import type { PrismaClient } from "@owl/database";
import type { SystemLogRecord } from "../../../common/observability/system-log.ports";
import type { SystemLogItem, SystemLogListQuery, SystemLogRepositoryPort } from "../domain/system-log.ports";

@Injectable()
export class PrismaSystemLogRepository implements SystemLogRepositoryPort {
  constructor(@Inject(DATABASE_CLIENT) private readonly prisma: PrismaClient) {}

  async list(query: SystemLogListQuery): Promise<{ items: SystemLogItem[]; total: number }> {
    const where = {
      deletedAt: null,
      ...(query.level ? { level: query.level } : {}),
      ...(query.service ? { service: query.service } : {}),
      ...(query.keyword
        ? {
            OR: [
              { message: { contains: query.keyword, mode: "insensitive" as const } },
              { url: { contains: query.keyword, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.systemLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.systemLog.count({ where }),
    ]);
    return { items, total };
  }

  async record(entry: SystemLogRecord): Promise<void> {
    await this.prisma.systemLog.create({
      data: {
        service: entry.service,
        level: entry.level,
        message: entry.message,
        stack: entry.stack,
        requestId: entry.requestId,
        method: entry.method,
        url: entry.url,
        status: entry.status,
        code: entry.code,
        userId: entry.userId,
      },
    });
  }
}
