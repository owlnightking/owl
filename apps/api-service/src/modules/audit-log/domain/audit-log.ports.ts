export interface AuditRecord {
  userId?: string;
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

export interface IpRegionPort {
  lookup(ip: string): string | undefined;
}

export const AUDIT_LOGGER = Symbol("AUDIT_LOGGER");
export const IP_REGION = Symbol("IP_REGION");
