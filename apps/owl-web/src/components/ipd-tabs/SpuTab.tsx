/**
 * SPU / SKU 页签 —— 列表按样板结构（docs/frontend-rules.md 第五节）。
 * 筛选：状态（后端支持 status 参数）；productLineId 由页签上下文固定传参，不进筛选区。
 * 列表接口支持 page / pageSize → 独立分页；SKU 子表挂在 SPU 行展开区（按行加载）。
 */
import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  Notification,
  Pagination,
  Popconfirm,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tag,
  Tooltip,
} from "@arco-design/web-react";
import { IconDelete, IconEye, IconPlus, IconRefresh, IconRight, IconSearch } from "@arco-design/web-react/icon";
import { del, get, post, put } from "../../api/client";
import { SPU_STATUS_LABELS, type PageData, type SkuItem, type SpuItem, toDateOnly } from "../../api/pipeline";
import { notifyError } from "./notify";

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
// 列宽合计（含多选列 50）：增删列时同步该值
const TABLE_SCROLL_X = 860;

type DrawerMode = "create" | "sku";

const DRAWER_TITLE: Record<DrawerMode, string> = { create: "新增 SPU（立项期自动生成内部编号）", sku: "添加 SKU" };

/** SPU 状态流转：当前状态 → 下一状态（含行内按钮文案） */
const NEXT_STATUS_OF: Record<string, { status: string; label: string } | undefined> = {
  concept: { status: "developing", label: "推进到开发中" },
  developing: { status: "presale", label: "推进到预售" },
  presale: { status: "on_sale", label: "推进到在售" },
  on_sale: { status: "mature", label: "推进到成熟" },
  mature: { status: "liquidating", label: "推进到清货" },
  liquidating: { status: "delisted", label: "推进到下架" },
};

const SPU_STATUS_OPTIONS = Object.entries(SPU_STATUS_LABELS).map(([value, label]) => ({ value, label }));

/** 筛选条件：draft 编辑，点「搜索」后整体提交为 applied */
interface SpuFilters {
  status: string;
}

const EMPTY_FILTERS: SpuFilters = { status: "" };

export function SpuTab({ productLineId, onChanged }: { productLineId: number; onChanged: () => Promise<void> }) {
  const [spus, setSpus] = useState<SpuItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [draft, setDraft] = useState<SpuFilters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<SpuFilters>(EMPTY_FILTERS);
  const [selectedKeys, setSelectedKeys] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerMode, setDrawerMode] = useState<DrawerMode | null>(null);
  const [skuDrawerSpu, setSkuDrawerSpu] = useState<SpuItem | null>(null);
  const [expandedSkus, setExpandedSkus] = useState<Record<number, SkuItem[]>>({});
  const [spuForm] = Form.useForm();
  const [skuForm] = Form.useForm();

  const load = useCallback(
    async (currentPage: number, size: number, filters: SpuFilters) => {
      setLoading(true);
      try {
        const result = await get<PageData<SpuItem>>(`/ipd/product-lines/${productLineId}/spus`, {
          page: currentPage,
          pageSize: size,
          status: filters.status || undefined,
        });
        setSpus(result.list);
        setTotal(result.total);
      } catch (error) {
        notifyError(error, "加载失败");
      } finally {
        setLoading(false);
      }
    },
    [productLineId]
  );

  useEffect(() => {
    void load(page, pageSize, applied);
  }, [page, pageSize, applied, load]);

  const patchDraft = (patch: Partial<SpuFilters>) => {
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

  const loadSkus = async (spuId: number) => {
    try {
      const result = await get<SkuItem[]>(`/ipd/spus/${spuId}/skus`);
      setExpandedSkus((prev) => ({ ...prev, [spuId]: Array.isArray(result) ? result : [] }));
    } catch (error) {
      notifyError(error, "SKU 加载失败");
    }
  };

  const openSpuDrawer = () => {
    setDrawerMode("create");
    spuForm.resetFields();
  };

  const closeSpuDrawer = () => {
    setDrawerMode(null);
  };

  const submitSpu = async () => {
    try {
      const values = await spuForm.validate();
      await post(`/ipd/product-lines/${productLineId}/spus`, values);
      Notification.success({ title: "成功", content: "SPU 已创建（内部编号自动生成）" });
      closeSpuDrawer();
      spuForm.resetFields();
      void load(page, pageSize, applied);
      await onChanged();
    } catch (error) {
      if (error instanceof Error && error.message) return;
      Notification.error({ title: "失败", content: "请检查表单输入" });
    }
  };

  const submitSku = async () => {
    if (!skuDrawerSpu) return;
    try {
      const values = await skuForm.validate();
      await post(`/ipd/spus/${skuDrawerSpu.id}/skus`, values);
      Notification.success({ title: "成功", content: "SKU 已添加" });
      setSkuDrawerSpu(null);
      skuForm.resetFields();
      void loadSkus(skuDrawerSpu.id);
    } catch (error) {
      if (error instanceof Error && error.message) return;
      Notification.error({ title: "失败", content: "请检查表单输入" });
    }
  };

  const advanceSpuStatus = async (record: SpuItem, status: string) => {
    try {
      await put(`/ipd/spus/${record.id}`, { status });
      void load(page, pageSize, applied);
      await onChanged();
    } catch (error) {
      notifyError(error, "状态更新失败");
    }
  };

  const removeSpu = async (record: SpuItem) => {
    try {
      await del(`/ipd/spus/${record.id}`);
      setSelectedKeys((prev) => prev.filter((key) => key !== record.id));
      // 删掉本页最后一条时回退一页，避免停在空页
      if (spus.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        void load(page, pageSize, applied);
      }
      await onChanged();
    } catch (error) {
      notifyError(error, "删除失败");
    }
  };

  const bulkRemove = async () => {
    try {
      for (const id of selectedKeys) {
        await del(`/ipd/spus/${id}`);
      }
      Notification.success({ title: "成功", content: `已删除 ${selectedKeys.length} 项` });
      setSelectedKeys([]);
      setPage(1);
      void load(1, pageSize, applied);
      await onChanged();
    } catch (error) {
      notifyError(error, "批量删除失败");
      setSelectedKeys([]);
      void load(page, pageSize, applied);
    }
  };

  const columns = [
    // 左侧固定列必须排在列首，所以把「内部编号」放在第一列并 fixed: "left"
    {
      title: "内部编号",
      dataIndex: "internalCode",
      fixed: "left" as const,
      width: 130,
      render: (_: unknown, record: SpuItem) => (
        <Tooltip content={record.internalCode}>
          <span
            className="block max-w-[120px] cursor-pointer truncate text-blue-600"
            onClick={() => void loadSkus(record.id)}
          >
            {record.internalCode}
          </span>
        </Tooltip>
      ),
    },
    {
      title: "名称",
      dataIndex: "name",
      width: 220,
      render: (_: unknown, record: SpuItem) => (
        <Tooltip content={record.name}>
          <span className="block max-w-[200px] truncate">{record.name}</span>
        </Tooltip>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 100,
      render: (_: unknown, record: SpuItem) => (
        <Tag color="blue">{SPU_STATUS_LABELS[record.status] ?? record.status}</Tag>
      ),
    },
    { title: "SKU 数", dataIndex: "skuCount", width: 90 },
    {
      title: "上市时间",
      dataIndex: "launchAt",
      width: 110,
      render: (_: unknown, record: SpuItem) => toDateOnly(record.launchAt),
    },
    {
      title: "操作",
      dataIndex: "actions",
      fixed: "right" as const,
      width: 160,
      render: (_: unknown, record: SpuItem) => (
        <Space>
          <Tooltip content="查看 SKU">
            <Button
              type="text"
              icon={<IconEye />}
              onClick={() => {
                void loadSkus(record.id);
              }}
            />
          </Tooltip>
          <Tooltip content="加 SKU">
            <Button type="text" icon={<IconPlus />} onClick={() => setSkuDrawerSpu(record)} />
          </Tooltip>
          {NEXT_STATUS_OF[record.status] && (
            <Tooltip content={NEXT_STATUS_OF[record.status]?.label ?? ""}>
              <Button
                type="text"
                icon={<IconRight />}
                onClick={() => {
                  const next = NEXT_STATUS_OF[record.status];
                  if (next) void advanceSpuStatus(record, next.status);
                }}
              />
            </Tooltip>
          )}
          <Tooltip content="删除">
            <Popconfirm className="w-56" title="确认删除？" onOk={() => void removeSpu(record)}>
              <Button type="text" status="danger" icon={<IconDelete />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const skuColumns = [
    { title: "SKU 编码", dataIndex: "skuCode", width: 130 },
    {
      title: "名称",
      dataIndex: "name",
      width: 200,
      render: (_: unknown, record: SkuItem) => (
        <Tooltip content={record.name}>
          <span className="block max-w-[180px] truncate">{record.name}</span>
        </Tooltip>
      ),
    },
    {
      title: "美元售价",
      dataIndex: "priceUsd",
      width: 110,
      render: (_: unknown, record: SkuItem) => `$${record.priceUsd.toFixed(2)}`,
    },
    {
      title: "限量",
      dataIndex: "limited",
      width: 80,
      render: (_: unknown, record: SkuItem) => (record.limited ? <Tag color="orange">限量</Tag> : "-"),
    },
    { title: "库存", dataIndex: "stock", width: 80 },
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* 筛选区：状态条件网格。无卡片容器 */}
      <div className="grid grid-cols-4 gap-3">
        <Select
          allowClear
          placeholder="状态"
          style={{ width: "100%" }}
          value={draft.status || undefined}
          onChange={(value: string) => patchDraft({ status: value ?? "" })}
        >
          {SPU_STATUS_OPTIONS.map((option) => (
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

      {/* 操作行：右侧「新增」；选中后出现批量删除。不放刷新按钮 */}
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
            <Button icon={<IconPlus />} onClick={openSpuDrawer} />
          </Tooltip>
        </div>
      </div>

      {/* 列表区：Spin 加载 + 多选表格 + 独立分页 */}
      <div>
        <Spin loading={loading} dot block>
          <Table
            rowKey="id"
            columns={columns}
            data={spus}
            pagination={false}
            scroll={{ x: TABLE_SCROLL_X }}
            rowSelection={{
              fixed: true,
              selectedRowKeys: selectedKeys,
              onChange: (keys) => setSelectedKeys(keys as number[]),
            }}
            expandedRowRender={(record) => (
              <Table
                rowKey="id"
                columns={skuColumns}
                data={expandedSkus[record.id] ?? []}
                pagination={false}
                noDataElement={<span className="text-gray-400">暂无 SKU，点「加 SKU」添加</span>}
              />
            )}
            noDataElement={<span className="text-gray-400">暂无 SPU</span>}
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
        onOk={() => void submitSpu()}
        onCancel={closeSpuDrawer}
      >
        <Form form={spuForm} layout="vertical">
          <Form.Item label="名称" field="name" rules={[{ required: true, message: "请输入 SPU 名称" }]}>
            <Input placeholder="桌面收纳盒 标准版" />
          </Form.Item>
          <Form.Item label="备注" field="notes">
            <Input.TextArea placeholder="首发起量款" />
          </Form.Item>
        </Form>
      </Drawer>
      <Drawer
        visible={!!skuDrawerSpu}
        placement="right"
        width={480}
        title={skuDrawerSpu ? `${DRAWER_TITLE.sku}（${skuDrawerSpu.name}）` : ""}
        unmountOnExit
        onOk={() => void submitSku()}
        onCancel={() => setSkuDrawerSpu(null)}
      >
        <Form form={skuForm} layout="vertical">
          <Form.Item label="SKU 编码" field="skuCode" rules={[{ required: true, message: "请输入 SKU 编码" }]}>
            <Input placeholder="SKU-BLACK-L" />
          </Form.Item>
          <Form.Item label="名称" field="name" rules={[{ required: true, message: "请输入名称" }]}>
            <Input placeholder="黑色 大号" />
          </Form.Item>
          <Form.Item label="美元售价" field="priceUsd" rules={[{ required: true, message: "请输入美元售价" }]}>
            <InputNumber placeholder="49.99" min={0} className="w-full" />
          </Form.Item>
          <Form.Item label="限量款" field="limited" triggerPropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="库存" field="stock">
            <InputNumber placeholder="100" min={0} className="w-full" />
          </Form.Item>
          <Form.Item label="备注" field="notes">
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
