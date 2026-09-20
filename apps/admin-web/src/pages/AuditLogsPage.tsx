import { useEffect, useState } from "react";
import { Avatar, Table, Tag } from "@arco-design/web-react";
import { get } from "../api/client";

interface AuditLogUser {
  name: string;
  avatar72: string | null;
  avatar240: string | null;
}

interface AuditLogItem {
  id: string;
  userId: string | null;
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

interface PageData {
  items: AuditLogItem[];
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

export function AuditLogsPage() {
  const [data, setData] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);

  const load = async (p: number, ps: number) => {
    setLoading(true);
    try {
      const result = await get<PageData>("/audit-logs", { page: p, pageSize: ps });
      setData(result.items);
      setTotal(result.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(page, pageSize);
  }, [page, pageSize]);

  const columns = [
    {
      title: "时间",
      dataIndex: "createdAt",
      render: (v: string) => new Date(v).toLocaleString(),
      width: 180,
    },
    {
      title: "用户",
      dataIndex: "user",
      width: 160,
      render: (_: unknown, record: AuditLogItem) => {
        const user = record.user;
        if (!user) return <span className="text-gray-400">{record.unionId ?? "-"}</span>;
        return (
          <div className="flex items-center gap-2">
            <Avatar size={24} shape="circle">
              {user.avatar72 ? <img src={user.avatar72} alt={user.name} /> : user.name?.charAt(0)}
            </Avatar>
            <span>{user.name}</span>
          </div>
        );
      },
    },
    {
      title: "系统",
      dataIndex: "system",
      width: 100,
      render: (v: string | null) => {
        if (!v) return "-";
        return <Tag color="arcoblue">{SYSTEM_MAP[v] ?? v}</Tag>;
      },
    },
    {
      title: "端口",
      width: 80,
      render: (_: unknown, record: AuditLogItem) =>
        record.system === "mobile" ? <Tag color="orange">移动端</Tag> : <Tag color="blue">web端</Tag>,
    },
    {
      title: "模块",
      dataIndex: "module",
      width: 160,
      render: (v: string | null) => v ?? "-",
    },
    {
      title: "动作",
      dataIndex: "action",
      width: 80,
      render: (v: string) => {
        const label = ACTION_MAP[v] ?? v;
        const color = v === "delete" ? "red" : v === "create" ? "green" : "blue";
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: "API",
      dataIndex: "resource",
      width: 200,
      render: (_: unknown, record: AuditLogItem) => {
        const method =
          record.action === "create"
            ? "POST"
            : record.action === "update"
              ? "PUT"
              : record.action === "patch"
                ? "PATCH"
                : record.action === "delete"
                  ? "DELETE"
                  : record.action.toUpperCase();
        return (
          <span className="font-mono text-xs text-gray-600">
            {method} /{record.resource}
            {record.resourceId ? `/${record.resourceId}` : ""}
          </span>
        );
      },
    },
    {
      title: "IP",
      dataIndex: "ip",
      width: 160,
      render: (ip: string | null, record: AuditLogItem) => {
        if (!ip) return "-";
        const region = record.ipRegion;
        return (
          <div>
            <div className="text-xs">{ip}</div>
            {region && <div className="text-xs text-gray-400">{region}</div>}
          </div>
        );
      },
    },
    {
      title: "结果",
      dataIndex: "result",
      width: 80,
      render: (v: string) => <Tag color={v === "success" ? "green" : "red"}>{v === "success" ? "成功" : "失败"}</Tag>,
    },
  ];

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-800">操作审计</h2>
        <p className="mt-1 text-sm text-gray-500">记录所有写操作（POST/PUT/PATCH/DELETE）</p>
      </div>
      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        data={data}
        scroll={{ x: 1200 }}
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
  );
}
