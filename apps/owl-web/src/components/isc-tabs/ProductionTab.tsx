/**
 * ISC / 生产批次页签 —— 标准列表页结构（规范见 docs/frontend-rules.md 第五节）：
 * 筛选条件网格（type / status + col-start-4 搜索 / 重置）→ 操作行（批量删除 / 新增）
 * → Spin dot 列表 + 独立 Pagination → 右侧抽屉三态（新增 / 编辑 / 详情）→ 行操作 icon + Tooltip。
 * 状态流转（开始生产 / 完成）不属于详情 / 编辑 / 删除三件套，单独用语义 icon + Tooltip。
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
import {
  IconCheck,
  IconDelete,
  IconEdit,
  IconEye,
  IconPlayArrow,
  IconPlus,
  IconRefresh,
  IconSearch,
} from "@arco-design/web-react/icon";
import { del, get, post, put } from "../../api/client";
import {
  PRODUCTION_STATUS_LABELS,
  PRODUCTION_TYPE_LABELS,
  type PageData,
  type ProductionItem,
  toDateOnly,
} from "../../api/pipeline";
import { notifyError } from "./common";

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
// 列宽合计（含多选列 50）：超过容器宽度就横向滚动。增删列时同步这个值
const TABLE_SCROLL_X = 900;

type DrawerMode = "create" | "edit" | "detail";

const DRAWER_TITLE: Record<DrawerMode, string> = {
  create: "新增生产批次",
  edit: "编辑生产批次",
  detail: "生产批次详情",
};

interface ProductionFilters {
  type: string;
  status: string;
}

const EMPTY_FILTERS: ProductionFilters = { type: "", status: "" };

export function ProductionTab() {
  const [list, setList] = useState<ProductionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<ProductionFilters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<ProductionFilters>(EMPTY_FILTERS);
  const [selectedKeys, setSelectedKeys] = useState<number[]>([]);
  const [drawerMode, setDrawerMode] = useState<DrawerMode | null>(null);
  const [drawerRecord, setDrawerRecord] = useState<ProductionItem | null>(null);
  const [form] = Form.useForm();

  const load = useCallback(async (currentPage: number, filters: ProductionFilters, size: number) => {
    setLoading(true);
    try {
      const result = await get<PageData<ProductionItem>>("/isc/productions", {
        page: currentPage,
        pageSize: size,
        ...(filters.type ? { type: filters.type } : {}),
        ...(filters.status ? { status: filters.status } : {}),
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

  const patchDraft = (patch: Partial<ProductionFilters>) => {
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

  const openDrawer = (mode: DrawerMode, record?: ProductionItem) => {
    setDrawerMode(mode);
    setDrawerRecord(record ?? null);
    form.resetFields();
    if (record && mode === "edit") {
      form.setFieldsValue(record);
    }
  };

  const closeDrawer = () => {
    setDrawerMode(null);
    setDrawerRecord(null);
  };

  const submit = async () => {
    try {
      const values = await form.validate();
      if (drawerRecord) {
        await put(`/isc/productions/${drawerRecord.id}`, values);
        Notification.success({ title: "成功", content: "生产批次已更新" });
      } else {
        await post(`/isc/productions/spus/${values.spuId}`, values);
        Notification.success({ title: "成功", content: "生产批次已创建" });
      }
      closeDrawer();
      void load(page, applied, pageSize);
    } catch (error) {
      if (error instanceof Error && error.message) return;
      Notification.error({ title: "失败", content: "请检查表单输入" });
    }
  };

  const handleDelete = async (record: ProductionItem) => {
    try {
      await del(`/isc/productions/${record.id}`);
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
        await del(`/isc/productions/${id}`);
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

  const advanceStatus = async (record: ProductionItem, status: string) => {
    try {
      await put(`/isc/productions/${record.id}`, { status });
      void load(page, applied, pageSize);
    } catch (error) {
      notifyError(error, "状态更新失败");
    }
  };

  const columns = [
    { title: "SPU", dataIndex: "spuName", width: 150 },
    { title: "供应商", dataIndex: "supplierName", width: 140 },
    {
      title: "类型",
      dataIndex: "type",
      width: 90,
      render: (_: unknown, record: ProductionItem) => <Tag>{PRODUCTION_TYPE_LABELS[record.type] ?? record.type}</Tag>,
    },
    { title: "数量", dataIndex: "quantity", width: 90 },
    {
      title: "状态",
      dataIndex: "status",
      width: 100,
      render: (_: unknown, record: ProductionItem) => (
        <Tag color={record.status === "completed" ? "green" : record.status === "producing" ? "blue" : "gray"}>
          {PRODUCTION_STATUS_LABELS[record.status] ?? record.status}
        </Tag>
      ),
    },
    {
      title: "计划时间",
      dataIndex: "plannedAt",
      width: 110,
      render: (_: unknown, record: ProductionItem) => toDateOnly(record.plannedAt),
    },
    {
      title: "操作",
      dataIndex: "actions",
      fixed: "right" as const,
      width: 180,
      render: (_: unknown, record: ProductionItem) => (
        <Space>
          {record.status === "planned" && (
            <Tooltip content="开始生产">
              <Button type="text" icon={<IconPlayArrow />} onClick={() => void advanceStatus(record, "producing")} />
            </Tooltip>
          )}
          {record.status === "producing" && (
            <Tooltip content="完成">
              <Button type="text" icon={<IconCheck />} onClick={() => void advanceStatus(record, "completed")} />
            </Tooltip>
          )}
          <Tooltip content="详情">
            <Button type="text" icon={<IconEye />} onClick={() => openDrawer("detail", record)} />
          </Tooltip>
          <Tooltip content="编辑">
            <Button type="text" icon={<IconEdit />} onClick={() => openDrawer("edit", record)} />
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
          {Object.entries(PRODUCTION_TYPE_LABELS).map(([value, label]) => (
            <Select.Option key={value} value={value}>
              {label}
            </Select.Option>
          ))}
        </Select>
        <Select
          allowClear
          placeholder="状态"
          style={{ width: "100%" }}
          value={draft.status || undefined}
          onChange={(value: string) => patchDraft({ status: value ?? "" })}
        >
          {Object.entries(PRODUCTION_STATUS_LABELS).map(([value, label]) => (
            <Select.Option key={value} value={value}>
              {label}
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
            noDataElement={<span className="text-gray-400">暂无生产批次</span>}
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
                { label: "SPU", value: drawerRecord.spuName },
                { label: "SPU ID", value: drawerRecord.spuId },
                { label: "供应商", value: drawerRecord.supplierName },
                { label: "供应商 ID", value: drawerRecord.supplierId },
                { label: "类型", value: PRODUCTION_TYPE_LABELS[drawerRecord.type] ?? drawerRecord.type },
                { label: "数量", value: drawerRecord.quantity },
                {
                  label: "状态",
                  value: PRODUCTION_STATUS_LABELS[drawerRecord.status] ?? drawerRecord.status,
                },
                { label: "计划时间", value: toDateOnly(drawerRecord.plannedAt) },
                { label: "完成时间", value: toDateOnly(drawerRecord.completedAt) },
                { label: "备注", value: drawerRecord.notes ?? "-" },
                { label: "创建时间", value: toDateOnly(drawerRecord.createdAt) },
              ]}
            />
          )
        ) : (
          <Form form={form} layout="vertical">
            {drawerMode === "create" && (
              <>
                <Form.Item label="SPU ID" field="spuId" rules={[{ required: true, message: "请输入 SPU ID" }]}>
                  <InputNumber placeholder="产品线详情 SPU 页签查看" min={1} className="w-full" />
                </Form.Item>
                <Form.Item
                  label="供应商 ID"
                  field="supplierId"
                  rules={[{ required: true, message: "请输入供应商 ID" }]}
                >
                  <InputNumber placeholder="供应商页签查看" min={1} className="w-full" />
                </Form.Item>
              </>
            )}
            <Form.Item label="类型" field="type" rules={[{ required: true, message: "请选择类型" }]}>
              <Select placeholder="试产">
                {Object.entries(PRODUCTION_TYPE_LABELS).map(([value, label]) => (
                  <Select.Option key={value} value={value}>
                    {label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="数量" field="quantity" rules={[{ required: true, message: "请输入数量" }]}>
              <InputNumber placeholder="100" min={1} className="w-full" />
            </Form.Item>
            {drawerMode === "create" && (
              <Form.Item label="状态" field="status">
                <Select placeholder="计划中">
                  {Object.entries(PRODUCTION_STATUS_LABELS).map(([value, label]) => (
                    <Select.Option key={value} value={value}>
                      {label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            )}
            <Form.Item label="计划时间" field="plannedAt">
              <Input type="date" />
            </Form.Item>
            <Form.Item label="备注" field="notes">
              <Input.TextArea />
            </Form.Item>
          </Form>
        )}
      </Drawer>
    </div>
  );
}
