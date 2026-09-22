/**
 * 兑换单管理 —— 按 apps/admin-web/src/pages/SampleListPage.tsx 的样板改造（规范见 docs/frontend-rules.md 第五节）。
 *
 * 本页只有业务流转动作（通过 / 驳回 / 核销），没有新增、编辑、删除接口，因此操作行不放新增与批量按钮，
 * 也没有筛选条件网格：状态维度由操作行左侧的页面级胶囊 tab 承担（点一下立即生效并回到第 1 页）。
 * 结构：标题区 → 操作行（仅左侧状态 tab）→ 列表区（Spin 点指示符、独立分页、
 * 左端固定「用户」、右端固定「操作」、超长文本截断 + Tooltip）。
 */
import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Notification,
  Pagination,
  Popconfirm,
  Space,
  Spin,
  Table,
  Tag,
  Tabs,
  Tooltip,
} from "@arco-design/web-react";
import { IconCheck, IconClose, IconSend } from "@arco-design/web-react/icon";
import type { ColumnProps } from "@arco-design/web-react/es/Table";
import { get, put } from "../api/client";

type ExchangeOrderStatus = "pending" | "approved" | "rejected" | "fulfilled";

/** 页面级状态筛选：除四种业务状态外多一个「全部」 */
type StatusFilter = ExchangeOrderStatus | "all";

interface ExchangeOrderItem {
  id: number;
  userName: string;
  productName: string;
  productImage: string | null;
  quantity: number;
  totalCost: number;
  status: ExchangeOrderStatus;
  createdAt: string;
}

interface ExchangeOrderPageData {
  list: ExchangeOrderItem[];
  pageNum: number;
  pageSize: number;
  total: number;
}

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
/** 状态 tab 中「全部」的取值 */
const STATUS_ALL = "all";
/** 订单接口前缀，三个流转动作共用 */
const ORDER_PATH = "/recognition/exchange/orders";
// 列宽合计（用户 fixed left + 操作 fixed right）：超过容器宽度就横向滚动，两端列始终可见。增删列时同步这个值
const TABLE_SCROLL_X = 1060;

const STATUS_TEXT: Record<ExchangeOrderStatus, string> = {
  pending: "待审批",
  approved: "已通过",
  rejected: "已驳回",
  fulfilled: "已完成",
};
const STATUS_COLOR: Record<ExchangeOrderStatus, string> = {
  pending: "orange",
  approved: "green",
  rejected: "red",
  fulfilled: "blue",
};
/** 页面级 tab：首项固定「全部」，其余与状态字典一致 */
const STATUS_TAB_OPTIONS: { label: string; value: StatusFilter }[] = [
  { label: "全部", value: STATUS_ALL },
  { label: "待审批", value: "pending" },
  { label: "已通过", value: "approved" },
  { label: "已驳回", value: "rejected" },
  { label: "已完成", value: "fulfilled" },
];

export function ExchangeOrdersPage() {
  const [data, setData] = useState<ExchangeOrderItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [status, setStatus] = useState<StatusFilter>(STATUS_ALL);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (currentPage: number, size: number, currentStatus: StatusFilter) => {
    setLoading(true);
    try {
      const result = await get<ExchangeOrderPageData>(ORDER_PATH, {
        page: currentPage,
        pageSize: size,
        status: currentStatus === STATUS_ALL ? undefined : currentStatus,
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
    void load(page, pageSize, status);
  }, [page, pageSize, status, load]);

  // 状态 tab 像标签页一样即点即生效，不需要再点「搜索」
  const handleStatusChange = (value: string) => {
    setStatus(value as StatusFilter);
    setPage(1);
  };

  const runAction = async (id: number, action: "approve" | "reject" | "fulfill", successText: string) => {
    try {
      await put<void>(`${ORDER_PATH}/${id}/${action}`);
      Notification.success({ title: "成功", content: successText });
      void load(page, pageSize, status);
    } catch (error) {
      Notification.error({ title: "失败", content: error instanceof Error ? error.message : "操作失败" });
    }
  };

  const columns: ColumnProps<ExchangeOrderItem>[] = [
    // 左侧固定列必须排在列首（表格库的通用约束）
    {
      title: "用户",
      dataIndex: "userName",
      fixed: "left" as const,
      width: 180,
      render: (value: string) => (
        <Tooltip content={value}>
          <span className="block max-w-[140px] truncate">{value}</span>
        </Tooltip>
      ),
    },
    {
      title: "商品",
      dataIndex: "productName",
      width: 240,
      render: (value: string) => (
        <Tooltip content={value}>
          <span className="block max-w-[200px] truncate">{value}</span>
        </Tooltip>
      ),
    },
    { title: "数量", dataIndex: "quantity", width: 100 },
    {
      title: "花费",
      dataIndex: "totalCost",
      width: 120,
      render: (value: number) => `${value} 币`,
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 100,
      render: (value: ExchangeOrderStatus) => <Tag color={STATUS_COLOR[value]}>{STATUS_TEXT[value]}</Tag>,
    },
    {
      title: "时间",
      dataIndex: "createdAt",
      width: 180,
      render: (value: string) => new Date(value).toLocaleString(),
    },
    {
      title: "操作",
      dataIndex: "actions",
      fixed: "right" as const,
      width: 140,
      render: (_: unknown, record: ExchangeOrderItem) => {
        if (record.status === "pending") {
          return (
            <Space>
              <Tooltip content="通过">
                <Button
                  type="text"
                  icon={<IconCheck />}
                  onClick={() => void runAction(record.id, "approve", "已通过")}
                />
              </Tooltip>
              <Tooltip content="驳回">
                <Popconfirm
                  className="w-56"
                  title="确认驳回该兑换单（退还币）？"
                  onOk={() => runAction(record.id, "reject", "已驳回")}
                >
                  <Button type="text" status="danger" icon={<IconClose />} />
                </Popconfirm>
              </Tooltip>
            </Space>
          );
        }
        if (record.status === "approved") {
          return (
            <Tooltip content="核销">
              <Button type="text" icon={<IconSend />} onClick={() => void runAction(record.id, "fulfill", "已核销")} />
            </Tooltip>
          );
        }
        return <span className="text-gray-400">-</span>;
      },
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* 1. 页面标题区 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">兑换单管理</h1>
      </div>

      {/* 2. 操作行：左侧状态切换（页面级小 tab，点一下立即生效）。
          本页没有增删改接口，也没有批量与新增按钮；状态筛选由 tab 承担，不再另设条件网格 */}
      <div className="flex items-center gap-2">
        <Tabs type="capsule" size="small" className="w-fit shrink-0" activeTab={status} onChange={handleStatusChange}>
          {STATUS_TAB_OPTIONS.map((option) => (
            <Tabs.TabPane key={option.value} title={option.label} />
          ))}
        </Tabs>
      </div>

      {/* 3. 列表区：无卡片容器；Spin 必须带 block，否则 Arco 的 .arco-spin 会按内容宽度收缩，宽表格的横向滚动失效 */}
      <div>
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
