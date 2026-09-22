import { get } from "./client";

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
  createdAt: string;
}

export interface SystemLogPage {
  list: SystemLogItem[];
  pageNum: number;
  pageSize: number;
  total: number;
}

export interface SystemLogQuery {
  page: number;
  pageSize: number;
  level?: string;
  service?: string;
  keyword?: string;
}

export async function fetchSystemLogs(query: SystemLogQuery): Promise<SystemLogPage> {
  return get<SystemLogPage>("/system-logs", { ...query });
}
