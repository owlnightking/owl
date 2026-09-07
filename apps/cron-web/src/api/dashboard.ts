import { fetchSchedulers } from "./scheduler";
import type { DashboardStats, SchedulerRun } from "../types/scheduler";

const TREND_WINDOW_DAYS = 7;
const RUN_STATUS_LABELS = [
  { status: "success", name: "成功" },
  { status: "failed", name: "失败" },
  { status: "running", name: "运行中" },
  { status: "PENDING", name: "等待中" },
];

function buildRunsTrend(runs: SchedulerRun[]): { date: string; success: number; failed: number }[] {
  const now = new Date();
  const days: { date: string; success: number; failed: number }[] = [];
  for (let i = TREND_WINDOW_DAYS - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = `${d.getMonth() + 1}/${d.getDate()}`;
    days.push({ date: key, success: 0, failed: 0 });
  }

  for (const run of runs) {
    if (run.status !== "success" && run.status !== "failed") continue;
    const finished = run.finishedAt ? new Date(run.finishedAt) : null;
    if (!finished) continue;
    const key = `${finished.getMonth() + 1}/${finished.getDate()}`;
    const bucket = days.find((d) => d.date === key);
    if (bucket) {
      if (run.status === "success") bucket.success += 1;
      else bucket.failed += 1;
    }
  }
  return days;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const [configs, runsPage] = await Promise.all([
    fetchSchedulers(),
    fetch("/cron/schedulers/runs?pageSize=200&env=prod")
      .then((r) => r.json() as Promise<{ data: { items: SchedulerRun[] } }>)
      .then((j) => j.data?.items ?? []),
  ]);

  const totalConfigs = configs.length;
  const enabledConfigs = configs.filter((c) => c.enabled).length;
  const disabledConfigs = totalConfigs - enabledConfigs;

  const totalRuns = runsPage.length;
  const runsByStatusValue = runsPage.reduce<Record<string, number>>((acc, run) => {
    acc[run.status] = (acc[run.status] ?? 0) + 1;
    return acc;
  }, {});
  const successRuns = runsByStatusValue.success ?? 0;
  const failedRuns = runsByStatusValue.failed ?? 0;
  const runningRuns = runsByStatusValue.running ?? 0;
  const pendingRuns = runsByStatusValue.PENDING ?? 0;

  const runsByStatus = RUN_STATUS_LABELS.map(({ status, name }) => ({
    status,
    name,
    value: runsByStatusValue[status] ?? 0,
  })).filter((d) => d.value > 0);

  const recentRuns = runsPage.slice(0, 10);
  const runsTrend = buildRunsTrend(runsPage);

  return {
    totalConfigs,
    enabledConfigs,
    disabledConfigs,
    totalRuns,
    successRuns,
    failedRuns,
    runningRuns,
    pendingRuns,
    runsByStatus,
    recentRuns,
    runsTrend,
  };
}
