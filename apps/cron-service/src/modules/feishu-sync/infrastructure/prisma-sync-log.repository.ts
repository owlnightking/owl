import { Injectable } from "@nestjs/common";
import { PrismaClient } from "@owl/database";
import type { SyncLogRepositoryPort } from "../domain/feishu-sync.ports";

@Injectable()
export class PrismaSyncLogRepository implements SyncLogRepositoryPort {
  constructor(private readonly prisma: PrismaClient) {}

  async create(type: string): Promise<string> {
    const log = await this.prisma.syncLog.create({
      data: {
        type,
        status: "running",
        startedAt: new Date(),
      },
    });
    return log.id;
  }

  async update(
    id: string,
    data: { status: string; total?: number; created?: number; updated?: number; errorMsg?: string }
  ): Promise<void> {
    const updateData: Record<string, unknown> = { status: data.status };
    if (data.status === "success" || data.status === "failed") {
      updateData.finishedAt = new Date();
    }
    if (data.total !== undefined) updateData.total = data.total;
    if (data.created !== undefined) updateData.created = data.created;
    if (data.updated !== undefined) updateData.updated = data.updated;
    if (data.errorMsg !== undefined) updateData.errorMsg = data.errorMsg;

    await this.prisma.syncLog.update({ where: { id }, data: updateData });
  }
}
