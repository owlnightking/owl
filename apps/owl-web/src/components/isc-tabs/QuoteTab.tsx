/**
 * ISC / 报价页签 —— 标准列表页结构（规范见 docs/frontend-rules.md 第五节）：
 * 接口筛选参数是 supplierId / productLineId / spuId（纯数字 ID），不建筛选区；其余结构为
 * 操作行（批量删除 / 新增）→ Spin dot 列表 + 独立 Pagination → 右侧抽屉三态（新增 / 编辑 / 详情）
 * → 行操作 icon + Tooltip。
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
  Space,
  Spin,
  Table,
  Tooltip,
} from "@arco-design/web-react";
import { IconDelete, IconEdit, IconEye, IconPlus } from "@arco-design/web-react/icon";
import { del, get, post, put } from "../../api/client";
import { type PageData, type QuoteItem, formatCnyWithUsd, toDateOnly } from "../../api/pipeline";
import { notifyError } from "./common";

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
// 列宽合计（含多选列 50）：超过容器宽度就横向滚动。增删列时同步这个值
const TABLE_SCROLL_X = 990;

type DrawerMode = "create" | "edit" | "detail";

const DRAWER_TITLE: Record<DrawerMode, string> = {
  create: "录入报价（人民币）",
  edit: "编辑报价",
  detail: "报价详情",
};

export function QuoteTab() {
  const [list, setList] = useState<QuoteItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [selectedKeys, setSelectedKeys] = useState<number[]>([]);
  const [drawerMode, setDrawerMode] = useState<DrawerMode | null>(null);
  const [drawerRecord, setDrawerRecord] = useState<QuoteItem | null>(null);
  const [form] = Form.useForm();

  const load = useCallback(async (currentPage: number, size: number) => {
    setLoading(true);
    try {
      const result = await get<PageData<QuoteItem>>("/isc/suppliers/quotes/list", {
        page: currentPage,
        pageSize: size,
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
    void load(page, pageSize);
  }, [page, pageSize, load]);

  const openDrawer = (mode: DrawerMode, record?: QuoteItem) => {
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
        await put(`/isc/suppliers/quotes/${drawerRecord.id}`, values);
        Notification.success({ title: "成功", content: "报价已更新" });
      } else {
        await post("/isc/suppliers/quotes", values);
        Notification.success({ title: "成功", content: "报价已录入（已按最新汇率折算美元）" });
      }
      closeDrawer();
      void load(page, pageSize);
    } catch (error) {
      if (error instanceof Error && error.message) return;
      Notification.error({ title: "失败", content: "请检查表单输入" });
    }
  };

  const handleDelete = async (record: QuoteItem) => {
    try {
      await del(`/isc/suppliers/quotes/${record.id}`);
      Notification.success({ title: "成功", content: "删除成功" });
      setSelectedKeys((prev) => prev.filter((key) => key !== record.id));
      if (list.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        void load(page, pageSize);
      }
    } catch (error) {
      notifyError(error, "删除失败");
    }
  };

  const handleBulkDelete = async () => {
    try {
      for (const id of selectedKeys) {
        await del(`/isc/suppliers/quotes/${id}`);
      }
      Notification.success({ title: "成功", content: `已删除 ${selectedKeys.length} 项` });
      setSelectedKeys([]);
      if (page > 1) {
        setPage(1);
      } else {
        void load(page, pageSize);
      }
    } catch (error) {
      notifyError(error, "批量删除失败");
    }
  };

  const columns = [
    {
      title: "报价项",
      dataIndex: "itemName",
      width: 200,
      render: (text: string) => (
        <Tooltip content={text}>
          <span className="block max-w-[180px] truncate">{text}</span>
        </Tooltip>
      ),
    },
    { title: "供应商", dataIndex: "supplierName", width: 140 },
    {
      title: "产品线",
      dataIndex: "productLineName",
      width: 140,
      render: (_: unknown, record: QuoteItem) => record.productLineName ?? "-",
    },
    {
      title: "金额（主美元 / 副人民币）",
      dataIndex: "amountCny",
      width: 200,
      render: (_: unknown, record: QuoteItem) => formatCnyWithUsd(record.amountCny, record.amountUsd),
    },
    {
      title: "报价时间",
      dataIndex: "quotedAt",
      width: 110,
      render: (_: unknown, record: QuoteItem) => toDateOnly(record.quotedAt),
    },
    {
      title: "操作",
      dataIndex: "actions",
      fixed: "right" as const,
      width: 150,
      render: (_: unknown, record: QuoteItem) => (
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
            noDataElement={<span className="text-gray-400">暂无报价</span>}
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
                { label: "报价项", value: drawerRecord.itemName },
                { label: "供应商", value: drawerRecord.supplierName },
                { label: "供应商 ID", value: drawerRecord.supplierId },
                { label: "产品线", value: drawerRecord.productLineName ?? "-" },
                { label: "SPU", value: drawerRecord.spuName ?? "-" },
                { label: "人民币金额", value: formatCnyWithUsd(drawerRecord.amountCny, drawerRecord.amountUsd) },
                { label: "汇率", value: drawerRecord.exchangeRate },
                { label: "报价时间", value: toDateOnly(drawerRecord.quotedAt) },
                { label: "备注", value: drawerRecord.notes ?? "-" },
                { label: "创建时间", value: toDateOnly(drawerRecord.createdAt) },
              ]}
            />
          )
        ) : (
          <Form form={form} layout="vertical">
            {drawerMode === "create" && (
              <Form.Item label="供应商 ID" field="supplierId" rules={[{ required: true, message: "请输入供应商 ID" }]}>
                <InputNumber placeholder="供应商页签查看" min={1} className="w-full" />
              </Form.Item>
            )}
            <Form.Item label="报价项" field="itemName" rules={[{ required: true, message: "请输入报价项" }]}>
              <Input placeholder="首批量 500 台" />
            </Form.Item>
            <Form.Item label="产品线 ID（可选）" field="productLineId">
              <InputNumber placeholder="1" min={1} className="w-full" />
            </Form.Item>
            <Form.Item label="SPU ID（可选）" field="spuId">
              <InputNumber placeholder="1" min={1} className="w-full" />
            </Form.Item>
            <Form.Item label="人民币金额" field="amountCny" rules={[{ required: true, message: "请输入人民币金额" }]}>
              <InputNumber placeholder="85000" min={0} className="w-full" />
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
