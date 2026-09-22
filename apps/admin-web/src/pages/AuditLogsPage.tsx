/**
 * 操作审计 —— 按 apps/admin-web/src/pages/SampleListPage.tsx 的样板改造（规范见 docs/frontend-rules.md 第五节）。
 *
 * 只读页面：没有新增 / 编辑 / 删除 / 多选能力，因此操作行只保留「刷新」，也没有右端固定的操作列。
 * 接口支持 userId / resource 两个筛选条件，已在筛选区暴露。
 */
import { useCallback, useEffect, useState } from "react";
import { Avatar, Button, Input, Notification, Pagination, Spin, Table, Tag, Tooltip } from "@arco-design/web-react";
import { IconRefresh, IconSearch } from "@arco-design/web-react/icon";
import { get } from "../api/client";

interface AuditLogUser {
  name: string;
  avatar72: string | null;
  avatar240: string | null;
}

interface AuditLogItem {
  id: number;
  userId: number | null;
  unionId: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  detail: Record<string, unknown> | null;
  ip: string | null;
  ipRegion: string | null;
  requestId: string | null;
  result: string;
  system: string | null;
  module: string | null;
  createdAt: string;
  user: AuditLogUser | null;
}

interface AuditLogPageData {
  list: AuditLogItem[];
  pageNum: number;
  pageSize: number;
  total: number;
}

const ACTION_MAP: Record<string, string> = {
  create: "新增",
  update: "编辑",
  patch: "修改",
  delete: "删除",
};

const SYSTEM_MAP: Record<string, string> = {
  admin: "管理后台",
  cron: "定时任务",
  mobile: "业务前台",
};

const HTTP_METHOD_MAP: Record<string, string> = {
  create: "POST",
  update: "PUT",
  patch: "PATCH",
  delete: "DELETE",
};

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export function AuditLogsPage() {
  const [data, setData] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [userIdInput, setUserIdInput] = useState("");
  const [resourceInput, setResourceInput] = useState("");
  const [filters, setFilters] = useState<{ userId?: number; resource?: string }>({});

  const load = useCallback(
    async (currentPage: number, size: number, current: { userId?: number; resource?: string }) => {
      setLoading(true);
      try {
        const result = await get<AuditLogPageData>("/audit-logs", {
          page: currentPage,
          pageSize: size,
          userId: current.userId,
          resource: current.resource,
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
    void load(page, pageSize, filters);
  }, [page, pageSize, filters, load]);

  const handleSearch = () => {
    setFilters({
      userId: userIdInput ? Number(userIdInput) : undefined,
      resource: resourceInput || undefined,
    });
    setPage(1);
  };

  const handleReset = () => {
    setUserIdInput("");
    setResourceInput("");
    setFilters({});
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
      title: "用户",
      dataIndex: "user",
      width: 160,
      render: (_: unknown, record: AuditLogItem) => {
        const user = record.user;
        if (!user) {
          return <span className="text-gray-400">{record.unionId ?? "-"}</span>;
        }
        return (
          <div className="flex items-center gap-2">
            <Avatar size={24} shape="circle">
              {user.avatar72 ? <img src={user.avatar72} alt={user.name} /> : user.name?.charAt(0)}
            </Avatar>
            <span className="block max-w-[100px] truncate">{user.name}</span>
          </div>
        );
      },
    },
    {
      title: "系统",
      dataIndex: "system",
      width: 110,
      render: (value: string | null) => {
        if (!value) {
          return "-";
        }
        return <Tag color="arcoblue">{SYSTEM_MAP[value] ?? value}</Tag>;
      },
    },
    {
      title: "端口",
      dataIndex: "port",
      width: 90,
      render: (_: unknown, record: AuditLogItem) =>
        record.system === "mobile" ? <Tag color="orange">移动端</Tag> : <Tag color="blue">web端</Tag>,
    },
    {
      title: "模块",
      dataIndex: "module",
      width: 140,
      render: (value: string | null) =>
        value ? (
          <Tooltip content={value}>
            <span className="block max-w-[110px] truncate">{value}</span>
          </Tooltip>
        ) : (
          "-"
        ),
    },
    {
      title: "动作",
      dataIndex: "action",
      width: 90,
      render: (value: string) => {
        const color = value === "delete" ? "red" : value === "create" ? "green" : "blue";
        return <Tag color={color}>{ACTION_MAP[value] ?? value}</Tag>;
      },
    },
    {
      title: "API",
      dataIndex: "resource",
      width: 220,
      render: (_: unknown, record: AuditLogItem) => {
        const method = HTTP_METHOD_MAP[record.action] ?? record.action.toUpperCase();
        const path = `/${record.resource}${record.resourceId ? `/${record.resourceId}` : ""}`;
        return (
          <Tooltip content={`${method} ${path}`}>
            <span className="block max-w-[190px] truncate font-mono text-xs text-gray-600">
              {method} {path}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: "IP",
      dataIndex: "ip",
      width: 160,
      render: (ip: string | null, record: AuditLogItem) => {
        if (!ip) {
          return "-";
        }
        return (
          <div>
            <div className="text-xs">{ip}</div>
            {record.ipRegion ? <div className="text-xs text-gray-400">{record.ipRegion}</div> : null}
          </div>
        );
      },
    },
    {
      title: "结果",
      dataIndex: "result",
      width: 90,
      render: (value: string) => (
        <Tag color={value === "success" ? "green" : "red"}>{value === "success" ? "成功" : "失败"}</Tag>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* 1. 页面标题区 */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <h1 className="text-xl font-semibold text-gray-800">操作审计</h1>
          <span className="text-sm text-gray-400">记录所有写操作（POST/PUT/PATCH/DELETE）</span>
        </div>
      </div>

      {/* 2. 筛选区：条件网格 + 搜索/重置贴最后一行最右 */}
      <div className="grid grid-cols-4 gap-3">
        <Input
          placeholder="用户 ID"
          style={{ width: "100%" }}
          value={userIdInput}
          onChange={setUserIdInput}
          onPressEnter={handleSearch}
        />
        <Input
          placeholder="资源标识"
          style={{ width: "100%" }}
          value={resourceInput}
          onChange={setResourceInput}
          onPressEnter={handleSearch}
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

      {/* 3. 操作行：只读页面，仅保留刷新 */}
      <div className="flex items-center justify-end gap-2">
        <Tooltip content="刷新">
          <Button icon={<IconRefresh />} onClick={() => void load(page, pageSize, filters)} />
        </Tooltip>
      </div>

      {/* 4. 列表区：Spin 点指示符 + 分页默认 10 条 */}
      <div>
        <Spin loading={loading} dot block>
          <Table rowKey="id" columns={columns} data={data} pagination={false} scroll={{ x: 1240 }} />
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
