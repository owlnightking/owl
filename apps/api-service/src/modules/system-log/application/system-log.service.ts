import { Inject, Injectable, Logger } from "@nestjs/common";
import {
  SYSTEM_LOG_REPOSITORY,
  type SystemLogListQuery,
  type SystemLogRepositoryPort,
} from "../domain/system-log.ports";
import type { SystemLogRecord, SystemLogRecorderPort } from "../../../common/observability/system-log.ports";

@Injectable()
export class SystemLogService implements SystemLogRecorderPort {
  private readonly logger = new Logger(SystemLogService.name);

  constructor(@Inject(SYSTEM_LOG_REPOSITORY) private readonly repo: SystemLogRepositoryPort) {}

  async list(query: SystemLogListQuery) {
    return this.repo.list(query);
  }

  async record(entry: SystemLogRecord): Promise<void> {
    try {
      await this.repo.record(entry);
    } catch (err) {
      this.logger.warn(`system log persist failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
