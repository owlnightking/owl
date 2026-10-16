/**
 * 机会判断（调研）页签 —— 列表按样板结构（docs/frontend-rules.md 第五节）。
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
  Spin,
  Table,
  Tag,
  Tooltip,
} from "@arco-design/web-react";
import { IconDelete, IconPlus } from "@arco-design/web-react/icon";
import { del, get, post } from "../../api/client";
import { RESEARCH_TYPE_LABELS, type PageData, type ResearchItem, toDateOnly } from "../../api/pipeline";
import { notifyError } from "./notify";

type DrawerMode = "create";

const DRAWER_TITLE: Record<DrawerMode, string> = { create: "添加调研" };

// 列宽合计（含多选列 50）：增删列时同步该值
const TABLE_SCROLL_X = 810;

export function ResearchTab({ productLineId }: { productLineId: number }) {
  const [list, setList] = useState<ResearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKeys, setSelectedKeys] = useState<number[]>([]);
  const [drawerMode, setDrawerMode] = useState<DrawerMode | null>(null);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await get<ResearchItem[]>(`/ipd/product-lines/${productLineId}/researches`);
      setList(Array.isArray(result) ? result : ((result as PageData<ResearchItem>).list ?? []));
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
      await post(`/ipd/product-lines/${productLineId}/researches`, values);
      Notification.success({ title: "成功", content: "调研记录已添加" });
      closeDrawer();
      form.resetFields();
      void load();
    } catch (error) {
      if (error instanceof Error && error.message) return;
      Notification.error({ title: "失败", content: "请检查表单输入" });
    }
  };

  const remove = async (record: ResearchItem) => {
    try {
      await del(`/ipd/researches/${record.id}`);
      setSelectedKeys((prev) => prev.filter((key) => key !== record.id));
      void load();
    } catch (error) {
      notifyError(error, "删除失败");
    }
  };

  const bulkRemove = async () => {
    try {
      for (const id of selectedKeys) {
        await del(`/ipd/researches/${id}`);
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
      render: (_: unknown, record: ResearchItem) => <Tag>{RESEARCH_TYPE_LABELS[record.type] ?? record.type}</Tag>,
    },
    {
      title: "标题",
      dataIndex: "title",
      width: 220,
      render: (_: unknown, record: ResearchItem) => (
        <Tooltip content={record.title}>
          <span className="block max-w-[200px] truncate">{record.title}</span>
        </Tooltip>
      ),
    },
    {
      title: "内容",
      dataIndex: "content",
      width: 240,
      render: (_: unknown, record: ResearchItem) => (
        <Tooltip content={record.content ?? ""}>
          <span className="block max-w-[220px] truncate">{record.content ?? "-"}</span>
        </Tooltip>
      ),
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      width: 110,
      render: (_: unknown, record: ResearchItem) => toDateOnly(record.createdAt),
    },
    {
      title: "操作",
      dataIndex: "actions",
      fixed: "right" as const,
      width: 80,
      render: (_: unknown, record: ResearchItem) => (
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
          noDataElement={<span className="text-gray-400">暂无调研记录</span>}
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
            <Select placeholder="竞品调研">
              {Object.entries(RESEARCH_TYPE_LABELS).map(([value, label]) => (
                <Select.Option key={value} value={value}>
                  {label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="标题" field="title" rules={[{ required: true, message: "请输入标题" }]}>
            <Input placeholder="竞品 Anker 桌面系列调研" />
          </Form.Item>
          <Form.Item label="内容" field="content">
            <Input.TextArea placeholder="定价区间 / 卖点 / 差异点" />
          </Form.Item>
          <Form.Item label="来源引用" field="sourceRef">
            <Input placeholder="链接或资料出处" />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
