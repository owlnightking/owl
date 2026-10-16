/**
 * ISC / 头程物流页签 —— 标准列表页结构（规范见 docs/frontend-rules.md 第五节）：
 * 筛选条件网格（mode / status / warehouse + col-start-4 搜索 / 重置）→ 操作行（批量删除 / 新增）
 * → Spin dot 列表 + 独立 Pagination → 右侧抽屉三态（新增 / 编辑 / 详情）→ 行操作 icon + Tooltip。
 * 状态流转（推进状态）不属于详情 / 编辑 / 删除三件套，单独用语义 icon + Tooltip。
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
  IconDelete,
  IconEdit,
  IconEye,
  IconPlus,
  IconRefresh,
  IconRight,
  IconSearch,
} from "@arco-design/web-react/icon";
import { del, get, post, put } from "../../api/client";
import {
  SHIPMENT_MODE_LABELS,
  SHIPMENT_STATUS_LABELS,
  WAREHOUSE_LABELS,
  type PageData,
  type ShipmentItem,
  formatCnyWithUsd,
  toDateOnly,
} from "../../api/pipeline";
import { notifyError } from "./common";

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
// 列宽合计（含多选列 50）：超过容器宽度就横向滚动。增删列时同步这个值
const TABLE_SCROLL_X = 1130;

type DrawerMode = "create" | "edit" | "detail";

const DRAWER_TITLE: Record<DrawerMode, string> = {
  create: "新增物流单",
  edit: "编辑物流单",
  detail: "头程物流详情",
};

interface ShipmentFilters {
  mode: string;
  status: string;
  warehouse: string;
}

const EMPTY_FILTERS: ShipmentFilters = { mode: "", status: "", warehouse: "" };

const NEXT_SHIPMENT_STATUS: Record<string, string> = {
  pending: "head_haul",
  head_haul: "in_transit",
  in_transit: "customs",
  customs: "warehouse",
  warehouse: "received",
};

export function ShipmentTab() {
  const [list, setList] = useState<ShipmentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<ShipmentFilters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<ShipmentFilters>(EMPTY_FILTERS);
  const [selectedKeys, setSelectedKeys] = useState<number[]>([]);
  const [drawerMode, setDrawerMode] = useState<DrawerMode | null>(null);
  const [drawerRecord, setDrawerRecord] = useState<ShipmentItem | null>(null);
  const [form] = Form.useForm();

  const load = useCallback(async (currentPage: number, filters: ShipmentFilters, size: number) => {
    setLoading(true);
    try {
      const result = await get<PageData<ShipmentItem>>("/isc/shipments", {
        page: currentPage,
        pageSize: size,
        ...(filters.mode ? { mode: filters.mode } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.warehouse ? { warehouse: filters.warehouse } : {}),
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

  const patchDraft = (patch: Partial<ShipmentFilters>) => {
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

  const openDrawer = (mode: DrawerMode, record?: ShipmentItem) => {
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
        await put(`/isc/shipments/${drawerRecord.id}`, values);
        Notification.success({ title: "成功", content: "物流单已更新" });
      } else {
        await post("/isc/shipments", values);
        Notification.success({ title: "成功", content: "物流单已创建（人民币成本已折算美元）" });
      }
      closeDrawer();
      void load(page, applied, pageSize);
    } catch (error) {
      if (error instanceof Error && error.message) return;
      Notification.error({ title: "失败", content: "请检查表单输入" });
    }
  };

  const handleDelete = async (record: ShipmentItem) => {
    try {
      await del(`/isc/shipments/${record.id}`);
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
        await del(`/isc/shipments/${id}`);
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

  const advanceStatus = async (record: ShipmentItem, status: string) => {
    try {
      await put(`/isc/shipments/${record.id}`, { status });
      void load(page, applied, pageSize);
    } catch (error) {
      notifyError(error, "状态更新失败");
    }
  };

  const columns = [
    { title: "产品线", dataIndex: "productLineName", width: 150 },
    {
      title: "运输方式",
      dataIndex: "mode",
      width: 90,
      render: (_: unknown, record: ShipmentItem) => <Tag>{SHIPMENT_MODE_LABELS[record.mode] ?? record.mode}</Tag>,
    },
    {
      title: "海外仓",
      dataIndex: "warehouse",
      width: 130,
      render: (_: unknown, record: ShipmentItem) => WAREHOUSE_LABELS[record.warehouse] ?? record.warehouse,
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 100,
      render: (_: unknown, record: ShipmentItem) => (
        <Tag color={record.status === "received" ? "green" : "blue"}>
          {SHIPMENT_STATUS_LABELS[record.status] ?? record.status}
        </Tag>
      ),
    },
    {
      title: "成本（主美元 / 副人民币）",
      dataIndex: "costCny",
      width: 200,
      render: (_: unknown, record: ShipmentItem) => formatCnyWithUsd(record.costCny, record.costUsd),
    },
    {
      title: "运单 / 柜号",
      dataIndex: "trackingRef",
      width: 130,
      render: (_: unknown, record: ShipmentItem) => record.trackingRef ?? "-",
    },
    {
      title: "预计到达",
      dataIndex: "etaDate",
      width: 110,
      render: (_: unknown, record: ShipmentItem) => toDateOnly(record.etaDate),
    },
    {
      title: "操作",
      dataIndex: "actions",
      fixed: "right" as const,
      width: 170,
      render: (_: unknown, record: ShipmentItem) => {
        const next = NEXT_SHIPMENT_STATUS[record.status];
        return (
          <Space>
            {next && (
              <Tooltip content="推进状态">
                <Button type="text" icon={<IconRight />} onClick={() => void advanceStatus(record, next)} />
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
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-4 gap-3">
        <Select
          allowClear
          placeholder="运输方式"
          style={{ width: "100%" }}
          value={draft.mode || undefined}
          onChange={(value: string) => patchDraft({ mode: value ?? "" })}
        >
          {Object.entries(SHIPMENT_MODE_LABELS).map(([value, label]) => (
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
          {Object.entries(SHIPMENT_STATUS_LABELS).map(([value, label]) => (
            <Select.Option key={value} value={value}>
              {label}
            </Select.Option>
          ))}
        </Select>
        <Select
          allowClear
          placeholder="海外仓"
          style={{ width: "100%" }}
          value={draft.warehouse || undefined}
          onChange={(value: string) => patchDraft({ warehouse: value ?? "" })}
        >
          {Object.entries(WAREHOUSE_LABELS).map(([value, label]) => (
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
            noDataElement={<span className="text-gray-400">暂无头程物流单</span>}
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
                { label: "产品线", value: drawerRecord.productLineName },
                { label: "SPU", value: drawerRecord.spuName ?? "-" },
                { label: "供应商", value: drawerRecord.supplierName ?? "-" },
                { label: "运输方式", value: SHIPMENT_MODE_LABELS[drawerRecord.mode] ?? drawerRecord.mode },
                { label: "海外仓", value: WAREHOUSE_LABELS[drawerRecord.warehouse] ?? drawerRecord.warehouse },
                {
                  label: "状态",
                  value: SHIPMENT_STATUS_LABELS[drawerRecord.status] ?? drawerRecord.status,
                },
                { label: "运单 / 柜号", value: drawerRecord.trackingRef ?? "-" },
                { label: "成本", value: formatCnyWithUsd(drawerRecord.costCny, drawerRecord.costUsd) },
                { label: "预计到达", value: toDateOnly(drawerRecord.etaDate) },
                { label: "实际收货", value: toDateOnly(drawerRecord.receivedAt) },
                { label: "备注", value: drawerRecord.notes ?? "-" },
                { label: "创建时间", value: toDateOnly(drawerRecord.createdAt) },
              ]}
            />
          )
        ) : (
          <Form form={form} layout="vertical">
            {drawerMode === "create" && (
              <>
                <Form.Item
                  label="产品线 ID"
                  field="productLineId"
                  rules={[{ required: true, message: "请输入产品线 ID" }]}
                >
                  <InputNumber placeholder="1" min={1} className="w-full" />
                </Form.Item>
                <Form.Item label="SPU ID（可选）" field="spuId">
                  <InputNumber placeholder="1" min={1} className="w-full" />
                </Form.Item>
                <Form.Item label="供应商 ID（可选）" field="supplierId">
                  <InputNumber placeholder="1" min={1} className="w-full" />
                </Form.Item>
              </>
            )}
            <Form.Item label="运输方式" field="mode" rules={[{ required: true, message: "请选择运输方式" }]}>
              <Select placeholder="海运">
                {Object.entries(SHIPMENT_MODE_LABELS).map(([value, label]) => (
                  <Select.Option key={value} value={value}>
                    {label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="海外仓" field="warehouse" rules={[{ required: true, message: "请选择海外仓" }]}>
              <Select placeholder="TikTok 美国仓">
                {Object.entries(WAREHOUSE_LABELS).map(([value, label]) => (
                  <Select.Option key={value} value={value}>
                    {label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            {drawerMode === "create" && (
              <Form.Item label="状态" field="status">
                <Select placeholder="待发运">
                  {Object.entries(SHIPMENT_STATUS_LABELS).map(([value, label]) => (
                    <Select.Option key={value} value={value}>
                      {label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            )}
            <Form.Item label="运单 / 柜号" field="trackingRef">
              <Input />
            </Form.Item>
            <Form.Item label="头程成本（人民币）" field="costCny">
              <InputNumber placeholder="36000" min={0} className="w-full" />
            </Form.Item>
            <Form.Item label="预计到达" field="etaDate">
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
