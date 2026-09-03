import { useCallback, useEffect, useState } from "react";
import { Button, Select, Space, Table, Tag } from "@arco-design/web-react";
import type { SchedulerRun } from "../types/scheduler";

export function LogsPage() {
  const [data, setData] = useState<SchedulerRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetch("/cron/schedulers/runs" + (statusFilter ? `?status=${statusFilter}` : ""));
      const json = (await result.json()) as { data: { items: SchedulerRun[] } };
      setData(json.data?.items ?? []);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

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
    { title: "任务名", dataIndex: "taskName", width: 140, render: (v: string | null) => v ?? "-" },
    { title: "区域", dataIndex: "area", width: 100, render: (v: string | null) => v ?? "-" },
    {
      title: "状态",
      dataIndex: "status",
      width: 90,
      render: (v: string) => <Tag color={statusColor(v)}>{v}</Tag>,
    },
    {
      title: "计划时间",
      dataIndex: "scheduledAt",
      width: 170,
      render: (v: string) => new Date(v).toLocaleString("zh-CN"),
    },
    {
      title: "开始时间",
      dataIndex: "startedAt",
      width: 170,
      render: (v: string | null) => (v ? new Date(v).toLocaleString("zh-CN") : "-"),
    },
    {
      title: "完成时间",
      dataIndex: "finishedAt",
      width: 170,
      render: (v: string | null) => (v ? new Date(v).toLocaleString("zh-CN") : "-"),
    },
    {
      title: "错误信息",
      dataIndex: "lastError",
      ellipsis: true,
      render: (v: string | null) => (v ? <span className="text-red-500 text-xs">{v}</span> : "-"),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">执行日志</h2>
        <Space>
          <Select
            style={{ width: 120 }}
            placeholder="状态筛选"
            allowClear
            value={statusFilter || undefined}
            onChange={(v) => setStatusFilter(v ?? "")}
          >
            <Select.Option value="success">成功</Select.Option>
            <Select.Option value="failed">失败</Select.Option>
            <Select.Option value="running">运行中</Select.Option>
            <Select.Option value="PENDING">等待中</Select.Option>
          </Select>
          <Button onClick={() => void load()}>刷新</Button>
        </Space>
      </div>
      <Table rowKey="id" loading={loading} columns={columns} data={data} pagination={false} />
    </div>
  );
}
