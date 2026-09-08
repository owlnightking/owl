import { useEffect, useState } from "react";
import { Button, Modal, Notification, Table, Tag, Input, Space, Form } from "@arco-design/web-react";
import { get, post, put, del } from "../api/client";
import type { ColumnProps } from "@arco-design/web-react/es/Table";

interface BadgeItem {
  id: string;
  name: string;
  icon: string | null;
  description: string | null;
  coinReward: number;
  expReward: number;
  enabled: boolean;
  sortOrder: number;
  createdAt: string;
}

export function BadgesPage() {
  const [data, setData] = useState<BadgeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      setData(await get<BadgeItem[]>("/recognition/badges"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = () => {
    setEditingId(null);
    form.resetFields();
    setModalVisible(true);
  };
  const handleEdit = (r: BadgeItem) => {
    setEditingId(r.id);
    form.setFieldsValue(r);
    setModalVisible(true);
  };
  const handleDelete = (id: string) => {
    Modal.confirm({
      title: "确认删除",
      content: "删除后不可恢复",
      onOk: async () => {
        await del(`/recognition/badges/${id}`);
        Notification.success({ content: "删除成功" });
        fetchData();
      },
    });
  };
  const handleSubmit = async () => {
    const v = await form.validate();
    if (editingId) await put(`/recognition/badges/${editingId}`, v);
    else await post("/recognition/badges", v);
    Notification.success({ content: editingId ? "更新成功" : "创建成功" });
    setModalVisible(false);
    fetchData();
  };

  const columns: ColumnProps[] = [
    { title: "名称", dataIndex: "name" },
    { title: "图标", dataIndex: "icon", render: (v: string | null) => (v ? <img src={v} className="h-8 w-8" /> : "-") },
    { title: "描述", dataIndex: "description", ellipsis: true },
    { title: "奖励币", dataIndex: "coinReward", width: 80 },
    { title: "奖励经验", dataIndex: "expReward", width: 80 },
    {
      title: "状态",
      dataIndex: "enabled",
      width: 80,
      render: (v: boolean) => <Tag color={v ? "green" : "gray"}>{v ? "启用" : "禁用"}</Tag>,
    },
    { title: "排序", dataIndex: "sortOrder", width: 60 },
    {
      title: "操作",
      width: 160,
      render: (r: BadgeItem) => (
        <Space>
          <Button size="small" onClick={() => handleEdit(r)}>
            编辑
          </Button>
          <Button size="small" status="danger" onClick={() => handleDelete(r.id)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex justify-between">
        <h3 className="text-lg font-medium">徽章管理</h3>
        <Button type="primary" onClick={handleCreate}>
          新建徽章
        </Button>
      </div>
      <Table rowKey="id" loading={loading} data={data} columns={columns} pagination={false} />
      <Modal
        title={editingId ? "编辑徽章" : "新建徽章"}
        visible={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item field="name" label="名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item field="icon" label="图标URL">
            <Input />
          </Form.Item>
          <Form.Item field="description" label="描述">
            <Input.TextArea />
          </Form.Item>
          <Form.Item field="coinReward" label="奖励币数" initialValue={0}>
            <Input type="number" />
          </Form.Item>
          <Form.Item field="expReward" label="奖励经验" initialValue={0}>
            <Input type="number" />
          </Form.Item>
          <Form.Item field="sortOrder" label="排序" initialValue={0}>
            <Input type="number" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
