/**
 * 立项（设计任务）页签 —— 列表按样板结构（docs/frontend-rules.md 第五节）。
 * 接口为 ipd-stage 明细列表（无 page / pageSize / 筛选参数），按规范省略筛选区与分页，保留操作行 + Spin + icon 行操作。
 */
import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Drawer,
  Form,
  Input,
  Notification,
  Popconfirm,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tag,
  Tooltip,
} from "@arco-design/web-react";
import { IconCheck, IconDelete, IconPlus } from "@arco-design/web-react/icon";
import { del, get, post, put } from "../../api/client";
import {
  DESIGN_TASK_STATUS_LABELS,
  DESIGN_TASK_TYPE_LABELS,
  type DesignTaskItem,
  type PageData,
} from "../../api/pipeline";
import { notifyError } from "./notify";

type DrawerMode = "create";

const DRAWER_TITLE: Record<DrawerMode, string> = { create: "添加设计任务" };

// 列宽合计（含多选列 50）：增删列时同步该值
const TABLE_SCROLL_X = 700;

const DONE_STATUS = "done";

export function DesignTaskTab({ productLineId }: { productLineId: number }) {
  const [list, setList] = useState<DesignTaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKeys, setSelectedKeys] = useState<number[]>([]);
  const [drawerMode, setDrawerMode] = useState<DrawerMode | null>(null);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await get<DesignTaskItem[]>(`/ipd/product-lines/${productLineId}/design-tasks`);
      setList(Array.isArray(result) ? result : ((result as PageData<DesignTaskItem>).list ?? []));
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
      await post(`/ipd/product-lines/${productLineId}/design-tasks`, values);
      Notification.success({ title: "成功", content: "设计任务已添加" });
      closeDrawer();
      form.resetFields();
      void load();
    } catch (error) {
      if (error instanceof Error && error.message) return;
      Notification.error({ title: "失败", content: "请检查表单输入" });
    }
  };

  const advance = async (record: DesignTaskItem) => {
    try {
      await put(`/ipd/design-tasks/${record.id}`, { status: DONE_STATUS });
      void load();
    } catch (error) {
      notifyError(error, "状态更新失败");
    }
  };

  const remove = async (record: DesignTaskItem) => {
    try {
      await del(`/ipd/design-tasks/${record.id}`);
      setSelectedKeys((prev) => prev.filter((key) => key !== record.id));
      void load();
    } catch (error) {
      notifyError(error, "删除失败");
    }
  };

  const bulkRemove = async () => {
    try {
      for (const id of selectedKeys) {
        await del(`/ipd/design-tasks/${id}`);
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
      title: "类型",
      dataIndex: "type",
      width: 110,
      render: (_: unknown, record: DesignTaskItem) => <Tag>{DESIGN_TASK_TYPE_LABELS[record.type] ?? record.type}</Tag>,
    },
    {
      title: "标题",
      dataIndex: "title",
      width: 220,
      render: (_: unknown, record: DesignTaskItem) => (
        <Tooltip content={record.title}>
          <span className="block max-w-[200px] truncate">{record.title}</span>
        </Tooltip>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 100,
      render: (_: unknown, record: DesignTaskItem) => (
        <Tag color={record.status === DONE_STATUS ? "green" : record.status === "in_progress" ? "blue" : "gray"}>
          {DESIGN_TASK_STATUS_LABELS[record.status] ?? record.status}
        </Tag>
      ),
    },
    {
      title: "可行性",
      dataIndex: "feasible",
      width: 90,
      render: (_: unknown, record: DesignTaskItem) =>
        record.feasible === null || record.feasible === undefined ? (
          <span className="text-gray-400">-</span>
        ) : record.feasible ? (
          <Tag color="green">可行</Tag>
        ) : (
          <Tag color="red">不可行</Tag>
        ),
    },
    {
      title: "操作",
      dataIndex: "actions",
      fixed: "right" as const,
      width: 130,
      render: (_: unknown, record: DesignTaskItem) => (
        <Space>
          {record.status !== DONE_STATUS && (
            <Tooltip content="标记完成">
              <Button
                type="text"
                icon={<IconCheck />}
                onClick={() => {
                  void advance(record);
                }}
              />
            </Tooltip>
          )}
          <Tooltip content="删除">
            <Popconfirm className="w-56" title="确认删除？" onOk={() => void remove(record)}>
              <Button type="text" status="danger" icon={<IconDelete />} />
            </Popconfirm>
          </Tooltip>
        </Space>
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
          noDataElement={<span className="text-gray-400">暂无设计任务</span>}
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
          <Form.Item label="类型" field="type" rules={[{ required: true, message: "请选择类型" }]}>
            <Select placeholder="外观设计">
              {Object.entries(DESIGN_TASK_TYPE_LABELS).map(([value, label]) => (
                <Select.Option key={value} value={value}>
                  {label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="标题" field="title" rules={[{ required: true, message: "请输入标题" }]}>
            <Input placeholder="外观设计三方案" />
          </Form.Item>
          <Form.Item label="状态" field="status">
            <Select placeholder="待开始" allowClear>
              {Object.entries(DESIGN_TASK_STATUS_LABELS).map(([value, label]) => (
                <Select.Option key={value} value={value}>
                  {label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="生产可行性" field="feasible" triggerPropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="备注" field="notes">
            <Input.TextArea placeholder="工艺 / 材料说明" />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
