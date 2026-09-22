export interface SystemLogRecord {
  service?: string;
  level: "error" | "warn";
  message: string;
  stack?: string;
  requestId?: string;
  method?: string;
  url?: string;
  status?: number;
  code?: number;
  userId?: number;
}

export interface SystemLogRecorderPort {
  record(entry: SystemLogRecord): Promise<void>;
}

export const SYSTEM_LOG_RECORDER = Symbol("SYSTEM_LOG_RECORDER");
