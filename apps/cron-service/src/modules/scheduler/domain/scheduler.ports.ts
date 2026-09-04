export interface SchedulerConfigItem {
  id: string;
  name: string;
  area: string;
  cron: string;
  handler: string;
  tags: string[];
  module: string | null;
  env: string;
  enabled: boolean;
  description: string | null;
  timeoutMs: number;
  updatedAt: Date;
}

export interface SchedulerRunItem {
  id: string;
  taskRunId: string;
  area: string | null;
  taskName: string | null;
  scheduledAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
  status: string;
  attempts: number;
  lastError: string | null;
  createdAt: Date;
}

export interface SchedulerConfigRepositoryPort {
  findAll(): Promise<SchedulerConfigItem[]>;
  findById(id: string): Promise<SchedulerConfigItem | null>;
  create(data: {
    name: string;
    area: string;
    cron: string;
    handler: string;
    tags?: string[];
    module?: string;
    env?: string;
    description?: string;
  }): Promise<SchedulerConfigItem>;
  update(
    id: string,
    data: Partial<Pick<SchedulerConfigItem, "cron" | "enabled" | "description" | "timeoutMs" | "env">>
  ): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface SchedulerRunRepositoryPort {
  findByConfigId(
    configId: string,
    options: { page: number; pageSize: number }
  ): Promise<{ items: SchedulerRunItem[]; total: number }>;
  findAll(options: {
    page: number;
    pageSize: number;
    status?: string;
    env?: string;
  }): Promise<{ items: SchedulerRunItem[]; total: number }>;
}

export const SCHEDULER_CONFIG_REPOSITORY = Symbol("SCHEDULER_CONFIG_REPOSITORY");
export const SCHEDULER_RUN_REPOSITORY = Symbol("SCHEDULER_RUN_REPOSITORY");
