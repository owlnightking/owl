/**
 * GTM / 预售批次页签 —— 标准列表页结构（规范见 docs/frontend-rules.md 第五节）：
 * 接口筛选参数只有 productLineId / spuId（纯数字 ID），不建筛选区；其余结构为
 * 操作行（批量删除 / 新增）→ Spin dot 列表 + 独立 Pagination → 右侧抽屉（新增 / 详情，无编辑入口）
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
  Switch,
  Table,
  Tag,
  Tooltip,
} from "@arco-design/web-react";
import { IconDelete, IconEye, IconPlus } from "@arco-design/web-react/icon";
import { del, get, post } from "../../api/client";
import { type PageData, type PresaleItem, formatUsd, toDateOnly } from "../../api/pipeline";
import { notifyError } from "./common";

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
// 列宽合计（含多选列 50）：超过容器宽度就横向滚动。增删列时同步这个值
const TABLE_SCROLL_X = 900;

type DrawerMode = "create" | "edit" | "detail";

const DRAWER_TITLE: Record<DrawerMode, string> = {
  create: "新增预售批次",
  edit: "编辑预售批次",
  detail: "预售批次详情",
};

export function PresaleTab() {
  const [list, setList] = useState<PresaleItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [selectedKeys, setSelectedKeys] = useState<number[]>([]);
  const [drawerMode, setDrawerMode] = useState<DrawerMode | null>(null);
  const [drawerRecord, setDrawerRecord] = useState<PresaleItem | null>(null);
  const [form] = Form.useForm();

  const load = useCallback(async (currentPage: number, size: number) => {
    setLoading(true);
    try {
      const result = await get<PageData<PresaleItem>>("/gtm/presales", { page: currentPage, pageSize: size });
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

  const openDrawer = (mode: DrawerMode, record?: PresaleItem) => {
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
      await post(`/gtm/presales/spus/${values.spuId}`, values);
      Notification.success({ title: "成功", content: "预售批次已创建" });
      closeDrawer();
      form.resetFields();
      void load(page, pageSize);
    } catch (error) {
      if (error instanceof Error && error.message) return;
      Notification.error({ title: "失败", content: "请检查表单输入" });
    }
  };

  const handleDelete = async (record: PresaleItem) => {
    try {
      await del(`/gtm/presales/${record.id}`);
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
        await del(`/gtm/presales/${id}`);
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
      title: "批次名称",
      dataIndex: "name",
      width: 180,
      render: (text: string) => (
        <Tooltip content={text}>
          <span className="block max-w-[160px] truncate">{text}</span>
        </Tooltip>
      ),
    },
    { title: "SPU", dataIndex: "spuName", width: 160 },
    {
      title: "限量",
      dataIndex: "limited",
      width: 80,
      render: (_: unknown, record: PresaleItem) => (record.limited ? <Tag color="orange">限量</Tag> : "-"),
    },
    { title: "数量", dataIndex: "quantity", width: 90 },
    {
      title: "预售价",
      dataIndex: "priceUsd",
      width: 110,
      render: (_: unknown, record: PresaleItem) => formatUsd(record.priceUsd),
    },
    {
      title: "开始",
      dataIndex: "startAt",
      width: 110,
      render: (_: unknown, record: PresaleItem) => toDateOnly(record.startAt),
    },
    {
      title: "操作",
      dataIndex: "actions",
      fixed: "right" as const,
      width: 120,
      render: (_: unknown, record: PresaleItem) => (
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
            noDataElement={<span className="text-gray-400">暂无预售批次</span>}
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
                { label: "批次名称", value: drawerRecord.name },
                { label: "SPU", value: drawerRecord.spuName },
                { label: "SPU ID", value: drawerRecord.spuId },
                { label: "产品线 ID", value: drawerRecord.productLineId },
                { label: "限量", value: drawerRecord.limited ? "限量" : "不限量" },
                { label: "预售数量", value: drawerRecord.quantity },
                { label: "预售价（USD）", value: formatUsd(drawerRecord.priceUsd) },
                { label: "开始时间", value: toDateOnly(drawerRecord.startAt) },
                { label: "结束时间", value: toDateOnly(drawerRecord.endAt) },
                { label: "备注", value: drawerRecord.notes ?? "-" },
                { label: "创建时间", value: toDateOnly(drawerRecord.createdAt) },
              ]}
            />
          )
        ) : (
          <Form form={form} layout="vertical">
            <Form.Item label="SPU ID" field="spuId" rules={[{ required: true, message: "请输入 SPU ID" }]}>
              <InputNumber placeholder="在产品线详情 SPU 页签查看" min={1} className="w-full" />
            </Form.Item>
            <Form.Item label="批次名称" field="name" rules={[{ required: true, message: "请输入批次名称" }]}>
              <Input placeholder="首发限量 500" />
            </Form.Item>
            <Form.Item label="限量" field="limited" triggerPropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item label="预售数量" field="quantity" rules={[{ required: true, message: "请输入数量" }]}>
              <InputNumber placeholder="500" min={1} className="w-full" />
            </Form.Item>
            <Form.Item label="预售价（USD）" field="priceUsd" rules={[{ required: true, message: "请输入预售价" }]}>
              <InputNumber placeholder="49.99" min={0} className="w-full" />
            </Form.Item>
            <Form.Item label="开始时间" field="startAt">
              <Input type="date" />
            </Form.Item>
            <Form.Item label="结束时间" field="endAt">
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
