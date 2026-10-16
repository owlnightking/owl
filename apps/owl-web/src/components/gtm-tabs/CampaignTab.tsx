/**
 * GTM / 投放活动页签 —— 标准列表页结构（规范见 docs/frontend-rules.md 第五节）：
 * 筛选条件网格（draft / applied 两段态 + col-start-4 的搜索 / 重置）→ 操作行（批量删除 / 新增）
 * → Spin dot 列表 + 独立 Pagination → 右侧抽屉三态（新增 / 编辑 / 详情）→ 行操作 icon + Tooltip。
 * 状态流转（开始 / 结束）不属于详情 / 编辑 / 删除三件套，单独用语义 icon + Tooltip。
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
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
} from "@arco-design/web-react";
import {
  IconDelete,
  IconEdit,
  IconEye,
  IconPause,
  IconPlayArrow,
  IconPlus,
  IconRefresh,
  IconSearch,
} from "@arco-design/web-react/icon";
import { del, get, post, put } from "../../api/client";
import {
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_TYPE_LABELS,
  type CampaignItem,
  type PageData,
  formatUsd,
  toDateOnly,
} from "../../api/pipeline";
import { PLATFORM_OPTIONS, notifyError } from "./common";

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
// 列宽合计（含多选列 50）：超过容器宽度就横向滚动，配合 fixed 列实现两端悬浮。增删列时同步这个值
const TABLE_SCROLL_X = 1050;

/** 右侧抽屉的三种用途：新增 / 编辑 / 详情 */
type DrawerMode = "create" | "edit" | "detail";

const DRAWER_TITLE: Record<DrawerMode, string> = {
  create: "新增投放活动",
  edit: "编辑投放活动",
  detail: "投放活动详情",
};

/** 筛选条件；条件整体透传给接口（空串表示不参与筛选） */
interface CampaignFilters {
  platform: string;
  status: string;
  type: string;
}

const EMPTY_FILTERS: CampaignFilters = { platform: "", status: "", type: "" };

export function CampaignTab() {
  const [list, setList] = useState<CampaignItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  // draft 是正在编辑的条件，applied 是点过「搜索」后真正生效的条件
  const [draft, setDraft] = useState<CampaignFilters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<CampaignFilters>(EMPTY_FILTERS);
  // 表格多选：选中后才出现「批量删除」
  const [selectedKeys, setSelectedKeys] = useState<number[]>([]);
  // 右侧抽屉：新增 / 编辑 / 详情共用同一个 Drawer
  const [drawerMode, setDrawerMode] = useState<DrawerMode | null>(null);
  const [drawerRecord, setDrawerRecord] = useState<CampaignItem | null>(null);
  const [form] = Form.useForm();

  const load = useCallback(async (currentPage: number, filters: CampaignFilters, size: number) => {
    setLoading(true);
    try {
      const result = await get<PageData<CampaignItem>>("/gtm/campaigns", {
        page: currentPage,
        pageSize: size,
        ...(filters.platform ? { platform: filters.platform } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.type ? { type: filters.type } : {}),
      });
      setList(result.list);
      setTotal(result.total);
    } catch (error) {
      notifyError(error, "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(page, applied, pageSize);
  }, [page, pageSize, applied, load]);

  const patchDraft = (patch: Partial<CampaignFilters>) => {
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

  const openDrawer = (mode: DrawerMode, record?: CampaignItem) => {
    setDrawerMode(mode);
    setDrawerRecord(record ?? null);
    form.resetFields();
    if (record && mode === "edit") {
      form.setFieldsValue({ ...record, startDate: toDateOnly(record.startDate), endDate: toDateOnly(record.endDate) });
    }
  };

  const closeDrawer = () => {
    setDrawerMode(null);
    setDrawerRecord(null);
  };

  const submit = async () => {
    try {
      const values = await form.validate();
      if (drawerRecord) {
        const { productLineId, ...rest } = values;
        void productLineId;
        await put(`/gtm/campaigns/${drawerRecord.id}`, rest);
        Notification.success({ title: "成功", content: "投放活动已更新" });
      } else {
        await post(`/gtm/campaigns/product-lines/${values.productLineId}`, values);
        Notification.success({ title: "成功", content: "投放活动已创建" });
      }
      closeDrawer();
      void load(page, applied, pageSize);
    } catch (error) {
      if (error instanceof Error && error.message) return;
      Notification.error({ title: "失败", content: "请检查表单输入" });
    }
  };

  const handleDelete = async (record: CampaignItem) => {
    try {
      await del(`/gtm/campaigns/${record.id}`);
      Notification.success({ title: "成功", content: "删除成功" });
      setSelectedKeys((prev) => prev.filter((key) => key !== record.id));
      // 删掉本页最后一条时回退一页，避免停在空页
      if (list.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        void load(page, applied, pageSize);
      }
    } catch (error) {
      notifyError(error, "删除失败");
    }
  };

  const handleBulkDelete = async () => {
    try {
      // 逐个调用现有删除接口
      for (const id of selectedKeys) {
        await del(`/gtm/campaigns/${id}`);
      }
      Notification.success({ title: "成功", content: `已删除 ${selectedKeys.length} 项` });
      setSelectedKeys([]);
      if (page > 1) {
        setPage(1);
      } else {
        void load(page, applied, pageSize);
      }
    } catch (error) {
      notifyError(error, "批量删除失败");
    }
  };

  const advanceStatus = async (record: CampaignItem, status: string) => {
    try {
      await put(`/gtm/campaigns/${record.id}`, { status });
      void load(page, applied, pageSize);
    } catch (error) {
      notifyError(error, "状态更新失败");
    }
  };

  const columns = [
    {
      title: "名称",
      dataIndex: "name",
      width: 200,
      render: (text: string) => (
        <Tooltip content={text}>
          <span className="block max-w-[180px] truncate">{text}</span>
        </Tooltip>
      ),
    },
    {
      title: "类型",
      dataIndex: "type",
      width: 90,
      render: (_: unknown, record: CampaignItem) => <Tag>{CAMPAIGN_TYPE_LABELS[record.type] ?? record.type}</Tag>,
    },
    { title: "平台", dataIndex: "platform", width: 100 },
    {
      title: "状态",
      dataIndex: "status",
      width: 100,
      render: (_: unknown, record: CampaignItem) => (
        <Tag color={record.status === "running" ? "blue" : record.status === "ended" ? "green" : "gray"}>
          {CAMPAIGN_STATUS_LABELS[record.status] ?? record.status}
        </Tag>
      ),
    },
    {
      title: "KOL",
      dataIndex: "kolName",
      width: 120,
      render: (_: unknown, record: CampaignItem) => record.kolName ?? "-",
    },
    {
      title: "预算",
      dataIndex: "budgetUsd",
      width: 110,
      render: (_: unknown, record: CampaignItem) => formatUsd(record.budgetUsd),
    },
    {
      title: "已花费",
      dataIndex: "spentUsd",
      width: 110,
      render: (_: unknown, record: CampaignItem) => formatUsd(record.spentUsd),
    },
    {
      title: "操作",
      dataIndex: "actions",
      fixed: "right" as const,
      width: 170,
      render: (_: unknown, record: CampaignItem) => (
        <Space>
          {record.status === "planned" && (
            <Tooltip content="开始">
              <Button type="text" icon={<IconPlayArrow />} onClick={() => void advanceStatus(record, "running")} />
            </Tooltip>
          )}
          {record.status === "running" && (
            <Tooltip content="结束">
              <Button type="text" icon={<IconPause />} onClick={() => void advanceStatus(record, "ended")} />
            </Tooltip>
          )}
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
      {/* 筛选区：条件网格，搜索 / 重置 贴在最后一项那一行的最右。无卡片容器 */}
      <div className="grid grid-cols-4 gap-3">
        <Select
          allowClear
          placeholder="平台"
          style={{ width: "100%" }}
          value={draft.platform || undefined}
          onChange={(value: string) => patchDraft({ platform: value ?? "" })}
        >
          {PLATFORM_OPTIONS.map((option) => (
            <Select.Option key={option.value} value={option.value}>
              {option.label}
            </Select.Option>
          ))}
        </Select>
        <Select
          allowClear
          placeholder="状态"
          style={{ width: "100%" }}
          value={draft.status || undefined}
          onChange={(value: string) => patchDraft({ status: value ?? "" })}
        >
          {Object.entries(CAMPAIGN_STATUS_LABELS).map(([value, label]) => (
            <Select.Option key={value} value={value}>
              {label}
            </Select.Option>
          ))}
        </Select>
        <Select
          allowClear
          placeholder="类型"
          style={{ width: "100%" }}
          value={draft.type || undefined}
          onChange={(value: string) => patchDraft({ type: value ?? "" })}
        >
          {Object.entries(CAMPAIGN_TYPE_LABELS).map(([value, label]) => (
            <Select.Option key={value} value={value}>
              {label}
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

      {/* 操作行：右侧固定「新增」，选中列表数据后新增前多出「批量删除」；不放刷新按钮 */}
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

      {/* 列表区：Spin dot 加载 + 独立分页，无卡片容器 */}
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
            noDataElement={<span className="text-gray-400">暂无投放活动</span>}
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

      {/* 右侧抽屉：新增 / 编辑 / 详情共用，只换标题与可编辑性 */}
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
                { label: "产品线 ID", value: drawerRecord.productLineId },
                { label: "名称", value: drawerRecord.name },
                { label: "类型", value: CAMPAIGN_TYPE_LABELS[drawerRecord.type] ?? drawerRecord.type },
                { label: "平台", value: drawerRecord.platform },
                { label: "状态", value: CAMPAIGN_STATUS_LABELS[drawerRecord.status] ?? drawerRecord.status },
                { label: "KOL", value: drawerRecord.kolName ?? "-" },
                { label: "预算（USD）", value: formatUsd(drawerRecord.budgetUsd) },
                { label: "已花费（USD）", value: formatUsd(drawerRecord.spentUsd) },
                { label: "开始日期", value: toDateOnly(drawerRecord.startDate) },
                { label: "结束日期", value: toDateOnly(drawerRecord.endDate) },
                { label: "传播反馈", value: drawerRecord.feedbackNotes ?? "-" },
                { label: "备注", value: drawerRecord.notes ?? "-" },
                { label: "创建时间", value: toDateOnly(drawerRecord.createdAt) },
              ]}
            />
          )
        ) : (
          <Form form={form} layout="vertical">
            {drawerMode === "create" && (
              <Form.Item
                label="产品线 ID"
                field="productLineId"
                rules={[{ required: true, message: "请输入产品线 ID" }]}
              >
                <InputNumber placeholder="在产品线详情页查看" min={1} className="w-full" />
              </Form.Item>
            )}
            <Form.Item label="名称" field="name" rules={[{ required: true, message: "请输入名称" }]}>
              <Input placeholder="TikTok 预热视频第一波" />
            </Form.Item>
            <Form.Item label="类型" field="type" rules={[{ required: true, message: "请选择类型" }]}>
              <Select placeholder="预热">
                {Object.entries(CAMPAIGN_TYPE_LABELS).map(([value, label]) => (
                  <Select.Option key={value} value={value}>
                    {label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="平台" field="platform" rules={[{ required: true, message: "请选择平台" }]}>
              <Select placeholder="TikTok">
                {PLATFORM_OPTIONS.map((option) => (
                  <Select.Option key={option.value} value={option.value}>
                    {option.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            {drawerMode === "create" && (
              <Form.Item label="状态" field="status">
                <Select placeholder="计划中">
                  {Object.entries(CAMPAIGN_STATUS_LABELS).map(([value, label]) => (
                    <Select.Option key={value} value={value}>
                      {label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            )}
            <Form.Item label="预算（USD）" field="budgetUsd">
              <InputNumber placeholder="2000" min={0} className="w-full" />
            </Form.Item>
            <Form.Item label="已花费（USD）" field="spentUsd">
              <InputNumber placeholder="0" min={0} className="w-full" />
            </Form.Item>
            <Form.Item label="开始日期" field="startDate">
              <Input type="date" />
            </Form.Item>
            <Form.Item label="结束日期" field="endDate">
              <Input type="date" />
            </Form.Item>
            <Form.Item label="传播反馈" field="feedbackNotes">
              <Input.TextArea placeholder="播放 / 互动 / 转化观察" />
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
