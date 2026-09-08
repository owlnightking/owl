import { useCallback, useEffect, useState } from "react";
import { Button, Modal, Notification, Table, Tag, Space, Tabs } from "@arco-design/web-react";
import { get, put } from "../api/client";
import type { ColumnProps } from "@arco-design/web-react/es/Table";

interface RecognitionItem {
  id: string;
  senderName: string;
  senderAvatar: string | null;
  receiverName: string;
  badgeName: string | null;
  message: string;
  status: "pending" | "approved" | "rejected";
  pinned: boolean;
  likeCount: number;
  createdAt: string;
}
interface PageData {
  items: RecognitionItem[];
  total: number;
}

export function RecognitionsPage() {
  const [data, setData] = useState<RecognitionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"pending" | "approved" | "rejected" | "all">("pending");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), pageSize: "20" });
      if (tab !== "all") p.set("status", tab);
      const r = await get<PageData>(`/recognition?${p}`);
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
    await put(`/recognition/${id}/approve`);
    Notification.success({ content: "已通过" });
    fetchData();
  };
  const handleReject = async (id: string) => {
    Modal.confirm({
      title: "确认驳回",
      content: "驳回后不会产币",
      onOk: async () => {
        await put(`/recognition/${id}/reject`);
        Notification.success({ content: "已驳回" });
        fetchData();
      },
    });
  };
  const handlePin = async (id: string) => {
    await put(`/recognition/${id}/pin`);
    fetchData();
  };

  const sc = { pending: "orange", approved: "green", rejected: "red" } as const;
  const columns: ColumnProps[] = [
    { title: "发起人", dataIndex: "senderName" },
    { title: "接收人", dataIndex: "receiverName" },
    { title: "徽章", dataIndex: "badgeName", render: (v: string | null) => v || "-" },
    { title: "留言", dataIndex: "message", ellipsis: true },
    {
      title: "状态",
      dataIndex: "status",
      width: 90,
      render: (v: string) => <Tag color={sc[v as keyof typeof sc]}>{v}</Tag>,
    },
    { title: "置顶", dataIndex: "pinned", width: 60, render: (v: boolean) => (v ? <Tag color="blue">置顶</Tag> : "-") },
    { title: "点赞", dataIndex: "likeCount", width: 60 },
    { title: "时间", dataIndex: "createdAt", width: 170 },
    {
      title: "操作",
      width: 200,
      render: (r: RecognitionItem) => (
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
            <Button size="small" onClick={() => handlePin(r.id)}>
              {r.pinned ? "取消置顶" : "置顶"}
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h3 className="mb-4 text-lg font-medium">认可管理</h3>
      <Tabs
        activeTab={tab}
        onChange={(v) => {
          setTab(v as typeof tab);
          setPage(1);
        }}
      >
        <Tabs.TabPane key="pending" title="待审批" />
        <Tabs.TabPane key="approved" title="已通过" />
        <Tabs.TabPane key="rejected" title="已驳回" />
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
