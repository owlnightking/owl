export interface SchedulerConfig {
  id: string;
  name: string;
  area: string;
  cron: string;
  handler: string;
  tags: string[];
  module: string | null;
  enabled: boolean;
  description: string | null;
  timeoutMs: number;
  updatedAt: string;
}

export interface SchedulerRun {
  id: string;
  taskRunId: string;
  area: string | null;
  taskName: string | null;
  scheduledAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  status: string;
  attempts: number;
  lastError: string | null;
  createdAt: string;
}

export interface SyncLog {
  id: string;
  type: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  total: number;
  created: number;
  updated: number;
  errorMsg: string | null;
  createdAt: string;
}
