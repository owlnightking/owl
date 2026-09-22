import { useCallback, useEffect, useState } from "react";
import { Button, Input, Notification, Select, Skeleton, Space, Table, Tag, Tooltip } from "@arco-design/web-react";
import { IconRefresh, IconSearch } from "@arco-design/web-react/icon";
import { fetchSystemLogs, type SystemLogItem } from "../api/system-logs";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

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

function SystemLogsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton text={{ rows: 1 }} />
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <Skeleton text={{ rows: 8 }} />
      </div>
    </div>
  );
}

export function SystemLogsPage() {
  const [data, setData] = useState<SystemLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const [level, setLevel] = useState("all");
  const [service, setService] = useState("all");
  const [keyword, setKeyword] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchSystemLogs({
        page,
        pageSize,
        level: level === "all" ? undefined : level,
        service: service === "all" ? undefined : service,
        keyword: appliedKeyword || undefined,
      });
      setData(result.list);
      setTotal(result.total);
    } catch (error) {
      Notification.error({ title: "加载失败", content: error instanceof Error ? error.message : "加载失败" });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, level, service, appliedKeyword]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSearch = () => {
    setPage(DEFAULT_PAGE);
    setAppliedKeyword(keyword.trim());
  };

  const columns = [
    {
      title: "时间",
      dataIndex: "createdAt",
      width: 180,
      render: (v: string) => new Date(v).toLocaleString(),
    },
    {
      title: "服务",
      dataIndex: "service",
      width: 130,
      render: (v: string | null) => (v ? <Tag color="arcoblue">{v}</Tag> : "-"),
    },
    {
      title: "级别",
      dataIndex: "level",
      width: 90,
      render: (v: string) => {
        const meta = LEVEL_MAP[v];
        return <Tag color={meta?.color ?? "gray"}>{meta?.label ?? v}</Tag>;
      },
    },
    {
      title: "方法",
      dataIndex: "method",
      width: 90,
      render: (v: string | null) => (v ? <Tag color={METHOD_COLORS[v] ?? "gray"}>{v}</Tag> : "-"),
    },
    {
      title: "请求地址",
      dataIndex: "url",
      width: 240,
      render: (v: string | null) =>
        v ? (
          <Tooltip content={v}>
            <span className="block max-w-[220px] truncate font-mono text-xs text-gray-600">{v}</span>
          </Tooltip>
        ) : (
          "-"
        ),
    },
    {
      title: "状态码",
      dataIndex: "status",
      width: 90,
      render: (v: number | null) => v ?? "-",
    },
    {
      title: "错误码",
      dataIndex: "code",
      width: 90,
      render: (v: number | null) => v ?? "-",
    },
    {
      title: "用户",
      dataIndex: "userId",
      width: 80,
      render: (v: number | null) => v ?? "-",
    },
    {
      title: "错误信息",
      dataIndex: "message",
      render: (v: string) => (
        <Tooltip content={v}>
          <span className="block max-w-[320px] truncate">{v}</span>
        </Tooltip>
      ),
    },
  ];

  if (loading && data.length === 0) {
    return <SystemLogsSkeleton />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">系统日志</h2>
          <p className="mt-1 text-sm text-gray-500">记录后端运行时异常（4xx 警告 / 5xx 错误）</p>
        </div>
        <Tooltip content="刷新">
          <Button icon={<IconRefresh />} onClick={() => void load()} />
        </Tooltip>
      </div>

      <div className="rounded-lg bg-white p-4 shadow-sm">
        <Space wrap>
          <Select value={level} onChange={setLevel} options={LEVEL_OPTIONS} className="w-32" />
          <Select value={service} onChange={setService} options={SERVICE_OPTIONS} className="w-40" />
          <Input
            value={keyword}
            onChange={setKeyword}
            onPressEnter={handleSearch}
            placeholder="错误信息 / 请求地址"
            allowClear
            className="w-64"
          />
          <Button type="primary" icon={<IconSearch />} onClick={handleSearch}>
            查询
          </Button>
        </Space>
      </div>

      <div className="rounded-lg bg-white p-4 shadow-sm">
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          data={data}
          scroll={{ x: 1400 }}
          expandedRowRender={(record: SystemLogItem) => (
            <pre className="m-0 whitespace-pre-wrap break-all text-xs text-gray-600">
              {record.stack ?? "无堆栈信息"}
            </pre>
          )}
          pagination={{
            current: page,
            pageSize,
            total,
            showTotal: true,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </div>
    </div>
  );
}
