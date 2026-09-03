import { get } from "./client";
import { triggerTask } from "./scheduler";
import type { SyncLog } from "../types/scheduler";

export async function triggerFeishuSync(): Promise<{ runId: string }> {
  return triggerTask("base-data", "feishu-sync");
}

export async function fetchSyncLogs(): Promise<SyncLog[]> {
  return get<SyncLog[]>("/sync-logs");
}
