import { Injectable, Logger } from "@nestjs/common";
import { PrismaClient } from "@owl/database";
import type { SystemLogRecorderPort, SystemLogRecord } from "./system-log.ports";

const SERVICE_NAME = "cron-service";

@Injectable()
export class PrismaSystemLogRecorder implements SystemLogRecorderPort {
  private readonly logger = new Logger(PrismaSystemLogRecorder.name);

  constructor(private readonly prisma: PrismaClient) {}

  async record(entry: SystemLogRecord): Promise<void> {
    try {
      await this.prisma.systemLog.create({ data: { service: SERVICE_NAME, ...entry } });
    } catch (err) {
      this.logger.warn(`system log persist failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
