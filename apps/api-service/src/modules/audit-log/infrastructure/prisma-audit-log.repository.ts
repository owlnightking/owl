import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CLIENT } from "@owl/database/provider";
import type { PrismaClient } from "@owl/database";
import type { AuditLogListItem, AuditLogListQuery, AuditLogQueryPort } from "../domain/audit-log.ports";

@Injectable()
export class PrismaAuditLogRepository implements AuditLogQueryPort {
  constructor(@Inject(DATABASE_CLIENT) private readonly prisma: PrismaClient) {}

  async list(query: AuditLogListQuery): Promise<{ items: AuditLogListItem[]; total: number }> {
    const where = {
      deletedAt: null,
      ...(query.userId ? { userId: query.userId } : {}),
      ...(query.resource ? { resource: query.resource } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: {
          user: {
            select: {
              name: true,
              avatar72: true,
              avatar240: true,
            },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { items, total };
  }
}
