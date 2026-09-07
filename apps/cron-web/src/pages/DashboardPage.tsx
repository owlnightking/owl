import { useEffect, useState } from "react";
import { Card, Grid, Spin, Statistic, Table, Tag } from "@arco-design/web-react";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { fetchDashboardStats } from "../api/dashboard";
import type { DashboardStats } from "../types/scheduler";

const { Row, Col } = Grid;

const TAG_STATUS_COLOR: Record<string, string> = {
  success: "green",
  failed: "red",
  running: "blue",
  PENDING: "gray",
};

const STATUS_COLOR: Record<string, string> = {
  success: "#00b42a",
  failed: "#f53f3f",
  running: "#165dff",
  PENDING: "#86909c",
};

function StatCard({ title, value, color }: { title: string; value: number; color?: string }) {
  return (
    <Card bordered>
      <Statistic title={title} value={value} styleValue={color ? { color } : undefined} />
    </Card>
  );
}

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchDashboardStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spin tip="加载数据面板..." />
      </div>
    );
  }

  if (!stats) {
    return <div className="text-center text-gray-400">加载失败</div>;
  }

  const columns = [
    { title: "任务名", dataIndex: "taskName", width: 140, render: (v: string | null) => v ?? "-" },
    { title: "区域", dataIndex: "area", width: 100, render: (v: string | null) => v ?? "-" },
    {
      title: "状态",
      dataIndex: "status",
      width: 90,
      render: (v: string) => <Tag color={TAG_STATUS_COLOR[v] ?? "gray"}>{v}</Tag>,
    },
    {
      title: "计划时间",
      dataIndex: "scheduledAt",
      width: 170,
      render: (v: string) => new Date(v).toLocaleString("zh-CN"),
    },
    {
      title: "耗时",
      width: 100,
      render: (_: unknown, record: { startedAt: string | null; finishedAt: string | null }) => {
        if (!record.startedAt || !record.finishedAt) return "-";
        const ms = new Date(record.finishedAt).getTime() - new Date(record.startedAt).getTime();
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(1)}s`;
      },
    },
    {
      title: "错误信息",
      dataIndex: "lastError",
      ellipsis: true,
      render: (v: string | null) => (v ? <span className="text-xs text-red-500">{v}</span> : "-"),
    },
  ];

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-gray-800">任务中心</h2>

      <Row gutter={16} className="mb-4">
        <Col span={6}>
          <StatCard title="总任务数" value={stats.totalConfigs} />
        </Col>
        <Col span={6}>
          <StatCard title="启用中" value={stats.enabledConfigs} color={STATUS_COLOR.success} />
        </Col>
        <Col span={6}>
          <StatCard title="已禁用" value={stats.disabledConfigs} color={STATUS_COLOR.PENDING} />
        </Col>
        <Col span={6}>
          <StatCard title="总执行次数" value={stats.totalRuns} color={STATUS_COLOR.running} />
        </Col>
      </Row>

      <Row gutter={16} className="mb-4">
        <Col span={12}>
          <Card title="任务状态分布" bordered>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={stats.runsByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }: { name?: string; percent?: number }) =>
                    `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                >
                  {stats.runsByStatus.map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLOR[entry.status] ?? STATUS_COLOR.PENDING} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="近 7 天执行趋势" bordered>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={stats.runsTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="success" name="成功" stroke={STATUS_COLOR.success} strokeWidth={2} />
                <Line type="monotone" dataKey="failed" name="失败" stroke={STATUS_COLOR.failed} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} className="mb-4">
        <Col span={6}>
          <Card bordered>
            <Statistic title="成功" value={stats.successRuns} styleValue={{ color: STATUS_COLOR.success }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered>
            <Statistic title="失败" value={stats.failedRuns} styleValue={{ color: STATUS_COLOR.failed }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered>
            <Statistic title="运行中" value={stats.runningRuns} styleValue={{ color: STATUS_COLOR.running }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered>
            <Statistic title="等待中" value={stats.pendingRuns} styleValue={{ color: STATUS_COLOR.PENDING }} />
          </Card>
        </Col>
      </Row>

      <Card title="最近执行日志" bordered>
        <Table rowKey="id" columns={columns} data={stats.recentRuns} pagination={false} />
      </Card>
    </div>
  );
}
