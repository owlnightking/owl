/**
 * 标准列表页样板 —— 新增列表页请以本文件为模板（见 docs/frontend-rules.md 第五节）。
 *
 * 结构固定为四段：页面标题区 → 筛选区 → 列表外操作区（右靠齐、icon 按钮 + Tooltip）→ 列表区（卡片 + 表格 + 分页）。
 * 同时演示三条形状约束：加载时整页骨架屏、操作列固定右侧且只用 icon、超长文本截断 + Tooltip 显示全文。
 */
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Form,
  Input,
  Notification,
  Pagination,
  Popconfirm,
  Skeleton,
  Space,
  Table,
  Tooltip,
} from "@arco-design/web-react";
import { IconDelete, IconEdit, IconEye, IconPlus } from "@arco-design/web-react/icon";
import { del, get } from "../api/client";

interface MdDoc {
  id: string;
  authorId: string;
  content: string;
  excerpt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface MdDocPage {
  list: MdDoc[];
  pageNum: number;
  pageSize: number;
  total: number;
}

const PAGE_SIZE = 20;

function ListPageSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton text={{ rows: 1 }} />
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <Skeleton text={{ rows: 2 }} />
      </div>
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <Skeleton text={{ rows: 8 }} />
      </div>
    </div>
  );
}

const baseColumns = [
  {
    title: "摘要",
    dataIndex: "excerpt",
    render: (text: string | null) => (
      <Tooltip content={text ?? "-"}>
        <span className="block max-w-[200px] truncate">{text ?? "-"}</span>
      </Tooltip>
    ),
  },
  { title: "创建时间", dataIndex: "createdAt", width: 180, render: (v: string) => v?.slice(0, 10) },
  { title: "更新时间", dataIndex: "updatedAt", width: 180, render: (v: string) => v?.slice(0, 10) },
];

export function MdDocsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<MdDoc[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async (p: number, q?: string) => {
    setLoading(true);
    try {
      const res = await get<MdDocPage>("/md-docs", { page: p, pageSize: PAGE_SIZE, ...(q ? { q } : {}) });
      setData(res.list);
      setTotal(res.total);
    } catch {
      Notification.error({ title: "失败", content: "加载失败" });
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
      Notification.success({ title: "成功", content: "删除成功" });
      void fetchData(page, search || undefined);
    } catch {
      Notification.error({ title: "失败", content: "删除失败" });
    }
  };

  if (loading) {
    return <ListPageSkeleton />;
  }

  const columns = [
    ...baseColumns,
    {
      title: "操作",
      dataIndex: "actions",
      fixed: "right" as const,
      width: 120,
      render: (_: unknown, record: MdDoc) => (
        <Space>
          <Tooltip content="编辑">
            <Button type="text" icon={<IconEdit />} onClick={() => navigate(`/md-docs/${record.id}/edit`)} />
          </Tooltip>
          <Tooltip content="预览">
            <Button type="text" icon={<IconEye />} onClick={() => navigate(`/md-docs/${record.id}/preview`)} />
          </Tooltip>
          <Tooltip content="删除">
            <Popconfirm className="w-56" title="确认删除？" onOk={() => handleDelete(record.id)}>
              <Button type="text" status="danger" icon={<IconDelete />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">文档管理</h1>
      </div>

      <div className="rounded-lg bg-white p-4 shadow-sm">
        <Form layout="inline">
          <Form.Item label="摘要">
            <Input.Search
              placeholder="搜索文档摘要"
              style={{ width: 240 }}
              onSearch={(v) => {
                setSearch(v);
                setPage(1);
              }}
            />
          </Form.Item>
        </Form>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Tooltip content="新建文档">
          <Button type="primary" icon={<IconPlus />} onClick={() => navigate("/md-docs/new")} />
        </Tooltip>
      </div>

      <div className="rounded-lg bg-white p-4 shadow-sm">
        <Table rowKey="id" columns={columns} data={data} pagination={false} />
        <div className="mt-4 flex justify-end">
          <Pagination total={total} current={page} pageSize={PAGE_SIZE} showTotal onChange={setPage} />
        </div>
      </div>
    </div>
  );
}
