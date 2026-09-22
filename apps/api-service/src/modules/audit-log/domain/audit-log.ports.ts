export interface AuditRecord {
  userId?: number;
  unionId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  detail?: unknown;
  ip?: string;
  ipRegion?: string;
  requestId?: string;
  result: "success" | "failed";
  system?: string;
  module?: string;
}

export interface AuditLoggerPort {
  record(record: AuditRecord): Promise<void>;
}

export interface AuditLogListItem {
  id: number;
  userId: number | null;
  unionId: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  detail: unknown;
  ip: string | null;
  ipRegion: string | null;
  requestId: string | null;
  result: string;
  system: string | null;
  module: string | null;
  createdAt: Date;
  user: { name: string; avatar72: string | null; avatar240: string | null } | null;
}

export interface AuditLogListQuery {
  userId?: number;
  resource?: string;
  page: number;
  pageSize: number;
}

export interface AuditLogQueryPort {
  list(query: AuditLogListQuery): Promise<{ items: AuditLogListItem[]; total: number }>;
}

export interface IpRegionPort {
  lookup(ip: string): string | undefined;
}

export const AUDIT_LOGGER = Symbol("AUDIT_LOGGER");
export const AUDIT_LOG_REPOSITORY = Symbol("AUDIT_LOG_REPOSITORY");
export const AUDIT_LOG_SERVICE = Symbol("AUDIT_LOG_SERVICE");
export const IP_REGION = Symbol("IP_REGION");
