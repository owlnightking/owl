import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CLIENT } from "@owl/database/provider";
import type { PrismaClient } from "@owl/database";
import type { AuditLoggerPort, AuditRecord } from "../domain/audit-log.ports";

@Injectable()
export class PrismaAuditLogger implements AuditLoggerPort {
  constructor(@Inject(DATABASE_CLIENT) private readonly prisma: PrismaClient) {}

  async record(record: AuditRecord): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId: record.userId,
        unionId: record.unionId,
        action: record.action,
        resource: record.resource,
        resourceId: record.resourceId,
        detail: record.detail as object | undefined,
        ip: record.ip,
        requestId: record.requestId,
        result: record.result,
      },
    });
  }
}
