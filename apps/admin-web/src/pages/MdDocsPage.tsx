import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Table, Space, Popconfirm, Input, Notification } from "@arco-design/web-react";
import { IconPlus, IconDelete, IconEdit, IconEye } from "@arco-design/web-react/icon";
import { get, del } from "../api/client";

interface MdDoc {
  id: string;
  authorId: string;
  content: string;
  excerpt: string | null;
  createdAt: string;
  updatedAt: string;
}

const columns = [
  { title: "摘要", dataIndex: "excerpt", ellipsis: true },
  { title: "创建时间", dataIndex: "createdAt", width: 180, render: (v: string) => v?.slice(0, 10) },
  { title: "更新时间", dataIndex: "updatedAt", width: 180, render: (v: string) => v?.slice(0, 10) },
];

export function MdDocsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<MdDoc[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async (p: number, q?: string) => {
    setLoading(true);
    try {
      const res = await get<{ items: MdDoc[]; total: number }>("/md-docs", {
        page: p,
        pageSize: 20,
        ...(q ? { q } : {}),
      });
      setData(res.items);
      setTotal(res.total);
    } catch {
      Notification.error({ content: "加载失败" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(page, search || undefined);
  }, [page, fetchData, search]);

  const handleDelete = async (id: string) => {
    try {
      await del(`/md-docs/${id}`);
      Notification.success({ content: "删除成功" });
      fetchData(page, search || undefined);
    } catch {
      Notification.error({ content: "删除失败" });
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Input.Search
          placeholder="搜索文档"
          style={{ width: 300 }}
          onSearch={(v) => {
            setSearch(v);
            setPage(1);
          }}
        />
        <Button type="primary" icon={<IconPlus />} onClick={() => navigate("/md-docs/new")}>
          新建文档
        </Button>
      </div>
      <Table
        rowKey="id"
        columns={[
          ...columns,
          {
            title: "操作",
            dataIndex: "actions",
            width: 160,
            render: (_: unknown, record: MdDoc) => (
              <Space>
                <Button size="small" icon={<IconEdit />} onClick={() => navigate(`/md-docs/${record.id}/edit`)}>
                  编辑
                </Button>
                <Button size="small" icon={<IconEye />} onClick={() => navigate(`/md-docs/${record.id}/preview`)}>
                  预览
                </Button>
                <Popconfirm title="确认删除？" onOk={() => handleDelete(record.id)}>
                  <Button size="small" status="danger" icon={<IconDelete />}>
                    删除
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
        data={data}
        loading={loading}
        pagination={{
          current: page,
          total,
          pageSize: 20,
          onChange: setPage,
        }}
      />
    </div>
  );
}
