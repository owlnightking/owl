import { Inject, Injectable } from "@nestjs/common";
import {
  AUDIT_LOG_REPOSITORY,
  type AuditLogListItem,
  type AuditLogListQuery,
  type AuditLogQueryPort,
} from "../domain/audit-log.ports";

@Injectable()
export class AuditLogService {
  constructor(@Inject(AUDIT_LOG_REPOSITORY) private readonly repo: AuditLogQueryPort) {}

  async list(query: AuditLogListQuery): Promise<{ items: AuditLogListItem[]; total: number }> {
    return this.repo.list(query);
  }
}
