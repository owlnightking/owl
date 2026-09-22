import { cronHttp } from "./client";
import type { SchedulerConfig, SchedulerRun } from "../types/scheduler";

/** 任务配置选项（不分页）：看板统计用它做聚合 */
export async function fetchSchedulers(): Promise<SchedulerConfig[]> {
  const res = await cronHttp.get<{ data: SchedulerConfig[] }>("/schedulers/options");
  return res.data.data;
}

/** 任务配置分页列表 */
export async function fetchSchedulerPage(params: {
  page: number;
  pageSize: number;
  keyword?: string;
}): Promise<{ list: SchedulerConfig[]; pageNum: number; pageSize: number; total: number }> {
  const res = await cronHttp.get<{
    data: { list: SchedulerConfig[]; pageNum: number; pageSize: number; total: number };
  }>("/schedulers", { params });
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
): Promise<{ list: SchedulerRun[]; pageNum: number; pageSize: number; total: number }> {
  const res = await cronHttp.get<{
    data: { list: SchedulerRun[]; pageNum: number; pageSize: number; total: number };
  }>(`/schedulers/${configId}/runs`, {
    params: { page, pageSize },
  });
  return res.data.data;
}

/** 全部运行记录（分页），供执行日志页使用 */
export async function fetchAllRuns(params: {
  page: number;
  pageSize: number;
  status?: string;
  env?: string;
}): Promise<{ list: SchedulerRun[]; pageNum: number; pageSize: number; total: number }> {
  const res = await cronHttp.get<{
    data: { list: SchedulerRun[]; pageNum: number; pageSize: number; total: number };
  }>("/schedulers/runs", { params });
  return res.data.data;
}

export async function triggerTask(area: string, task: string): Promise<{ runId: string }> {
  const res = await cronHttp.post<{ data: { runId: string } }>("/task-queue", { area, task });
  return res.data.data;
}
