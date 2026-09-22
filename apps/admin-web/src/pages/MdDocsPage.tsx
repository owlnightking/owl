/**
 * 文档列表 —— 按 apps/admin-web/src/pages/SampleListPage.tsx 的样板改造（规范见 docs/frontend-rules.md 第五节）。
 *
 * 结构：标题区 → 筛选区（摘要条件 + 搜索/重置贴最后一行最右）→ 操作行（右侧最右是「新增」）→
 * 列表区（Spin 点指示符加载、首列固定左端、操作列固定右端、超长摘要截断、独立分页默认 10 条）。
 * 新增 / 编辑 / 预览都是独立整页路由（Vditor 编辑器与预览不适合放进抽屉），行操作按路由跳转。
 */
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Input,
  Notification,
  Pagination,
  Popconfirm,
  Space,
  Spin,
  Table,
  Tooltip,
} from "@arco-design/web-react";
import { IconDelete, IconEdit, IconEye, IconPlus, IconRefresh, IconSearch } from "@arco-design/web-react/icon";
import { del, get } from "../api/client";

interface MdDoc {
  id: number;
  authorId: number;
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

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
// 列宽合计（280 + 180 + 180 + 140）：超过容器宽度就横向滚动，配合 fixed 列实现左右两端悬浮。增删列时同步这个值
const TABLE_SCROLL_X = 780;

export function MdDocsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<MdDoc[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [keyword, setKeyword] = useState("");

  const load = useCallback(async (currentPage: number, size: number, search: string) => {
    setLoading(true);
    try {
      const result = await get<MdDocPage>("/md-docs", {
        page: currentPage,
        pageSize: size,
        q: search || undefined,
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
    void load(page, pageSize, keyword);
  }, [page, pageSize, keyword, load]);

  const handleSearch = () => {
    setKeyword(inputValue);
    setPage(1);
  };

  const handleReset = () => {
    setInputValue("");
    setKeyword("");
    setPage(1);
  };

  const removeOne = async (id: number) => {
    try {
      await del<void>(`/md-docs/${id}`);
      Notification.success({ title: "成功", content: "删除成功" });
      // 删掉本页最后一条时回退一页，避免停在空页
      if (data.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        void load(page, pageSize, keyword);
      }
    } catch (error) {
      Notification.error({ title: "失败", content: error instanceof Error ? error.message : "删除失败" });
    }
  };

  const columns = [
    // 左侧固定列必须排在列首
    {
      title: "摘要",
      dataIndex: "excerpt",
      fixed: "left" as const,
      width: 280,
      render: (text: string | null) => (
        <Tooltip content={text ?? "-"}>
          <span className="block max-w-[240px] truncate">{text ?? "-"}</span>
        </Tooltip>
      ),
    },
    { title: "创建时间", dataIndex: "createdAt", width: 180, render: (value: string) => value.slice(0, 10) },
    { title: "更新时间", dataIndex: "updatedAt", width: 180, render: (value: string) => value.slice(0, 10) },
    {
      title: "操作",
      dataIndex: "actions",
      fixed: "right" as const,
      width: 140,
      render: (_: unknown, record: MdDoc) => (
        <Space>
          <Tooltip content="详情">
            <Button type="text" icon={<IconEye />} onClick={() => navigate(`/md-docs/${record.id}/preview`)} />
          </Tooltip>
          <Tooltip content="编辑">
            <Button type="text" icon={<IconEdit />} onClick={() => navigate(`/md-docs/${record.id}/edit`)} />
          </Tooltip>
          <Tooltip content="删除">
            <Popconfirm className="w-56" title="确认删除该文档？" onOk={() => removeOne(record.id)}>
              <Button type="text" status="danger" icon={<IconDelete />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* 1. 页面标题区 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">文档管理</h1>
      </div>

      {/* 2. 筛选区：条件网格 + 搜索/重置贴最后一行最右 */}
      <div className="grid grid-cols-4 gap-3">
        <Input
          placeholder="摘要"
          style={{ width: "100%" }}
          value={inputValue}
          onChange={setInputValue}
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

      {/* 3. 操作行：右侧最右是「新增」（新增是独立整页路由，不走抽屉） */}
      <div className="flex items-center justify-end gap-2">
        <Tooltip content="新增">
          <Button icon={<IconPlus />} onClick={() => navigate("/md-docs/new")} />
        </Tooltip>
      </div>

      {/* 4. 列表区：Spin 点指示符 + 表格（左右两端固定列）+ 右对齐分页 */}
      <div>
        {/* Spin 必须带 block：Arco 的 .arco-spin 是 display:inline-block，会按内容宽度收缩，
            宽表格会被撑出页面、内部横向滚动失效 */}
        <Spin loading={loading} dot block>
          <Table rowKey="id" columns={columns} data={data} pagination={false} scroll={{ x: TABLE_SCROLL_X }} />
        </Spin>
        <div className="mt-4 flex justify-end">
          {/* 分页：展示总数、可切页、可切换每页条数（切换后回到第 1 页） */}
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
