/**
 * web 端列表页样板 —— 新增列表页请以本文件为模板（规范见 docs/frontend-rules.md 第五节）。
 *
 * 运行位置：管理台「样板页」菜单（/sample-list）。本页是**设计样张**，内置示例数据，
 * 打开即可看到标准形态，不依赖任何后端接口。
 *
 * 换成真实页面时只需替换取数与删除两处（文件底部标注了 DEMO 的两个函数）：
 * 组件的加载态、分页、搜索、删除、骨架屏结构都不用动。
 * 真实取数与错误处理的完整写法见 apps/admin-web/src/pages/MdDocsPage.tsx。
 *
 * 结构固定三段（筛选区与列表区都不要卡片容器：无边框、无圆角、无内边距，直接落在页面背景上）：
 *   1. 页面标题区        h1 text-xl font-semibold
 *   2. 筛选区            左输入框（不带 label、不带 icon）+ 右侧「搜索 / 重置 / 新增」icon 按钮（右对齐）
 *   3. 列表区            表格 + 独立 Pagination
 *
 * 形态约束：
 *   - 加载中显示整页骨架屏（标题/筛选/列表三个区域各一块）
 *   - 操作列 fixed: "right" + 只有 icon 的按钮 + Tooltip 说明
 *   - 超长文本用定宽 + truncate 截断，Tooltip 悬浮显示全文
 *   - 反馈统一用 Notification（成功 title "成功" / 失败 title "失败"）
 *
 * 设计 token（颜色/圆角/字号）来自 tailwind/web.cjs，不要在页面里写死颜色或自带 theme。
 */
import { useCallback, useEffect, useState } from "react";
import {
  Button,
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
import { IconDelete, IconEdit, IconPlus, IconRefresh, IconSearch } from "@arco-design/web-react/icon";

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
const DEMO_TOTAL = 46;
const DEMO_DELAY_MS = 400;

const STATUS_TEXT: Record<SampleItem["status"], string> = { enabled: "启用", disabled: "禁用" };

function ListPageSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {/* 标题区 */}
      <Skeleton text={{ rows: 1 }} />
      {/* 筛选区 */}
      <Skeleton text={{ rows: 1 }} />
      {/* 列表区 */}
      <Skeleton text={{ rows: 8 }} />
    </div>
  );
}

// ---------------------------------------------------------------- DEMO 数据源
// 真实页面：删掉本段，改用 apps/admin-web/src/api/client 的 get / del（写法见 MdDocsPage.tsx）。
const DEMO_ITEMS: SampleItem[] = Array.from({ length: DEMO_TOTAL }, (_, index) => ({
  id: index + 1,
  name: `示例资源 ${String(index + 1).padStart(2, "0")} · 一个刻意写得很长的名称用来演示截断`,
  status: index % 3 === 0 ? "disabled" : "enabled",
  createdAt: `2026-09-${String((index % 28) + 1).padStart(2, "0")} 10:24:00`,
}));

async function fetchPage(page: number, keyword: string): Promise<SampleItemPage> {
  const filtered = keyword ? DEMO_ITEMS.filter((item) => item.name.includes(keyword)) : DEMO_ITEMS;
  const list = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  // 留一点延迟，方便观察骨架屏
  await new Promise((resolve) => setTimeout(resolve, DEMO_DELAY_MS));
  return { list, pageNum: page, pageSize: PAGE_SIZE, total: filtered.length };
}

function removeItem(id: number): void {
  const index = DEMO_ITEMS.findIndex((item) => item.id === id);
  if (index >= 0) {
    DEMO_ITEMS.splice(index, 1);
  }
}
// -----------------------------------------------------------------------------

export function SampleListPage() {
  const [data, setData] = useState<SampleItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [inputValue, setInputValue] = useState("");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (currentPage: number, search: string) => {
    setLoading(true);
    try {
      const result = await fetchPage(currentPage, search);
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

  const handleSearch = () => {
    setKeyword(inputValue);
    setPage(1);
  };

  const handleReset = () => {
    setInputValue("");
    setKeyword("");
    setPage(1);
  };

  const handleDelete = async (id: number) => {
    try {
      removeItem(id);
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

      {/* 2. 筛选区：左输入框（无 label、无 icon）+ 右侧「搜索 / 重置 / 新增」icon 按钮，右对齐。无卡片容器 */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="请输入名称"
          style={{ width: 240 }}
          value={inputValue}
          onChange={setInputValue}
          onPressEnter={handleSearch}
        />
        <div className="ml-auto flex items-center gap-2">
          <Tooltip content="搜索">
            <Button type="primary" icon={<IconSearch />} onClick={handleSearch} />
          </Tooltip>
          <Tooltip content="重置">
            <Button icon={<IconRefresh />} onClick={handleReset} />
          </Tooltip>
          <Tooltip content="新增">
            <Button icon={<IconPlus />} />
          </Tooltip>
        </div>
      </div>

      {/* 3. 列表区：无卡片容器 */}
      <div>
        <Table rowKey="id" columns={columns} data={data} pagination={false} />
        <div className="mt-4 flex justify-end">
          <Pagination total={total} current={page} pageSize={PAGE_SIZE} showTotal onChange={setPage} />
        </div>
      </div>
    </div>
  );
}
