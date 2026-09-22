/**
 * web 端列表页样板 —— 新增列表页请以本文件为模板（规范见 docs/frontend-rules.md 第五节）。
 *
 * 结构固定四段：
 *   1. 页面标题区        h1 text-xl font-semibold
 *   2. 筛选区            rounded-lg bg-white p-4 shadow-sm + Form layout="inline"
 *   3. 列表外操作区      右靠齐，只放 icon 按钮，文字用 Tooltip 悬浮显示
 *   4. 列表区            卡片包住表格 + 独立 Pagination
 *
 * 同时演示四条形态约束：
 *   - 加载中显示整页骨架屏（标题/筛选/列表三个区域各一块）
 *   - 操作列 fixed: "right" + 只有 icon 的按钮 + Tooltip 说明
 *   - 超长文本用定宽 + truncate 截断，Tooltip 悬浮显示全文
 *   - 反馈统一用 Notification（成功 title "成功" / 失败 title "失败"）
 *
 * 注意：设计 token（颜色/圆角/字号）来自 tailwind/web.cjs，不要在页面里写死颜色或自带 theme。
 */
import { useCallback, useEffect, useState } from "react";
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
  Tag,
  Tooltip,
} from "@arco-design/web-react";
import { IconDelete, IconEdit, IconPlus, IconRefresh } from "@arco-design/web-react/icon";
import { del, get } from "../api/client";

interface SampleItem {
  id: number;
  name: string;
  status: "enabled" | "disabled";
  createdAt: string;
}

interface SampleItemPage {
  list: SampleItem[];
  pageNum: number;
  pageSize: number;
  total: number;
}

const PAGE_SIZE = 20;

const STATUS_TEXT: Record<SampleItem["status"], string> = { enabled: "启用", disabled: "禁用" };

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

export function SampleListPage() {
  const [data, setData] = useState<SampleItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (currentPage: number, search: string) => {
    setLoading(true);
    try {
      const result = await get<SampleItemPage>("/samples", {
        page: currentPage,
        pageSize: PAGE_SIZE,
        keyword: search || undefined,
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
    void load(page, keyword);
  }, [page, keyword, load]);

  const handleDelete = async (id: number) => {
    try {
      await del(`/samples/${id}`);
      Notification.success({ title: "成功", content: "删除成功" });
      // 删掉本页最后一条时回退一页，避免停在空页
      if (data.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        void load(page, keyword);
      }
    } catch (error) {
      Notification.error({ title: "失败", content: error instanceof Error ? error.message : "删除失败" });
    }
  };

  const columns = [
    {
      title: "名称",
      dataIndex: "name",
      render: (text: string) => (
        <Tooltip content={text}>
          <span className="block max-w-[200px] truncate">{text}</span>
        </Tooltip>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 100,
      render: (value: SampleItem["status"]) => (
        <Tag color={value === "enabled" ? "green" : "red"}>{STATUS_TEXT[value]}</Tag>
      ),
    },
    { title: "创建时间", dataIndex: "createdAt", width: 180 },
    {
      title: "操作",
      dataIndex: "actions",
      fixed: "right" as const,
      width: 120,
      render: (_: unknown, record: SampleItem) => (
        <Space>
          <Tooltip content="编辑">
            <Button type="text" icon={<IconEdit />} />
          </Tooltip>
          <Tooltip content="删除">
            <Popconfirm title="确认删除？" onOk={() => handleDelete(record.id)}>
              <Button type="text" status="danger" icon={<IconDelete />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  if (loading) {
    return <ListPageSkeleton />;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 1. 页面标题区 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">示例资源</h1>
      </div>

      {/* 2. 筛选区 */}
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <Form layout="inline">
          <Form.Item label="名称">
            <Input.Search
              placeholder="搜索名称"
              style={{ width: 240 }}
              onSearch={(value) => {
                setKeyword(value);
                setPage(1);
              }}
            />
          </Form.Item>
        </Form>
      </div>

      {/* 3. 列表外操作区（右靠齐、只用 icon、Tooltip 显示文字） */}
      <div className="flex items-center justify-end gap-2">
        <Tooltip content="刷新">
          <Button icon={<IconRefresh />} onClick={() => void load(page, keyword)} />
        </Tooltip>
        <Tooltip content="新增">
          <Button type="primary" icon={<IconPlus />} />
        </Tooltip>
      </div>

      {/* 4. 列表区 */}
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <Table rowKey="id" columns={columns} data={data} pagination={false} />
        <div className="mt-4 flex justify-end">
          <Pagination total={total} current={page} pageSize={PAGE_SIZE} showTotal onChange={setPage} />
        </div>
      </div>
    </div>
  );
}
