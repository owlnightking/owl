import { useCallback, useEffect, useState } from "react";
import { Button, Modal, Notification, Table, Tag, Input, Space, Form, Select } from "@arco-design/web-react";
import { get, post, put, del } from "../api/client";
import { ImageUpload } from "../components/ImageUpload";
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
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [keyword, setKeyword] = useState("");
  const [enabledFilter, setEnabledFilter] = useState<string>("all");
  const [form] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (keyword) params.set("keyword", keyword);
      if (enabledFilter !== "all") params.set("enabled", enabledFilter);
      const r = await get<PageData>(`/recognition/products?${params.toString()}`);
      setData(r.items);
      setTotal(r.total);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, keyword, enabledFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = () => {
    setEditingId(null);
    form.resetFields();
    setImageUrl(undefined);
    setModalVisible(true);
  };
  const handleEdit = (r: ProductItem) => {
    setEditingId(r.id);
    form.setFieldsValue(r);
    setImageUrl(r.image ?? undefined);
    setModalVisible(true);
  };
  const handleDelete = (id: string) => {
    Modal.confirm({
      title: "确认删除",
      content: "删除后不可恢复",
      onOk: async () => {
        await del(`/recognition/products/${id}`);
        Notification.success({ content: "删除成功" });
        fetchData();
      },
    });
  };
  const handleSubmit = async () => {
    const v = await form.validate();
    const payload = { ...v, image: imageUrl };
    if (editingId) await put(`/recognition/products/${editingId}`, payload);
    else await post("/recognition/products", payload);
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
    { title: "排序", dataIndex: "sortOrder", width: 60 },
    {
      title: "操作",
      width: 160,
      render: (_: unknown, r: ProductItem) => (
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
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-medium">商品管理</h3>
        <Space>
          <Input.Search
            style={{ width: 240 }}
            placeholder="搜索商品名称"
            onSearch={(v) => {
              setKeyword(v);
              setPage(1);
            }}
          />
          <Select
            style={{ width: 120 }}
            value={enabledFilter}
            onChange={(v) => {
              setEnabledFilter(v);
              setPage(1);
            }}
            options={[
              { label: "全部状态", value: "all" },
              { label: "上架", value: "true" },
              { label: "下架", value: "false" },
            ]}
          />
          <Button type="primary" onClick={handleCreate}>
            上架商品
          </Button>
        </Space>
      </div>
      <Table
        rowKey="id"
        loading={loading}
        data={data}
        columns={columns}
        pagination={{
          total,
          current: page,
          pageSize,
          showTotal: true,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
      />
      <Modal
        title={editingId ? "编辑商品" : "上架商品"}
        visible={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            field="name"
            label="名称"
            rules={[
              { required: true, message: "请输入商品名称" },
              { maxLength: 50, message: "名称不超过50个字符" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item field="description" label="描述">
            <Input.TextArea />
          </Form.Item>
          <Form.Item label="图片">
            <ImageUpload value={imageUrl} onChange={setImageUrl} />
          </Form.Item>
          <Form.Item
            field="price"
            label="价格（币）"
            rules={[
              { required: true, message: "请输入价格" },
              { match: /^\d+(\.\d+)?$/, message: "请输入有效的价格" },
            ]}
          >
            <Input type="number" />
          </Form.Item>
          <Form.Item
            field="stock"
            label="库存"
            initialValue={0}
            rules={[{ match: /^\d*$/, message: "请输入有效的库存数" }]}
          >
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
