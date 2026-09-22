import type { SystemLogRecord } from "../../../common/observability/system-log.ports";

export interface SystemLogItem {
  id: number;
  service: string | null;
  level: string;
  message: string;
  stack: string | null;
  requestId: string | null;
  method: string | null;
  url: string | null;
  status: number | null;
  code: number | null;
  userId: number | null;
  createdAt: Date;
}

export interface SystemLogListQuery {
  level?: string;
  service?: string;
  keyword?: string;
  page: number;
  pageSize: number;
}

export interface SystemLogRepositoryPort {
  list(query: SystemLogListQuery): Promise<{ items: SystemLogItem[]; total: number }>;
  record(entry: SystemLogRecord): Promise<void>;
}

export const SYSTEM_LOG_REPOSITORY = Symbol("SYSTEM_LOG_REPOSITORY");
export const SYSTEM_LOG_SERVICE = Symbol("SYSTEM_LOG_SERVICE");
