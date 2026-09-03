import { useEffect, useState } from "react";
import { Button, Card, Message, Space, Table, Tag } from "@arco-design/web-react";
import { triggerFeishuSync } from "../api/feishu-sync";
import type { SyncLog } from "../types/scheduler";

export function SettingsPage() {
  const [syncing, setSyncing] = useState(false);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const loadLogs = async () => {
    setLoadingLogs(true);
    try {
      const result = await fetch("/cron/sync-logs");
      const json = (await result.json()) as { data: SyncLog[] };
      setLogs(json.data ?? []);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    void loadLogs();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await triggerFeishuSync();
      Message.success("同步任务已提交，请稍后查看结果");
      setTimeout(() => void loadLogs(), 2000);
    } catch (error) {
      Message.error(error instanceof Error ? error.message : "同步失败");
    } finally {
      setSyncing(false);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "success":
        return "green";
      case "failed":
        return "red";
      case "running":
        return "blue";
      default:
        return "gray";
    }
  };

  const columns = [
    { title: "类型", dataIndex: "type" },
    {
      title: "状态",
      dataIndex: "status",
      render: (v: string) => <Tag color={statusColor(v)}>{v}</Tag>,
    },
    { title: "开始时间", dataIndex: "startedAt", render: (v: string) => new Date(v).toLocaleString("zh-CN") },
    {
      title: "完成时间",
      dataIndex: "finishedAt",
      render: (v: string | null) => (v ? new Date(v).toLocaleString("zh-CN") : "-"),
    },
    { title: "总数", dataIndex: "total" },
    { title: "新增", dataIndex: "created" },
    { title: "更新", dataIndex: "updated" },
    {
      title: "错误信息",
      dataIndex: "errorMsg",
      render: (v: string | null) => (v ? <span className="text-red-500 text-xs">{v}</span> : "-"),
    },
  ];

  const latestLog = logs[0];

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-gray-800">系统设置</h2>

      <Card title="飞书人员同步" className="mb-4">
        <div className="mb-4">
          <p className="mb-2 text-sm text-gray-600">
            从飞书通讯录同步全量用户和部门数据到本地数据库。每天凌晨 2 点自动执行，也可手动触发。
          </p>
          {latestLog && (
            <div className="mb-3 rounded bg-gray-50 p-3 text-sm">
              <div>最近同步：{new Date(latestLog.startedAt).toLocaleString("zh-CN")}</div>
              <div>
                状态：
                <Tag color={statusColor(latestLog.status)} className="ml-1">
                  {latestLog.status}
                </Tag>
              </div>
              {latestLog.status === "success" && (
                <div>
                  结果：共 {latestLog.total} 人，新增 {latestLog.created}，更新 {latestLog.updated}
                </div>
              )}
              {latestLog.errorMsg && <div className="text-red-500">错误：{latestLog.errorMsg}</div>}
            </div>
          )}
          <Space>
            <Button type="primary" loading={syncing} onClick={() => void handleSync()}>
              手动同步
            </Button>
            <Button onClick={() => void loadLogs()}>刷新</Button>
          </Space>
        </div>
      </Card>

      <Card title="同步历史">
        <Table rowKey="id" loading={loadingLogs} columns={columns} data={logs} pagination={false} />
      </Card>
    </div>
  );
}
