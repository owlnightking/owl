import { useCallback, useEffect, useState } from "react";
import { Button, Modal, Notification, Table, Tag, Space, Tabs } from "@arco-design/web-react";
import { get, put } from "../api/client";
import type { ColumnProps } from "@arco-design/web-react/es/Table";

interface ExchangeOrderItem {
  id: string;
  userName: string;
  productName: string;
  productImage: string | null;
  quantity: number;
  totalCost: number;
  status: "pending" | "approved" | "rejected" | "fulfilled";
  createdAt: string;
}
interface PageData {
  items: ExchangeOrderItem[];
  total: number;
}

export function ExchangeOrdersPage() {
  const [data, setData] = useState<ExchangeOrderItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"pending" | "approved" | "rejected" | "fulfilled" | "all">("pending");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), pageSize: "20" });
      if (tab !== "all") p.set("status", tab);
      const r = await get<PageData>(`/recognition/exchange/orders?${p}`);
      setData(r.items);
      setTotal(r.total);
    } finally {
      setLoading(false);
    }
  }, [page, tab]);
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async (id: string) => {
    await put(`/recognition/exchange/orders/${id}/approve`);
    Notification.success({ content: "已通过" });
    fetchData();
  };
  const handleReject = async (id: string) => {
    Modal.confirm({
      title: "确认驳回",
      content: "驳回后将退还用户币",
      onOk: async () => {
        await put(`/recognition/exchange/orders/${id}/reject`);
        Notification.success({ content: "已驳回" });
        fetchData();
      },
    });
  };
  const handleFulfill = async (id: string) => {
    await put(`/recognition/exchange/orders/${id}/fulfill`);
    Notification.success({ content: "已核销" });
    fetchData();
  };

  const sc = { pending: "orange", approved: "green", rejected: "red", fulfilled: "blue" } as const;
  const columns: ColumnProps[] = [
    { title: "用户", dataIndex: "userName" },
    { title: "商品", dataIndex: "productName" },
    { title: "数量", dataIndex: "quantity", width: 60 },
    { title: "花费", dataIndex: "totalCost", width: 80, render: (v: number) => `${v} 币` },
    {
      title: "状态",
      dataIndex: "status",
      width: 90,
      render: (v: string) => <Tag color={sc[v as keyof typeof sc]}>{v}</Tag>,
    },
    { title: "时间", dataIndex: "createdAt", width: 170 },
    {
      title: "操作",
      width: 200,
      render: (r: ExchangeOrderItem) => (
        <Space>
          {r.status === "pending" && (
            <>
              <Button size="small" type="primary" onClick={() => handleApprove(r.id)}>
                通过
              </Button>
              <Button size="small" status="danger" onClick={() => handleReject(r.id)}>
                驳回
              </Button>
            </>
          )}
          {r.status === "approved" && (
            <Button size="small" onClick={() => handleFulfill(r.id)}>
              核销
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h3 className="mb-4 text-lg font-medium">兑换单管理</h3>
      <Tabs
        activeTab={tab}
        onChange={(v) => {
          setTab(v as typeof tab);
          setPage(1);
        }}
      >
        <Tabs.TabPane key="pending" title="待审核" />
        <Tabs.TabPane key="approved" title="已通过" />
        <Tabs.TabPane key="rejected" title="已驳回" />
        <Tabs.TabPane key="fulfilled" title="已核销" />
        <Tabs.TabPane key="all" title="全部" />
      </Tabs>
      <Table
        rowKey="id"
        loading={loading}
        data={data}
        columns={columns}
        pagination={{ total, current: page, pageSize: 20, onChange: setPage }}
      />
    </div>
  );
}
