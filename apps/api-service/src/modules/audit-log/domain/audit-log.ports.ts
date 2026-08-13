export interface AuditRecord {
  userId?: string;
  unionId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  detail?: unknown;
  ip?: string;
  requestId?: string;
  result: "success" | "failed";
}

export interface AuditLoggerPort {
  record(record: AuditRecord): Promise<void>;
}

export const AUDIT_LOGGER = Symbol("AUDIT_LOGGER");
