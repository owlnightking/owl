/**
 * 经营复盘（ROI）页签 —— 列表按样板结构（docs/frontend-rules.md 第五节）。
 * 接口为 ipd-stage 明细列表（无 page / pageSize / 筛选参数），按规范省略筛选区与分页，保留操作行 + Spin + icon 行操作。
 */
import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  Notification,
  Popconfirm,
  Select,
  Spin,
  Table,
  Tag,
  Tooltip,
} from "@arco-design/web-react";
import { IconDelete, IconPlus } from "@arco-design/web-react/icon";
import { del, get, post } from "../../api/client";
import { ROI_DECISION_LABELS, ROI_PHASE_LABELS, type PageData, type RoiReviewItem } from "../../api/pipeline";
import { notifyError } from "./notify";

type DrawerMode = "create";

const DRAWER_TITLE: Record<DrawerMode, string> = { create: "录入复盘（金额均为美元）" };

// 列宽合计（含多选列 50）：增删列时同步该值
const TABLE_SCROLL_X = 630;

export function ReviewTab({ productLineId }: { productLineId: number }) {
  const [list, setList] = useState<RoiReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKeys, setSelectedKeys] = useState<number[]>([]);
  const [drawerMode, setDrawerMode] = useState<DrawerMode | null>(null);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await get<RoiReviewItem[]>(`/ipd/product-lines/${productLineId}/reviews`);
      setList(Array.isArray(result) ? result : ((result as PageData<RoiReviewItem>).list ?? []));
    } catch (error) {
      notifyError(error, "加载失败");
    } finally {
      setLoading(false);
    }
  }, [productLineId]);

  useEffect(() => {
    void load();
  }, [load]);

  const openDrawer = (mode: DrawerMode) => {
    setDrawerMode(mode);
    form.resetFields();
  };

  const closeDrawer = () => {
    setDrawerMode(null);
  };

  const submit = async () => {
    try {
      const values = await form.validate();
      await post(`/ipd/product-lines/${productLineId}/reviews`, values);
      Notification.success({ title: "成功", content: "复盘记录已添加" });
      closeDrawer();
      form.resetFields();
      void load();
    } catch (error) {
      if (error instanceof Error && error.message) return;
      Notification.error({ title: "失败", content: "请检查表单输入" });
    }
  };

  const remove = async (record: RoiReviewItem) => {
    try {
      await del(`/ipd/reviews/${record.id}`);
      setSelectedKeys((prev) => prev.filter((key) => key !== record.id));
      void load();
    } catch (error) {
      notifyError(error, "删除失败");
    }
  };

  const bulkRemove = async () => {
    try {
      for (const id of selectedKeys) {
        await del(`/ipd/reviews/${id}`);
      }
      Notification.success({ title: "成功", content: `已删除 ${selectedKeys.length} 项` });
      setSelectedKeys([]);
      void load();
    } catch (error) {
      notifyError(error, "批量删除失败");
      setSelectedKeys([]);
      void load();
    }
  };

  const columns = [
    {
      title: "阶段",
      dataIndex: "phase",
      width: 90,
      render: (_: unknown, record: RoiReviewItem) => <Tag>{ROI_PHASE_LABELS[record.phase] ?? record.phase}</Tag>,
    },
    {
      title: "销售额",
      dataIndex: "salesUsd",
      width: 110,
      render: (_: unknown, record: RoiReviewItem) => `$${record.salesUsd.toLocaleString()}`,
    },
    {
      title: "广告成本",
      dataIndex: "adCostUsd",
      width: 110,
      render: (_: unknown, record: RoiReviewItem) => `$${record.adCostUsd.toLocaleString()}`,
    },
    {
      title: "ROI",
      dataIndex: "roi",
      width: 90,
      render: (_: unknown, record: RoiReviewItem) => (record.roi === null ? "-" : record.roi.toFixed(2)),
    },
    {
      title: "决策",
      dataIndex: "decision",
      width: 100,
      render: (_: unknown, record: RoiReviewItem) =>
        record.decision ? <Tag color="orange">{ROI_DECISION_LABELS[record.decision] ?? record.decision}</Tag> : "-",
    },
    {
      title: "操作",
      dataIndex: "actions",
      fixed: "right" as const,
      width: 80,
      render: (_: unknown, record: RoiReviewItem) => (
        <Tooltip content="删除">
          <Popconfirm className="w-56" title="确认删除？" onOk={() => void remove(record)}>
            <Button type="text" status="danger" icon={<IconDelete />} />
          </Popconfirm>
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* 操作行：右侧「新增」；选中后出现批量删除。接口无分页参数，不放分页组件 */}
      <div className="flex items-center gap-2">
        <div className="ml-auto flex items-center gap-2">
          {selectedKeys.length > 0 && (
            <Popconfirm
              className="w-56"
              title={`确认删除选中的 ${selectedKeys.length} 项？`}
              onOk={() => void bulkRemove()}
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
          noDataElement={<span className="text-gray-400">暂无复盘记录</span>}
        />
      </Spin>
      <Drawer
        visible={drawerMode !== null}
        placement="right"
        width={480}
        title={drawerMode ? DRAWER_TITLE[drawerMode] : ""}
        unmountOnExit
        onOk={() => void submit()}
        onCancel={closeDrawer}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="阶段" field="phase" rules={[{ required: true, message: "请选择阶段" }]}>
            <Select placeholder="预售期">
              {Object.entries(ROI_PHASE_LABELS).map(([value, label]) => (
                <Select.Option key={value} value={value}>
                  {label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="销售额（USD）" field="salesUsd">
            <InputNumber placeholder="12000" min={0} className="w-full" />
          </Form.Item>
          <Form.Item label="广告成本（USD）" field="adCostUsd">
            <InputNumber placeholder="3000" min={0} className="w-full" />
          </Form.Item>
          <Form.Item label="产品成本（USD）" field="productCostUsd">
            <InputNumber placeholder="4000" min={0} className="w-full" />
          </Form.Item>
          <Form.Item label="履约成本（USD）" field="fulfillmentCostUsd">
            <InputNumber placeholder="1500" min={0} className="w-full" />
          </Form.Item>
          <Form.Item label="退款额（USD）" field="refundUsd">
            <InputNumber placeholder="200" min={0} className="w-full" />
          </Form.Item>
          <Form.Item label="售后成本（USD）" field="afterSaleCostUsd">
            <InputNumber placeholder="100" min={0} className="w-full" />
          </Form.Item>
          <Form.Item label="ROI（手工计算）" field="roi">
            <InputNumber placeholder="0.65" min={0} className="w-full" />
          </Form.Item>
          <Form.Item label="复盘决策" field="decision">
            <Select placeholder="维持" allowClear>
              {Object.entries(ROI_DECISION_LABELS).map(([value, label]) => (
                <Select.Option key={value} value={value}>
                  {label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="备注" field="notes">
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
