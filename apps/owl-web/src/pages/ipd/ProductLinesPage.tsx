/**
 * IPD 产品线列表 —— 按 docs/frontend-rules.md 第五节样板结构（对照 apps/admin-web/src/pages/SampleListPage.tsx）。
 *
 * 结构：标题区 → 筛选区（关键字 + IPD 阶段 + 生命周期，draft/applied 两段态）→ 操作行（批量删除 + 新增）→
 * Spin 列表 + 独立分页。新增 / 编辑 / 详情共用右侧抽屉（详情只读 Descriptions，直接用行数据）；
 * 名称点击跳转 /ipd/product-lines/:id（阶段推进等完整操作在详情页）。
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
import { useNavigate } from "react-router-dom";
import { del, get, post, put } from "../../api/client";
import {
  IPD_STAGE_LABELS,
  IPD_STAGE_ORDER,
  LIFECYCLE_STAGE_OPTIONS,
  type PageData,
  type ProductLineItem,
  ipdStageLabel,
  lifecycleStageLabel,
  toDateOnly,
} from "../../api/pipeline";

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
// 列宽合计（含多选列 50）：增删列时同步该值
const TABLE_SCROLL_X = 980;

type DrawerMode = "create" | "edit" | "detail";

const DRAWER_TITLE: Record<DrawerMode, string> = {
  create: "新增产品线",
  edit: "编辑产品线",
  detail: "产品线详情",
};

/** 筛选条件：draft 编辑，点「搜索」后整体提交为 applied */
interface ProductLineFilters {
  keyword: string;
  ipdStage: string;
  lifecycleStage: string;
}

const EMPTY_FILTERS: ProductLineFilters = { keyword: "", ipdStage: "", lifecycleStage: "" };

export function ProductLinesPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<ProductLineItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [draft, setDraft] = useState<ProductLineFilters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<ProductLineFilters>(EMPTY_FILTERS);
  const [selectedKeys, setSelectedKeys] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerMode, setDrawerMode] = useState<DrawerMode | null>(null);
  const [drawerRecord, setDrawerRecord] = useState<ProductLineItem | null>(null);
  const [form] = Form.useForm();

  const load = useCallback(async (currentPage: number, size: number, filters: ProductLineFilters) => {
    setLoading(true);
    try {
      const result = await get<PageData<ProductLineItem>>("/ipd/product-lines", {
        page: currentPage,
        pageSize: size,
        keyword: filters.keyword || undefined,
        ipdStage: filters.ipdStage || undefined,
        lifecycleStage: filters.lifecycleStage || undefined,
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

  const patchDraft = (patch: Partial<ProductLineFilters>) => {
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

  const openDrawer = (mode: DrawerMode, record?: ProductLineItem) => {
    setDrawerMode(mode);
    setDrawerRecord(record ?? null);
    form.resetFields();
    if (record) {
      form.setFieldsValue(record);
    }
  };

  const closeDrawer = () => {
    setDrawerMode(null);
    setDrawerRecord(null);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validate();
      if (drawerMode === "edit" && drawerRecord) {
        await put(`/ipd/product-lines/${drawerRecord.id}`, values);
        Notification.success({ title: "成功", content: "产品线已更新" });
      } else {
        await post("/ipd/product-lines", values);
        Notification.success({ title: "成功", content: "产品线已创建" });
      }
      closeDrawer();
      void load(page, pageSize, applied);
    } catch (error) {
      if (error instanceof Error && error.message) {
        return;
      }
      Notification.error({ title: "失败", content: "请检查表单输入" });
    }
  };

  const handleDelete = async (record: ProductLineItem) => {
    try {
      await del(`/ipd/product-lines/${record.id}`);
      Notification.success({ title: "成功", content: "已删除" });
      setSelectedKeys((prev) => prev.filter((key) => key !== record.id));
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

  const handleBulkDelete = async () => {
    try {
      for (const id of selectedKeys) {
        await del(`/ipd/product-lines/${id}`);
      }
      Notification.success({ title: "成功", content: `已删除 ${selectedKeys.length} 项` });
      setSelectedKeys([]);
      setPage(1);
      void load(1, pageSize, applied);
    } catch (error) {
      Notification.error({ title: "失败", content: error instanceof Error ? error.message : "批量删除失败" });
      setSelectedKeys([]);
      void load(page, pageSize, applied);
    }
  };

  const columns = [
    // 左侧固定列必须排在列首，所以把「编号」放在第一列并 fixed: "left"
    { title: "编号", dataIndex: "code", fixed: "left" as const, width: 130 },
    {
      title: "名称",
      dataIndex: "name",
      width: 220,
      render: (_: unknown, record: ProductLineItem) => (
        <Tooltip content={record.name}>
          <span
            className="block max-w-[200px] cursor-pointer truncate text-blue-600 hover:underline"
            onClick={() => navigate(`/ipd/product-lines/${record.id}`)}
          >
            {record.name}
          </span>
        </Tooltip>
      ),
    },
    {
      title: "IPD 阶段",
      dataIndex: "ipdStage",
      width: 110,
      render: (_: unknown, record: ProductLineItem) => <Tag color="blue">{ipdStageLabel(record.ipdStage)}</Tag>,
    },
    {
      title: "生命周期",
      dataIndex: "lifecycleStage",
      width: 110,
      render: (_: unknown, record: ProductLineItem) => (
        <Tag color="green">{lifecycleStageLabel(record.lifecycleStage)}</Tag>
      ),
    },
    { title: "SPU 数", dataIndex: "spuCount", width: 90 },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      width: 120,
      render: (_: unknown, record: ProductLineItem) => toDateOnly(record.createdAt),
    },
    {
      title: "操作",
      dataIndex: "actions",
      fixed: "right" as const,
      width: 150,
      render: (_: unknown, record: ProductLineItem) => (
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
      {/* 1. 页面标题区 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">IPD 产品线</h1>
      </div>

      {/* 2. 筛选区：条件网格，搜索 / 重置 贴在最后一项那一行的最右。无卡片容器 */}
      <div className="grid grid-cols-4 gap-3">
        <Input
          placeholder="名称 / 编号"
          style={{ width: "100%" }}
          value={draft.keyword}
          onChange={(value) => patchDraft({ keyword: value })}
          onPressEnter={handleSearch}
        />
        <Select
          allowClear
          placeholder="IPD 阶段"
          style={{ width: "100%" }}
          value={draft.ipdStage || undefined}
          onChange={(value: string) => patchDraft({ ipdStage: value ?? "" })}
        >
          {IPD_STAGE_ORDER.map((stage) => (
            <Select.Option key={stage} value={stage}>
              {IPD_STAGE_LABELS[stage]}
            </Select.Option>
          ))}
        </Select>
        <Select
          allowClear
          placeholder="生命周期"
          style={{ width: "100%" }}
          value={draft.lifecycleStage || undefined}
          onChange={(value: string) => patchDraft({ lifecycleStage: value ?? "" })}
        >
          {LIFECYCLE_STAGE_OPTIONS.map((option) => (
            <Select.Option key={option.value} value={option.value}>
              {option.label}
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

      {/* 3. 操作行：右侧「新增」；选中列表数据后，新增前多出「批量删除」。不放刷新按钮 */}
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

      {/* 4. 列表区：Spin 加载 + 多选表格。无卡片容器 */}
      <div>
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
            noDataElement={<span className="text-gray-400">暂无产品线</span>}
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

      {/* 5. 右侧抽屉：新增 / 编辑 / 详情共用，只换标题与可编辑性（详情只读，直接用行数据） */}
      <Drawer
        visible={drawerMode !== null}
        placement="right"
        width={480}
        title={drawerMode ? DRAWER_TITLE[drawerMode] : ""}
        unmountOnExit
        footer={drawerMode === "detail" ? null : undefined}
        onOk={() => {
          void handleSubmit();
        }}
        onCancel={closeDrawer}
      >
        {drawerMode === "detail" && drawerRecord ? (
          <Descriptions
            column={1}
            data={[
              { label: "编号", value: drawerRecord.code },
              { label: "名称", value: drawerRecord.name },
              { label: "IPD 阶段", value: ipdStageLabel(drawerRecord.ipdStage) },
              { label: "生命周期", value: lifecycleStageLabel(drawerRecord.lifecycleStage) },
              { label: "风格描述", value: drawerRecord.styleDesc || "-" },
              { label: "目标市场", value: drawerRecord.targetMarket || "-" },
              { label: "SPU 数", value: String(drawerRecord.spuCount) },
              { label: "备注", value: drawerRecord.notes || "-" },
              { label: "创建时间", value: toDateOnly(drawerRecord.createdAt) },
            ]}
          />
        ) : (
          <Form form={form} layout="vertical">
            <Form.Item
              label="名称"
              field="name"
              rules={[
                { required: true, message: "请输入产品线名称" },
                { maxLength: 100, message: "名称不超过 100 字" },
              ]}
            >
              <Input placeholder="硬核桌面收纳系列" />
            </Form.Item>
            <Form.Item label="风格描述" field="styleDesc">
              <Input.TextArea placeholder="工业风铝合金 + 磁吸" />
            </Form.Item>
            <Form.Item label="目标市场" field="targetMarket">
              <Input placeholder="北美" />
            </Form.Item>
            <Form.Item label="备注" field="notes">
              <Input.TextArea placeholder="面向 TikTok 家居场景" />
            </Form.Item>
            {drawerRecord && (
              <div className="rounded bg-gray-50 p-3 text-xs text-gray-500">
                当前阶段：{ipdStageLabel(drawerRecord.ipdStage)}（{lifecycleStageLabel(drawerRecord.lifecycleStage)}）。
                阶段推进请进入详情页操作。
              </div>
            )}
          </Form>
        )}
      </Drawer>
    </div>
  );
}
