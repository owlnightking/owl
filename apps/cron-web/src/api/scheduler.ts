import { cronHttp } from "./client";
import type { SchedulerConfig, SchedulerRun } from "../types/scheduler";

export async function fetchSchedulers(): Promise<SchedulerConfig[]> {
  const res = await cronHttp.get<{ data: SchedulerConfig[] }>("/schedulers");
  return res.data.data;
}

export async function fetchSchedulerById(id: string): Promise<SchedulerConfig> {
  const res = await cronHttp.get<{ data: SchedulerConfig }>(`/schedulers/${id}`);
  return res.data.data;
}

export async function createScheduler(data: {
  name: string;
  area: string;
  cron: string;
  handler: string;
  tags?: string[];
  module?: string;
  env?: string;
  description?: string;
}): Promise<SchedulerConfig> {
  const res = await cronHttp.post<{ data: SchedulerConfig }>("/schedulers", data);
  return res.data.data;
}

export async function updateScheduler(
  id: string,
  data: Partial<Pick<SchedulerConfig, "cron" | "enabled" | "description" | "tags" | "module">>
): Promise<void> {
  await cronHttp.put(`/schedulers/${id}`, data);
}

export async function deleteScheduler(id: string): Promise<void> {
  await cronHttp.delete(`/schedulers/${id}`);
}

export async function fetchSchedulerRuns(
  configId: string,
  page: number,
  pageSize: number
): Promise<{ items: SchedulerRun[]; total: number }> {
  const res = await cronHttp.get<{ data: { items: SchedulerRun[]; total: number } }>(`/schedulers/${configId}/runs`, {
    params: { page, pageSize },
  });
  return res.data.data;
}

export async function triggerTask(area: string, task: string): Promise<{ runId: string }> {
  const res = await cronHttp.post<{ data: { runId: string } }>("/task-queue", { area, task });
  return res.data.data;
}
