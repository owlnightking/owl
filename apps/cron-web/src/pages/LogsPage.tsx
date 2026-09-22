/**
 * 执行日志 —— 按 apps/admin-web/src/pages/SampleListPage.tsx 的样板改造（规范见 docs/frontend-rules.md 第五节）。
 *
 * 只读页面：操作行只有「刷新」；PROD / DEV 是页面级视图切换，按规范用胶囊 Tabs 放在操作行左侧。
 * 筛选条件（状态）在草稿态编辑，点「搜索」才提交生效。
 */
import { useCallback, useEffect, useState } from "react";
import { Button, Notification, Pagination, Select, Spin, Table, Tabs, Tag, Tooltip } from "@arco-design/web-react";
import { IconRefresh, IconSearch } from "@arco-design/web-react/icon";
import { fetchAllRuns } from "../api/scheduler";
import type { SchedulerRun } from "../types/scheduler";

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const STATUS_OPTIONS = [
  { label: "成功", value: "success" },
  { label: "失败", value: "failed" },
  { label: "运行中", value: "running" },
  { label: "等待中", value: "PENDING" },
];

const STATUS_COLOR: Record<string, string> = {
  success: "green",
  failed: "red",
  running: "blue",
};

export function LogsPage() {
  const [data, setData] = useState<SchedulerRun[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [statusDraft, setStatusDraft] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [env, setEnv] = useState<string>("prod");

  useEffect(() => {
    void fetch("/cron/health/env")
      .then((res) => res.json() as Promise<{ env: string }>)
      .then((json) => setEnv(json.env === "prod" ? "prod" : "dev"))
      .catch(() => {
        // 取不到环境时保持默认 prod，不阻塞日志查看
      });
  }, []);

  const load = useCallback(
    async (currentPage: number, size: number, currentStatus: string | undefined, currentEnv: string) => {
      setLoading(true);
      try {
        const result = await fetchAllRuns({
          page: currentPage,
          pageSize: size,
          status: currentStatus,
          env: currentEnv,
        });
        setData(result.list);
        setTotal(result.total);
      } catch (error) {
        Notification.error({ title: "失败", content: error instanceof Error ? error.message : "加载失败" });
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void load(page, pageSize, status, env);
  }, [page, pageSize, status, env, load]);

  const handleSearch = () => {
    setStatus(statusDraft);
    setPage(1);
  };

  const handleReset = () => {
    setStatusDraft(undefined);
    setStatus(undefined);
    setPage(1);
  };

  const columns = [
    // 左侧固定列必须排在列首
    {
      title: "任务名",
      dataIndex: "taskName",
      fixed: "left" as const,
      width: 160,
      render: (v: string | null) => v ?? "-",
    },
    { title: "区域", dataIndex: "area", width: 100, render: (v: string | null) => v ?? "-" },
    {
      title: "状态",
      dataIndex: "status",
      width: 100,
      render: (v: string) => <Tag color={STATUS_COLOR[v] ?? "gray"}>{v}</Tag>,
    },
    {
      title: "计划时间",
      dataIndex: "scheduledAt",
      width: 180,
      render: (v: string) => new Date(v).toLocaleString("zh-CN"),
    },
    {
      title: "开始时间",
      dataIndex: "startedAt",
      width: 180,
      render: (v: string | null) => (v ? new Date(v).toLocaleString("zh-CN") : "-"),
    },
    {
      title: "完成时间",
      dataIndex: "finishedAt",
      width: 180,
      render: (v: string | null) => (v ? new Date(v).toLocaleString("zh-CN") : "-"),
    },
    {
      title: "错误信息",
      dataIndex: "lastError",
      width: 260,
      render: (v: string | null) =>
        v ? (
          <Tooltip content={v}>
            <span className="block max-w-[240px] truncate text-xs text-red-500">{v}</span>
          </Tooltip>
        ) : (
          "-"
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* 1. 页面标题区 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">执行日志</h1>
      </div>

      {/* 2. 筛选区：条件网格 + 搜索/重置贴最后一行最右 */}
      <div className="grid grid-cols-4 gap-3">
        <Select
          allowClear
          placeholder="执行状态"
          style={{ width: "100%" }}
          value={statusDraft}
          onChange={(value: string | undefined) => setStatusDraft(value)}
        >
          {STATUS_OPTIONS.map((option) => (
            <Select.Option key={option.value} value={option.value}>
              {option.label}
            </Select.Option>
          ))}
        </Select>
        <div className="col-start-4 flex items-center justify-end gap-2">
          <Tooltip content="搜索">
            <Button type="primary" icon={<IconSearch />} onClick={handleSearch} />
          </Tooltip>
          <Tooltip content="重置">
            <Button icon={<IconRefresh />} onClick={handleReset} />
          </Tooltip>
        </div>
      </div>

      {/* 3. 操作行：左侧环境切换（页面级小 tab），右侧刷新 */}
      <div className="flex items-center gap-2">
        <Tabs
          type="capsule"
          size="small"
          className="w-fit shrink-0"
          activeTab={env}
          onChange={(key) => {
            setEnv(key);
            setPage(1);
          }}
        >
          <Tabs.TabPane key="prod" title="PROD" />
          <Tabs.TabPane key="dev" title="DEV" />
        </Tabs>
        <div className="ml-auto flex items-center gap-2">
          <Tooltip content="刷新">
            <Button icon={<IconRefresh />} onClick={() => void load(page, pageSize, status, env)} />
          </Tooltip>
        </div>
      </div>

      {/* 4. 列表区：Spin 点指示符 + 分页默认 10 条 */}
      <div>
        <Spin loading={loading} dot block>
          <Table rowKey="id" columns={columns} data={data} pagination={false} scroll={{ x: 1160 }} />
        </Spin>
        <div className="mt-4 flex justify-end">
          <Pagination
            showTotal={(count) => `共 ${count} 条`}
            total={total}
            current={page}
            pageSize={pageSize}
            sizeCanChange
            sizeOptions={PAGE_SIZE_OPTIONS}
            onChange={(currentPage, currentSize) => {
              setPage(currentPage);
              setPageSize(currentSize);
            }}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </div>
      </div>
    </div>
  );
}
