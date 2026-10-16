/**
 * ISC / 供应商页签 —— 标准列表页结构（规范见 docs/frontend-rules.md 第五节）：
 * 筛选条件网格（keyword / coopStatus + col-start-4 搜索 / 重置）→ 操作行（批量删除 / 新增）
 * → Spin dot 列表 + 独立 Pagination → 右侧抽屉三态（新增 / 编辑 / 详情）→ 行操作 icon + Tooltip。
 */
import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Descriptions,
  Drawer,
  Form,
  Input,
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
import { IconDelete, IconEdit, IconEye, IconPlus, IconRefresh, IconSearch } from "@arco-design/web-react/icon";
import { del, get, post, put } from "../../api/client";
import { SUPPLIER_STATUS_LABELS, type PageData, type SupplierItem } from "../../api/pipeline";
import { notifyError } from "./common";

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
// 列宽合计（含多选列 50）：超过容器宽度就横向滚动。增删列时同步这个值
const TABLE_SCROLL_X = 980;

type DrawerMode = "create" | "edit" | "detail";

const DRAWER_TITLE: Record<DrawerMode, string> = {
  create: "新增供应商",
  edit: "编辑供应商",
  detail: "供应商详情",
};

interface SupplierFilters {
  keyword: string;
  coopStatus: string;
}

const EMPTY_FILTERS: SupplierFilters = { keyword: "", coopStatus: "" };

export function SupplierTab() {
  const [list, setList] = useState<SupplierItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<SupplierFilters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<SupplierFilters>(EMPTY_FILTERS);
  const [selectedKeys, setSelectedKeys] = useState<number[]>([]);
  const [drawerMode, setDrawerMode] = useState<DrawerMode | null>(null);
  const [drawerRecord, setDrawerRecord] = useState<SupplierItem | null>(null);
  const [form] = Form.useForm();

  const load = useCallback(async (currentPage: number, filters: SupplierFilters, size: number) => {
    setLoading(true);
    try {
      const result = await get<PageData<SupplierItem>>("/isc/suppliers", {
        page: currentPage,
        pageSize: size,
        ...(filters.keyword ? { keyword: filters.keyword } : {}),
        ...(filters.coopStatus ? { coopStatus: filters.coopStatus } : {}),
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

  const patchDraft = (patch: Partial<SupplierFilters>) => {
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

  const openDrawer = (mode: DrawerMode, record?: SupplierItem) => {
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
        await put(`/isc/suppliers/${drawerRecord.id}`, values);
        Notification.success({ title: "成功", content: "供应商已更新" });
      } else {
        await post("/isc/suppliers", values);
        Notification.success({ title: "成功", content: "供应商已创建" });
      }
      closeDrawer();
      void load(page, applied, pageSize);
    } catch (error) {
      if (error instanceof Error && error.message) return;
      Notification.error({ title: "失败", content: "请检查表单输入" });
    }
  };

  const handleDelete = async (record: SupplierItem) => {
    try {
      await del(`/isc/suppliers/${record.id}`);
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
        await del(`/isc/suppliers/${id}`);
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

  const columns = [
    {
      title: "名称",
      dataIndex: "name",
      width: 180,
      render: (text: string) => (
        <Tooltip content={text}>
          <span className="block max-w-[160px] truncate">{text}</span>
        </Tooltip>
      ),
    },
    {
      title: "区域",
      dataIndex: "region",
      width: 120,
      render: (_: unknown, record: SupplierItem) => record.region ?? "-",
    },
    {
      title: "联系方式",
      dataIndex: "contact",
      width: 140,
      render: (_: unknown, record: SupplierItem) => record.contact ?? "-",
    },
    {
      title: "合作状态",
      dataIndex: "coopStatus",
      width: 100,
      render: (_: unknown, record: SupplierItem) => (
        <Tag color={record.coopStatus === "active" ? "green" : "gray"}>
          {SUPPLIER_STATUS_LABELS[record.coopStatus] ?? record.coopStatus}
        </Tag>
      ),
    },
    {
      title: "产能 / 工艺",
      dataIndex: "capability",
      width: 240,
      render: (text: string | null) =>
        text ? (
          <Tooltip content={text}>
            <span className="block max-w-[220px] truncate">{text}</span>
          </Tooltip>
        ) : (
          "-"
        ),
    },
    {
      title: "操作",
      dataIndex: "actions",
      fixed: "right" as const,
      width: 150,
      render: (_: unknown, record: SupplierItem) => (
        <Space>
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
        <Input
          placeholder="名称"
          style={{ width: "100%" }}
          value={draft.keyword}
          onChange={(value) => patchDraft({ keyword: value })}
          onPressEnter={handleSearch}
        />
        <Select
          allowClear
          placeholder="合作状态"
          style={{ width: "100%" }}
          value={draft.coopStatus || undefined}
          onChange={(value: string) => patchDraft({ coopStatus: value ?? "" })}
        >
          {Object.entries(SUPPLIER_STATUS_LABELS).map(([value, label]) => (
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
            noDataElement={<span className="text-gray-400">暂无供应商</span>}
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
                { label: "名称", value: drawerRecord.name },
                { label: "区域", value: drawerRecord.region ?? "-" },
                { label: "联系方式", value: drawerRecord.contact ?? "-" },
                {
                  label: "合作状态",
                  value: SUPPLIER_STATUS_LABELS[drawerRecord.coopStatus] ?? drawerRecord.coopStatus,
                },
                { label: "产能 / 工艺能力", value: drawerRecord.capability ?? "-" },
                { label: "备注", value: drawerRecord.notes ?? "-" },
                { label: "创建时间", value: drawerRecord.createdAt },
              ]}
            />
          )
        ) : (
          <Form form={form} layout="vertical">
            <Form.Item label="名称" field="name" rules={[{ required: true, message: "请输入名称" }]}>
              <Input placeholder="东莞精密制造" />
            </Form.Item>
            <Form.Item label="区域" field="region">
              <Input placeholder="广东东莞" />
            </Form.Item>
            <Form.Item label="联系方式" field="contact">
              <Input />
            </Form.Item>
            <Form.Item label="合作状态" field="coopStatus">
              <Select placeholder="意向">
                {Object.entries(SUPPLIER_STATUS_LABELS).map(([value, label]) => (
                  <Select.Option key={value} value={value}>
                    {label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="产能 / 工艺能力" field="capability">
              <Input.TextArea placeholder="注塑 + 铝合金，月产能 5 万" />
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
