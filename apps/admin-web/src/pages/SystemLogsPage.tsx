/**
 * 系统日志 —— 按 apps/admin-web/src/pages/SampleListPage.tsx 的样板改造（规范见 docs/frontend-rules.md 第五节）。
 *
 * 只读页面：不设操作行，无右端固定的操作列。筛选条件（级别 / 服务 / 关键字）在草稿态编辑，
 * 点「搜索」才提交生效；保留原有的展开行显示堆栈。
 */
import { useCallback, useEffect, useState } from "react";
import { Button, Input, Notification, Pagination, Select, Spin, Table, Tag, Tooltip } from "@arco-design/web-react";
import { IconRefresh, IconSearch } from "@arco-design/web-react/icon";
import { fetchSystemLogs, type SystemLogItem } from "../api/system-logs";

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const LEVEL_MAP: Record<string, { label: string; color: string }> = {
  error: { label: "错误", color: "red" },
  warn: { label: "警告", color: "orange" },
};

const METHOD_COLORS: Record<string, string> = {
  GET: "arcoblue",
  POST: "green",
  PUT: "orange",
  PATCH: "purple",
  DELETE: "red",
};

const LEVEL_OPTIONS = [
  { label: "全部级别", value: "all" },
  { label: "错误", value: "error" },
  { label: "警告", value: "warn" },
];

const SERVICE_OPTIONS = [
  { label: "全部服务", value: "all" },
  { label: "api-service", value: "api-service" },
  { label: "cron-service", value: "cron-service" },
];

interface LogFilters {
  level: string;
  service: string;
  keyword: string;
}

const EMPTY_FILTERS: LogFilters = { level: "all", service: "all", keyword: "" };

export function SystemLogsPage() {
  const [data, setData] = useState<SystemLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<LogFilters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<LogFilters>(EMPTY_FILTERS);

  const load = useCallback(async (currentPage: number, size: number, current: LogFilters) => {
    setLoading(true);
    try {
      const result = await fetchSystemLogs({
        page: currentPage,
        pageSize: size,
        level: current.level === "all" ? undefined : current.level,
        service: current.service === "all" ? undefined : current.service,
        keyword: current.keyword || undefined,
      });
      setData(result.list);
      setTotal(result.total);
    } catch (error) {
      Notification.error({ title: "失败", content: error instanceof Error ? error.message : "加载失败" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(page, pageSize, applied);
  }, [page, pageSize, applied, load]);

  const patchDraft = (patch: Partial<LogFilters>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const handleSearch = () => {
    setApplied(draft);
    setPage(1);
  };

  const handleReset = () => {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
    setPage(1);
  };

  const columns = [
    // 左侧固定列必须排在列首
    {
      title: "时间",
      dataIndex: "createdAt",
      fixed: "left" as const,
      width: 180,
      render: (value: string) => new Date(value).toLocaleString(),
    },
    {
      title: "服务",
      dataIndex: "service",
      width: 130,
      render: (value: string | null) => (value ? <Tag color="arcoblue">{value}</Tag> : "-"),
    },
    {
      title: "级别",
      dataIndex: "level",
      width: 90,
      render: (value: string) => {
        const meta = LEVEL_MAP[value];
        return <Tag color={meta?.color ?? "gray"}>{meta?.label ?? value}</Tag>;
      },
    },
    {
      title: "方法",
      dataIndex: "method",
      width: 90,
      render: (value: string | null) => (value ? <Tag color={METHOD_COLORS[value] ?? "gray"}>{value}</Tag> : "-"),
    },
    {
      title: "请求地址",
      dataIndex: "url",
      width: 240,
      render: (value: string | null) =>
        value ? (
          <Tooltip content={value}>
            <span className="block max-w-[220px] truncate font-mono text-xs text-gray-600">{value}</span>
          </Tooltip>
        ) : (
          "-"
        ),
    },
    {
      title: "状态码",
      dataIndex: "status",
      width: 90,
      render: (value: number | null) => value ?? "-",
    },
    {
      title: "错误码",
      dataIndex: "code",
      width: 90,
      render: (value: number | null) => value ?? "-",
    },
    {
      title: "用户",
      dataIndex: "userId",
      width: 80,
      render: (value: number | null) => value ?? "-",
    },
    {
      title: "错误信息",
      dataIndex: "message",
      width: 320,
      render: (value: string) => (
        <Tooltip content={value}>
          <span className="block max-w-[300px] truncate">{value}</span>
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* 1. 页面标题区 */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <h1 className="text-xl font-semibold text-gray-800">系统日志</h1>
          <span className="text-sm text-gray-400">记录后端运行时异常（4xx 警告 / 5xx 错误）</span>
        </div>
      </div>

      {/* 2. 筛选区：条件网格 + 搜索/重置贴最后一行最右 */}
      <div className="grid grid-cols-4 gap-3">
        <Select
          value={draft.level}
          onChange={(value: string) => patchDraft({ level: value })}
          options={LEVEL_OPTIONS}
          style={{ width: "100%" }}
        />
        <Select
          value={draft.service}
          onChange={(value: string) => patchDraft({ service: value })}
          options={SERVICE_OPTIONS}
          style={{ width: "100%" }}
        />
        <Input
          value={draft.keyword}
          onChange={(value) => patchDraft({ keyword: value })}
          onPressEnter={handleSearch}
          placeholder="错误信息 / 请求地址"
          allowClear
        />
        <div className="col-start-4 flex items-center justify-end gap-2">
          <Tooltip content="搜索">
            <Button type="primary" icon={<IconSearch />} onClick={handleSearch} />
          </Tooltip>
          <Tooltip content="重置">
            <Button icon={<IconRefresh />} onClick={handleReset} />
          </Tooltip>
        </div>
      </div>

      {/* 3. 列表区：Spin 点指示符 + 展开行看堆栈 + 分页默认 10 条 */}
      <div>
        <Spin loading={loading} dot block>
          <Table
            rowKey="id"
            columns={columns}
            data={data}
            pagination={false}
            scroll={{ x: 1320 }}
            expandedRowRender={(record: SystemLogItem) => (
              <pre className="m-0 whitespace-pre-wrap break-all text-xs text-gray-600">
                {record.stack ?? "无堆栈信息"}
              </pre>
            )}
          />
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
