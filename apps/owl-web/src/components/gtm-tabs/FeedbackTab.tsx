/**
 * GTM / 社群反馈页签 —— 标准列表页结构（规范见 docs/frontend-rules.md 第五节）：
 * 筛选条件网格（type 条件 + col-start-4 搜索 / 重置）→ 操作行（批量删除 / 新增）
 * → Spin dot 列表 + 独立 Pagination → 右侧抽屉（新增 / 详情，本页签无编辑入口）→ 行操作 icon + Tooltip。
 */
import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Descriptions,
  Drawer,
  Form,
  Input,
  InputNumber,
  Notification,
  Pagination,
  Popconfirm,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
} from "@arco-design/web-react";
import { IconDelete, IconEye, IconPlus, IconRefresh, IconSearch } from "@arco-design/web-react/icon";
import { del, get, post } from "../../api/client";
import { type FeedbackItem, type PageData, toDateOnly } from "../../api/pipeline";
import { FEEDBACK_TYPE_OPTIONS, notifyError } from "./common";

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
// 列宽合计（含多选列 50）：超过容器宽度就横向滚动。增删列时同步这个值
const TABLE_SCROLL_X = 960;

type DrawerMode = "create" | "edit" | "detail";

const DRAWER_TITLE: Record<DrawerMode, string> = {
  create: "记录社群反馈",
  edit: "编辑社群反馈",
  detail: "反馈详情",
};

interface FeedbackFilters {
  type: string;
}

const EMPTY_FILTERS: FeedbackFilters = { type: "" };

export function FeedbackTab() {
  const [list, setList] = useState<FeedbackItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<FeedbackFilters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<FeedbackFilters>(EMPTY_FILTERS);
  const [selectedKeys, setSelectedKeys] = useState<number[]>([]);
  const [drawerMode, setDrawerMode] = useState<DrawerMode | null>(null);
  const [drawerRecord, setDrawerRecord] = useState<FeedbackItem | null>(null);
  const [form] = Form.useForm();

  const load = useCallback(async (currentPage: number, filters: FeedbackFilters, size: number) => {
    setLoading(true);
    try {
      const result = await get<PageData<FeedbackItem>>("/gtm/feedbacks", {
        page: currentPage,
        pageSize: size,
        ...(filters.type ? { type: filters.type } : {}),
      });
      setList(result.list);
      setTotal(result.total);
    } catch (error) {
      notifyError(error, "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(page, applied, pageSize);
  }, [page, pageSize, applied, load]);

  const patchDraft = (patch: Partial<FeedbackFilters>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const handleSearch = () => {
    setApplied(draft);
    setPage(1);
  };

  const handleReset = () => {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
    setPage(1);
  };

  const openDrawer = (mode: DrawerMode, record?: FeedbackItem) => {
    setDrawerMode(mode);
    setDrawerRecord(record ?? null);
    form.resetFields();
  };

  const closeDrawer = () => {
    setDrawerMode(null);
    setDrawerRecord(null);
  };

  const submit = async () => {
    try {
      const values = await form.validate();
      await post(`/gtm/product-lines/${values.productLineId}/feedbacks`, values);
      Notification.success({ title: "成功", content: "社群反馈已记录" });
      closeDrawer();
      form.resetFields();
      void load(page, applied, pageSize);
    } catch (error) {
      if (error instanceof Error && error.message) return;
      Notification.error({ title: "失败", content: "请检查表单输入" });
    }
  };

  const handleDelete = async (record: FeedbackItem) => {
    try {
      await del(`/gtm/feedbacks/${record.id}`);
      Notification.success({ title: "成功", content: "删除成功" });
      setSelectedKeys((prev) => prev.filter((key) => key !== record.id));
      if (list.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        void load(page, applied, pageSize);
      }
    } catch (error) {
      notifyError(error, "删除失败");
    }
  };

  const handleBulkDelete = async () => {
    try {
      for (const id of selectedKeys) {
        await del(`/gtm/feedbacks/${id}`);
      }
      Notification.success({ title: "成功", content: `已删除 ${selectedKeys.length} 项` });
      setSelectedKeys([]);
      if (page > 1) {
        setPage(1);
      } else {
        void load(page, applied, pageSize);
      }
    } catch (error) {
      notifyError(error, "批量删除失败");
    }
  };

  const feedbackTypeLabel = (value: string) =>
    FEEDBACK_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? value;

  const columns = [
    { title: "产品线 ID", dataIndex: "productLineId", width: 100 },
    {
      title: "类型",
      dataIndex: "type",
      width: 110,
      render: (_: unknown, record: FeedbackItem) => <Tag>{feedbackTypeLabel(record.type)}</Tag>,
    },
    {
      title: "内容",
      dataIndex: "content",
      width: 320,
      render: (text: string) => (
        <Tooltip content={text}>
          <span className="block max-w-[300px] truncate">{text}</span>
        </Tooltip>
      ),
    },
    {
      title: "来源",
      dataIndex: "source",
      width: 130,
      render: (_: unknown, record: FeedbackItem) => record.source ?? "-",
    },
    {
      title: "收集时间",
      dataIndex: "collectedAt",
      width: 110,
      render: (_: unknown, record: FeedbackItem) => toDateOnly(record.collectedAt),
    },
    {
      title: "操作",
      dataIndex: "actions",
      fixed: "right" as const,
      width: 140,
      render: (_: unknown, record: FeedbackItem) => (
        <Space>
          <Tooltip content="详情">
            <Button type="text" icon={<IconEye />} onClick={() => openDrawer("detail", record)} />
          </Tooltip>
          <Tooltip content="删除">
            <Popconfirm className="w-56" title="确认删除？" onOk={() => void handleDelete(record)}>
              <Button type="text" status="danger" icon={<IconDelete />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-4 gap-3">
        <Select
          allowClear
          placeholder="类型"
          style={{ width: "100%" }}
          value={draft.type || undefined}
          onChange={(value: string) => patchDraft({ type: value ?? "" })}
        >
          {FEEDBACK_TYPE_OPTIONS.map((option) => (
            <Select.Option key={option.value} value={option.value}>
              {option.label}
            </Select.Option>
          ))}
        </Select>
        <div className="col-start-4 flex items-center justify-end gap-2">
          <Tooltip content="搜索">
            <Button type="primary" icon={<IconSearch />} onClick={handleSearch} />
          </Tooltip>
          <Tooltip content="重置">
            <Button icon={<IconRefresh />} onClick={handleReset} />
          </Tooltip>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="ml-auto flex items-center gap-2">
          {selectedKeys.length > 0 && (
            <Popconfirm
              className="w-56"
              title={`确认删除选中的 ${selectedKeys.length} 项？`}
              onOk={() => void handleBulkDelete()}
            >
              <Tooltip content={`批量删除（${selectedKeys.length}）`}>
                <Button status="danger" icon={<IconDelete />} />
              </Tooltip>
            </Popconfirm>
          )}
          <Tooltip content="新增">
            <Button icon={<IconPlus />} onClick={() => openDrawer("create")} />
          </Tooltip>
        </div>
      </div>

      <div>
        <Spin loading={loading} dot block>
          <Table
            rowKey="id"
            columns={columns}
            data={list}
            pagination={false}
            scroll={{ x: TABLE_SCROLL_X }}
            rowSelection={{
              fixed: true,
              selectedRowKeys: selectedKeys,
              onChange: (keys) => setSelectedKeys(keys as number[]),
            }}
            noDataElement={<span className="text-gray-400">暂无社群反馈</span>}
          />
        </Spin>
        <div className="mt-4 flex justify-end">
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

      <Drawer
        visible={drawerMode !== null}
        placement="right"
        width={480}
        title={drawerMode ? DRAWER_TITLE[drawerMode] : ""}
        unmountOnExit
        footer={drawerMode === "detail" ? null : undefined}
        onOk={() => void submit()}
        onCancel={closeDrawer}
      >
        {drawerMode === "detail" ? (
          drawerRecord && (
            <Descriptions
              column={1}
              data={[
                { label: "产品线 ID", value: drawerRecord.productLineId },
                { label: "类型", value: feedbackTypeLabel(drawerRecord.type) },
                { label: "内容", value: drawerRecord.content },
                { label: "来源", value: drawerRecord.source ?? "-" },
                { label: "收集时间", value: toDateOnly(drawerRecord.collectedAt) },
                { label: "创建时间", value: toDateOnly(drawerRecord.createdAt) },
              ]}
            />
          )
        ) : (
          <Form form={form} layout="vertical">
            <Form.Item label="产品线 ID" field="productLineId" rules={[{ required: true, message: "请输入产品线 ID" }]}>
              <InputNumber placeholder="1" min={1} className="w-full" />
            </Form.Item>
            <Form.Item label="类型" field="type" rules={[{ required: true, message: "请选择类型" }]}>
              <Select placeholder="需求期待">
                {FEEDBACK_TYPE_OPTIONS.map((option) => (
                  <Select.Option key={option.value} value={option.value}>
                    {option.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="内容" field="content" rules={[{ required: true, message: "请输入内容" }]}>
              <Input.TextArea placeholder="期待磁吸模块扩展配件" />
            </Form.Item>
            <Form.Item label="来源" field="source">
              <Input placeholder="Discord 社群" />
            </Form.Item>
          </Form>
        )}
      </Drawer>
    </div>
  );
}
