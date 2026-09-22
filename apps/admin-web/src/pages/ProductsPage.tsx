/**
 * 商品管理 —— 按 apps/admin-web/src/pages/SampleListPage.tsx 的样板改造（规范见 docs/frontend-rules.md 第五节）。
 *
 * 结构：标题区 → 筛选区（关键字 + 状态，搜索/重置贴最后一行最右）→ 操作行（右侧靠最右是「新增」，
 * 选中列表数据后在「新增」左侧出现「批量删除」）→ 列表区（Spin 加载、左端固定「名称」、右端固定「操作」、
 * 超长截断 + Tooltip、分页默认 10 条 + 总数 + 可切换每页条数）。
 * 筛选条件编辑在 draft 里，点「搜索」才提交为 applied 并触发查询；筛选区与列表区都不套卡片容器。
 * 新增 / 编辑 / 详情共用右侧抽屉：详情只读（Descriptions），新增 / 编辑为可编辑表单。
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
import type { ColumnProps } from "@arco-design/web-react/es/Table";
import { del, get, post, put } from "../api/client";
import { ImageUpload } from "../components/ImageUpload";

interface ProductItem {
  id: number;
  name: string;
  description: string | null;
  image: string | null;
  price: number;
  stock: number;
  enabled: boolean;
  sortOrder: number;
  createdAt: string;
}

interface ProductPageData {
  list: ProductItem[];
  pageNum: number;
  pageSize: number;
  total: number;
}

/** 编辑抽屉的表单值；Input type="number" 交出的是字符串，由后端按 DTO 类型转换 */
interface ProductFormValues {
  name: string;
  description?: string;
  price: string;
  stock: string;
  sortOrder: string;
}

/** 接口的 enabled 参数只认 true / false，"all" 表示不带该条件 */
type EnabledFilter = "all" | "true" | "false";

interface ProductFilters {
  keyword: string;
  enabled: EnabledFilter;
}

type DrawerMode = "create" | "edit" | "detail";

const DRAWER_TITLE: Record<DrawerMode, string> = { create: "新增商品", edit: "编辑商品", detail: "商品详情" };
const ENABLED_ALL: EnabledFilter = "all";
const ENABLED_OPTIONS: { label: string; value: EnabledFilter }[] = [
  { label: "全部状态", value: ENABLED_ALL },
  { label: "上架", value: "true" },
  { label: "下架", value: "false" },
];
const EMPTY_FILTERS: ProductFilters = { keyword: "", enabled: ENABLED_ALL };
const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const DRAWER_WIDTH = 480;
// 列宽合计（含多选列 50）：超过容器宽度就横向滚动，配合 fixed 列实现两端悬浮。增删列时同步这个值
const TABLE_SCROLL_X = 1170;

export function ProductsPage() {
  const [data, setData] = useState<ProductItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  // draft 是正在编辑的条件，applied 是点过「搜索」后真正生效的条件
  const [draft, setDraft] = useState<ProductFilters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<ProductFilters>(EMPTY_FILTERS);
  const [selectedKeys, setSelectedKeys] = useState<number[]>([]);
  const [drawerMode, setDrawerMode] = useState<DrawerMode | null>(null);
  const [drawerRecord, setDrawerRecord] = useState<ProductItem | null>(null);
  // 图片不走表单字段：ImageUpload 交出的是地址，提交时和表单值一起拼进 payload
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [form] = Form.useForm<ProductFormValues>();

  const load = useCallback(async (currentPage: number, size: number, filters: ProductFilters) => {
    setLoading(true);
    try {
      const result = await get<ProductPageData>("/recognition/products", {
        page: currentPage,
        pageSize: size,
        keyword: filters.keyword || undefined,
        enabled: filters.enabled === ENABLED_ALL ? undefined : filters.enabled,
      });
      setData(result.list);
      setTotal(result.total);
    } catch (error) {
      Notification.error({ title: "失败", content: error instanceof Error ? error.message : "加载失败" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(page, pageSize, applied);
  }, [page, pageSize, applied, load]);

  const patchDraft = (patch: Partial<ProductFilters>) => {
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

  const openDrawer = (mode: DrawerMode, record?: ProductItem) => {
    setDrawerMode(mode);
    setDrawerRecord(record ?? null);
    if (mode === "detail") {
      return;
    }
    form.resetFields();
    setImageUrl(record?.image ?? undefined);
    if (record) {
      form.setFieldsValue({
        name: record.name,
        description: record.description ?? "",
        price: String(record.price),
        stock: String(record.stock),
        sortOrder: String(record.sortOrder),
      });
    }
  };

  const closeDrawer = () => {
    setDrawerMode(null);
    setDrawerRecord(null);
  };

  const save = async () => {
    const values = await form.validate();
    // price / stock / sortOrder 在表单里是字符串（Input type="number"），商品表对应的是 Int 列，这里转成数字
    const payload = {
      name: values.name,
      description: values.description,
      image: imageUrl,
      price: Number(values.price),
      stock: Number(values.stock || 0),
      sortOrder: Number(values.sortOrder || 0),
    };
    try {
      if (drawerMode === "edit" && drawerRecord) {
        await put<void>(`/recognition/products/${drawerRecord.id}`, payload);
        Notification.success({ title: "成功", content: "商品已更新" });
      } else {
        await post<void>("/recognition/products", payload);
        Notification.success({ title: "成功", content: "商品已创建" });
      }
      closeDrawer();
      void load(page, pageSize, applied);
    } catch (error) {
      Notification.error({ title: "失败", content: error instanceof Error ? error.message : "保存失败" });
    }
  };

  const removeOne = async (id: number) => {
    try {
      await del<void>(`/recognition/products/${id}`);
      Notification.success({ title: "成功", content: "删除成功" });
      setSelectedKeys((prev) => prev.filter((key) => key !== id));
      // 删掉本页最后一条时回退一页，避免停在空页
      if (data.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        void load(page, pageSize, applied);
      }
    } catch (error) {
      Notification.error({ title: "失败", content: error instanceof Error ? error.message : "删除失败" });
    }
  };

  const removeSelected = async () => {
    try {
      await Promise.all(selectedKeys.map((id) => del<void>(`/recognition/products/${id}`)));
      Notification.success({ title: "成功", content: `已删除 ${selectedKeys.length} 项` });
      setSelectedKeys([]);
      setPage(1);
      void load(1, pageSize, applied);
    } catch (error) {
      Notification.error({ title: "失败", content: error instanceof Error ? error.message : "批量删除失败" });
    }
  };

  const columns: ColumnProps<ProductItem>[] = [
    // 左侧固定列必须排在列首
    {
      title: "名称",
      dataIndex: "name",
      fixed: "left" as const,
      width: 220,
      render: (value: string) => (
        <Tooltip content={value}>
          <span className="block max-w-[180px] truncate">{value}</span>
        </Tooltip>
      ),
    },
    {
      title: "图片",
      dataIndex: "image",
      width: 100,
      render: (value: string | null) =>
        value ? <img src={value} alt="商品图片" className="h-10 w-10 object-cover" /> : "-",
    },
    { title: "价格", dataIndex: "price", width: 100, render: (value: number) => `${value} 币` },
    { title: "库存", dataIndex: "stock", width: 100 },
    {
      title: "描述",
      dataIndex: "description",
      width: 260,
      render: (value: string | null) =>
        value ? (
          <Tooltip content={value}>
            <span className="block max-w-[220px] truncate">{value}</span>
          </Tooltip>
        ) : (
          "-"
        ),
    },
    {
      title: "状态",
      dataIndex: "enabled",
      width: 100,
      render: (value: boolean) => <Tag color={value ? "green" : "gray"}>{value ? "上架" : "下架"}</Tag>,
    },
    { title: "排序", dataIndex: "sortOrder", width: 100 },
    {
      title: "操作",
      dataIndex: "actions",
      fixed: "right" as const,
      width: 140,
      render: (_: unknown, record: ProductItem) => (
        <Space>
          <Tooltip content="详情">
            <Button type="text" icon={<IconEye />} onClick={() => openDrawer("detail", record)} />
          </Tooltip>
          <Tooltip content="编辑">
            <Button type="text" icon={<IconEdit />} onClick={() => openDrawer("edit", record)} />
          </Tooltip>
          <Tooltip content="删除">
            <Popconfirm className="w-56" title="确认删除该商品？" onOk={() => removeOne(record.id)}>
              <Button type="text" status="danger" icon={<IconDelete />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* 1. 页面标题区 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">商品管理</h1>
      </div>

      {/* 2. 筛选区：条件网格 + 搜索/重置贴最后一行最右 */}
      <div className="grid grid-cols-4 gap-3">
        <Input
          placeholder="商品名称"
          style={{ width: "100%" }}
          value={draft.keyword}
          onChange={(value) => patchDraft({ keyword: value })}
          onPressEnter={handleSearch}
        />
        <Select
          placeholder="状态"
          style={{ width: "100%" }}
          value={draft.enabled}
          onChange={(value: EnabledFilter) => patchDraft({ enabled: value })}
          options={ENABLED_OPTIONS}
        />
        <div className="col-start-4 flex items-center justify-end gap-2">
          <Tooltip content="搜索">
            <Button type="primary" icon={<IconSearch />} onClick={handleSearch} />
          </Tooltip>
          <Tooltip content="重置">
            <Button icon={<IconRefresh />} onClick={handleReset} />
          </Tooltip>
        </div>
      </div>

      {/* 3. 操作行：右侧最右是「新增」；选中后新增前多出「批量删除」 */}
      <div className="flex items-center justify-end gap-2">
        {selectedKeys.length > 0 && (
          <Popconfirm className="w-56" title={`确认删除选中的 ${selectedKeys.length} 项？`} onOk={removeSelected}>
            <Tooltip content={`批量删除（${selectedKeys.length}）`}>
              <Button status="danger" icon={<IconDelete />} />
            </Tooltip>
          </Popconfirm>
        )}
        <Tooltip content="新增">
          <Button icon={<IconPlus />} onClick={() => openDrawer("create")} />
        </Tooltip>
      </div>

      {/* 4. 列表区：Spin 点指示符 + 多选表格（左右两端固定列）+ 独立分页 */}
      <div>
        {/* Spin 必须带 block：Arco 的 .arco-spin 是 display:inline-block，会按内容宽度收缩，
            宽表格会被撑出页面、内部横向滚动失效 */}
        <Spin loading={loading} dot block>
          <Table
            rowKey="id"
            columns={columns}
            data={data}
            pagination={false}
            scroll={{ x: TABLE_SCROLL_X }}
            rowSelection={{
              fixed: true,
              selectedRowKeys: selectedKeys,
              onChange: (keys) => setSelectedKeys(keys as number[]),
            }}
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

      {/* 5. 右侧抽屉：新增 / 编辑 / 详情共用 */}
      <Drawer
        visible={drawerMode !== null}
        placement="right"
        width={DRAWER_WIDTH}
        title={drawerMode ? DRAWER_TITLE[drawerMode] : ""}
        unmountOnExit
        footer={drawerMode === "detail" ? null : undefined}
        onOk={save}
        onCancel={closeDrawer}
      >
        {drawerMode === "detail" ? (
          drawerRecord ? (
            <Descriptions
              column={1}
              data={[
                { label: "名称", value: drawerRecord.name },
                { label: "描述", value: drawerRecord.description ?? "-" },
                {
                  label: "图片",
                  value: drawerRecord.image ? (
                    <img src={drawerRecord.image} alt="商品图片" className="h-20 w-20 object-cover" />
                  ) : (
                    "-"
                  ),
                },
                { label: "价格", value: `${drawerRecord.price} 币` },
                { label: "库存", value: drawerRecord.stock },
                { label: "状态", value: drawerRecord.enabled ? "上架" : "下架" },
                { label: "排序", value: drawerRecord.sortOrder },
                { label: "创建时间", value: new Date(drawerRecord.createdAt).toLocaleString() },
              ]}
            />
          ) : null
        ) : (
          <Form form={form} layout="vertical">
            <Form.Item
              label="名称"
              field="name"
              rules={[
                { required: true, message: "请输入商品名称" },
                { maxLength: 50, message: "名称不超过 50 个字符" },
              ]}
            >
              <Input placeholder="请输入商品名称" />
            </Form.Item>
            <Form.Item label="描述" field="description">
              <Input.TextArea placeholder="商品描述（可选）" autoSize={{ minRows: 3, maxRows: 6 }} />
            </Form.Item>
            <Form.Item label="图片">
              <ImageUpload value={imageUrl} onChange={setImageUrl} />
            </Form.Item>
            <Form.Item
              label="价格（币）"
              field="price"
              rules={[
                { required: true, message: "请输入价格" },
                { match: /^\d+(\.\d+)?$/, message: "请输入有效的价格" },
              ]}
            >
              <Input type="number" placeholder="请输入价格" />
            </Form.Item>
            <Form.Item
              label="库存"
              field="stock"
              initialValue="0"
              rules={[{ match: /^\d*$/, message: "请输入有效的库存数" }]}
            >
              <Input type="number" placeholder="请输入库存" />
            </Form.Item>
            <Form.Item label="排序" field="sortOrder" initialValue="0">
              <Input type="number" placeholder="请输入排序值" />
            </Form.Item>
          </Form>
        )}
      </Drawer>
    </div>
  );
}
