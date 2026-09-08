import { useCallback, useEffect, useState } from "react";
import { Button, Modal, Notification, Table, Tag, Input, Space, Form } from "@arco-design/web-react";
import { get, post, put, del } from "../api/client";
import type { ColumnProps } from "@arco-design/web-react/es/Table";

interface ProductItem {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  price: number;
  stock: number;
  enabled: boolean;
  sortOrder: number;
  createdAt: string;
}
interface PageData {
  items: ProductItem[];
  total: number;
}

export function ProductsPage() {
  const [data, setData] = useState<ProductItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const r = await get<PageData>(`/recognition/products?page=${page}&pageSize=20`);
      setData(r.items);
      setTotal(r.total);
    } finally {
      setLoading(false);
    }
  }, [page]);
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = () => {
    setEditingId(null);
    form.resetFields();
    setModalVisible(true);
  };
  const handleEdit = (r: ProductItem) => {
    setEditingId(r.id);
    form.setFieldsValue(r);
    setModalVisible(true);
  };
  const handleDelete = (id: string) => {
    Modal.confirm({
      title: "确认删除",
      onOk: async () => {
        await del(`/recognition/products/${id}`);
        Notification.success({ content: "删除成功" });
        fetchData();
      },
    });
  };
  const handleSubmit = async () => {
    const v = await form.validate();
    if (editingId) await put(`/recognition/products/${editingId}`, v);
    else await post("/recognition/products", v);
    Notification.success({ content: editingId ? "更新成功" : "创建成功" });
    setModalVisible(false);
    fetchData();
  };

  const columns: ColumnProps[] = [
    { title: "名称", dataIndex: "name" },
    {
      title: "图片",
      dataIndex: "image",
      render: (v: string | null) => (v ? <img src={v} className="h-10 w-10 object-cover" /> : "-"),
    },
    { title: "价格", dataIndex: "price", width: 80, render: (v: number) => `${v} 币` },
    { title: "库存", dataIndex: "stock", width: 60 },
    {
      title: "状态",
      dataIndex: "enabled",
      width: 80,
      render: (v: boolean) => <Tag color={v ? "green" : "gray"}>{v ? "上架" : "下架"}</Tag>,
    },
    {
      title: "操作",
      width: 160,
      render: (r: ProductItem) => (
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
        <h3 className="text-lg font-medium">商品管理</h3>
        <Button type="primary" onClick={handleCreate}>
          上架商品
        </Button>
      </div>
      <Table
        rowKey="id"
        loading={loading}
        data={data}
        columns={columns}
        pagination={{ total, current: page, pageSize: 20, onChange: setPage }}
      />
      <Modal
        title={editingId ? "编辑商品" : "上架商品"}
        visible={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item field="name" label="名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item field="description" label="描述">
            <Input.TextArea />
          </Form.Item>
          <Form.Item field="image" label="图片URL">
            <Input />
          </Form.Item>
          <Form.Item field="price" label="价格（币）" rules={[{ required: true }]}>
            <Input type="number" />
          </Form.Item>
          <Form.Item field="stock" label="库存" initialValue={0}>
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
