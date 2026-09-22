/**
 * 认可管理 —— 按 apps/admin-web/src/pages/SampleListPage.tsx 的样板改造（规范见 docs/frontend-rules.md 第五节）。
 *
 * 本页只有业务流转动作（通过 / 驳回 / 置顶），没有新增、编辑、删除接口，因此操作行不放新增与批量按钮，
 * 也没有筛选条件网格：状态维度由操作行左侧的页面级胶囊 tab 承担（点一下立即生效并回到第 1 页）。
 * 结构：标题区 → 操作行（左侧状态 tab + 右侧刷新）→ 列表区（Spin 点指示符、独立分页、
 * 左端固定「发起人」、右端固定「操作」、超长文本截断 + Tooltip）。
 */
import { useCallback, useEffect, useState } from "react";
import {
  Avatar,
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
import { IconCheck, IconClose, IconPushpin, IconRefresh } from "@arco-design/web-react/icon";
import type { ColumnProps } from "@arco-design/web-react/es/Table";
import { get, put } from "../api/client";

type RecognitionStatus = "pending" | "approved" | "rejected";

/** 页面级状态筛选：除三种业务状态外多一个「全部」 */
type StatusFilter = RecognitionStatus | "all";

interface RecognitionItem {
  id: number;
  senderName: string;
  senderAvatar: string | null;
  receiverName: string;
  badgeName: string | null;
  message: string;
  status: RecognitionStatus;
  pinned: boolean;
  likeCount: number;
  createdAt: string;
}

interface RecognitionPageData {
  list: RecognitionItem[];
  pageNum: number;
  pageSize: number;
  total: number;
}

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
/** 状态 tab 中「全部」的取值 */
const STATUS_ALL = "all";
// 列宽合计（发起人 fixed left + 操作 fixed right）：超过容器宽度就横向滚动，两端列始终可见。增删列时同步这个值
const TABLE_SCROLL_X = 1360;

const STATUS_TEXT: Record<RecognitionStatus, string> = { pending: "待审批", approved: "已通过", rejected: "已驳回" };
const STATUS_COLOR: Record<RecognitionStatus, string> = { pending: "orange", approved: "green", rejected: "red" };
/** 页面级 tab：首项固定「全部」，其余与状态字典一致 */
const STATUS_TAB_OPTIONS: { label: string; value: StatusFilter }[] = [
  { label: "全部", value: STATUS_ALL },
  { label: "待审批", value: "pending" },
  { label: "已通过", value: "approved" },
  { label: "已驳回", value: "rejected" },
];

export function RecognitionsPage() {
  const [data, setData] = useState<RecognitionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [status, setStatus] = useState<StatusFilter>(STATUS_ALL);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (currentPage: number, size: number, currentStatus: StatusFilter) => {
    setLoading(true);
    try {
      const result = await get<RecognitionPageData>("/recognition", {
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

  const runAction = async (id: number, action: "approve" | "reject" | "pin", successText: string) => {
    try {
      await put<void>(`/recognition/${id}/${action}`);
      Notification.success({ title: "成功", content: successText });
      void load(page, pageSize, status);
    } catch (error) {
      Notification.error({ title: "失败", content: error instanceof Error ? error.message : "操作失败" });
    }
  };

  const columns: ColumnProps<RecognitionItem>[] = [
    // 左侧固定列必须排在列首（表格库的通用约束）
    {
      title: "发起人",
      dataIndex: "senderName",
      fixed: "left" as const,
      width: 180,
      render: (_: unknown, record: RecognitionItem) => (
        <div className="flex items-center gap-2">
          <Avatar size={24} shape="circle">
            {record.senderAvatar ? (
              <img src={record.senderAvatar} alt={record.senderName} />
            ) : (
              record.senderName.charAt(0)
            )}
          </Avatar>
          <span className="block max-w-[100px] truncate">{record.senderName}</span>
        </div>
      ),
    },
    { title: "接收人", dataIndex: "receiverName", width: 160 },
    {
      title: "徽章",
      dataIndex: "badgeName",
      width: 140,
      render: (value: string | null) =>
        value ? (
          <Tooltip content={value}>
            <span className="block max-w-[110px] truncate">{value}</span>
          </Tooltip>
        ) : (
          "-"
        ),
    },
    {
      title: "留言",
      dataIndex: "message",
      width: 280,
      render: (value: string) => (
        <Tooltip content={value}>
          <span className="block max-w-[240px] truncate">{value}</span>
        </Tooltip>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 100,
      render: (value: RecognitionStatus) => <Tag color={STATUS_COLOR[value]}>{STATUS_TEXT[value]}</Tag>,
    },
    {
      title: "置顶",
      dataIndex: "pinned",
      width: 90,
      render: (value: boolean) => (value ? <Tag color="arcoblue">已置顶</Tag> : "-"),
    },
    { title: "点赞", dataIndex: "likeCount", width: 90 },
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
      render: (_: unknown, record: RecognitionItem) => {
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
                  title="确认驳回该认可（不产币）？"
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
            <Tooltip content={record.pinned ? "取消置顶" : "置顶"}>
              <Button
                type="text"
                icon={<IconPushpin />}
                onClick={() => void runAction(record.id, "pin", record.pinned ? "已取消置顶" : "已置顶")}
              />
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
        <h1 className="text-xl font-semibold text-gray-800">认可管理</h1>
      </div>

      {/* 2. 操作行：左侧状态切换（页面级小 tab，点一下立即生效），右侧刷新。
          本页没有增删改接口，也没有批量与新增按钮；状态筛选由 tab 承担，不再另设条件网格 */}
      <div className="flex items-center gap-2">
        <Tabs type="capsule" size="small" className="w-fit shrink-0" activeTab={status} onChange={handleStatusChange}>
          {STATUS_TAB_OPTIONS.map((option) => (
            <Tabs.TabPane key={option.value} title={option.label} />
          ))}
        </Tabs>
        <div className="ml-auto flex items-center gap-2">
          <Tooltip content="刷新">
            <Button icon={<IconRefresh />} onClick={() => void load(page, pageSize, status)} />
          </Tooltip>
        </div>
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
