import { useEffect, useState } from "react";
import { Table, Tag } from "@arco-design/web-react";
import { get } from "../api/client";

interface AuditLogItem {
  id: string;
  userId: string | null;
  unionId: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  detail: Record<string, unknown> | null;
  ip: string | null;
  result: string;
  createdAt: string;
}

interface PageData {
  items: AuditLogItem[];
  total: number;
}

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
    { title: "用户", dataIndex: "unionId", render: (v: string | null) => v ?? "-" },
    { title: "动作", dataIndex: "action" },
    { title: "资源", dataIndex: "resource" },
    { title: "资源ID", dataIndex: "resourceId", render: (v: string | null) => v ?? "-" },
    { title: "IP", dataIndex: "ip", render: (v: string | null) => v ?? "-" },
    {
      title: "结果",
      dataIndex: "result",
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
