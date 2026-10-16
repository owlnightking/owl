/**
 * 汇率管理 —— CNY→USD 汇率表的人工校验维护入口（按样板页改造，规范见 docs/frontend-rules.md 第五节）。
 *
 * 结构：标题区 → 筛选区（基础 / 报价货币，draft/applied 网格 + 搜索/重置贴最后一行最右）→
 * 操作行（选中后批量删除 + 右侧 icon「新增」）→ 列表区（Spin 点指示符、操作列固定右、独立分页）。
 * 新增 / 编辑 / 详情共用右侧抽屉；cron 抓取的记录（source=api）默认未校验，人工核对后点「标记已校验」。
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
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
} from "@arco-design/web-react";
import {
  IconCheckCircle,
  IconCloseCircle,
  IconDelete,
  IconEdit,
  IconEye,
  IconPlus,
  IconRefresh,
  IconSearch,
} from "@arco-design/web-react/icon";
import { del, get, post, put } from "../api/client";

interface ExchangeRateItem {
  id: number;
  base: string;
  quote: string;
  rate: number;
  source: string;
  verified: boolean;
  effectiveDate: string;
  createdAt: string;
}

interface ExchangeRatePageData {
  list: ExchangeRateItem[];
  pageNum: number;
  pageSize: number;
  total: number;
}

/** 筛选条件；「重置」回到默认货币对 CNY→USD */
interface ExchangeRateFilters {
  base: string;
  quote: string;
}

type DrawerMode = "create" | "edit" | "detail";

const DRAWER_TITLE: Record<DrawerMode, string> = {
  create: "手工录入汇率",
  edit: "校验 / 修正汇率",
  detail: "汇率详情",
};
const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const DEFAULT_BASE = "CNY";
const DEFAULT_QUOTE = "USD";
// 列宽合计（含多选列 50）：超过容器宽度就横向滚动，配合 fixed 操作列悬浮。增删列时同步这个值
const TABLE_SCROLL_X = 780;
const SOURCE_LABEL: Record<string, string> = { api: "定时抓取", manual: "人工录入" };

const EMPTY_FILTERS: ExchangeRateFilters = { base: DEFAULT_BASE, quote: DEFAULT_QUOTE };

export function ExchangeRatesPage() {
  const [data, setData] = useState<ExchangeRateItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [draft, setDraft] = useState<ExchangeRateFilters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<ExchangeRateFilters>(EMPTY_FILTERS);
  const [selectedKeys, setSelectedKeys] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerMode, setDrawerMode] = useState<DrawerMode | null>(null);
  const [drawerRecord, setDrawerRecord] = useState<ExchangeRateItem | null>(null);
  const [form] = Form.useForm();

  const load = useCallback(async (currentPage: number, size: number, filters: ExchangeRateFilters) => {
    setLoading(true);
    try {
      const result = await get<ExchangeRatePageData>("/system/exchange-rates", {
        page: currentPage,
        pageSize: size,
        base: filters.base || undefined,
        quote: filters.quote || undefined,
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

  const patchDraft = (patch: Partial<ExchangeRateFilters>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const handleSearch = () => {
    setApplied({ base: draft.base.trim(), quote: draft.quote.trim() });
    setPage(1);
  };

  const handleReset = () => {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
    setPage(1);
  };

  const openDrawer = (mode: DrawerMode, record?: ExchangeRateItem) => {
    setDrawerMode(mode);
    setDrawerRecord(record ?? null);
    form.resetFields();
    if (record) {
      form.setFieldsValue({ rate: record.rate, effectiveDate: record.effectiveDate.slice(0, 10) });
    } else {
      form.setFieldsValue({
        base: DEFAULT_BASE,
        quote: DEFAULT_QUOTE,
        effectiveDate: new Date().toISOString().slice(0, 10),
      });
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
        await put(`/system/exchange-rates/${drawerRecord.id}`, {
          rate: values.rate,
          effectiveDate: values.effectiveDate,
        });
        Notification.success({ title: "成功", content: "汇率已更新" });
      } else {
        await post("/system/exchange-rates", {
          base: values.base,
          quote: values.quote,
          rate: values.rate,
          effectiveDate: values.effectiveDate,
        });
        Notification.success({ title: "成功", content: "汇率已录入" });
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

  const handleVerify = async (record: ExchangeRateItem) => {
    try {
      await put(`/system/exchange-rates/${record.id}`, { verified: !record.verified });
      Notification.success({ title: "成功", content: record.verified ? "已取消校验标记" : "已标记为已校验" });
      void load(page, pageSize, applied);
    } catch (error) {
      Notification.error({ title: "失败", content: error instanceof Error ? error.message : "操作失败" });
    }
  };

  const handleDelete = async (record: ExchangeRateItem) => {
    try {
      await del(`/system/exchange-rates/${record.id}`);
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
        await del(`/system/exchange-rates/${id}`);
      }
      Notification.success({ title: "成功", content: `已删除 ${selectedKeys.length} 项` });
      setSelectedKeys([]);
      setPage(1);
      void load(1, pageSize, applied);
    } catch (error) {
      Notification.error({ title: "失败", content: error instanceof Error ? error.message : "批量删除失败" });
    }
  };

  const columns = [
    {
      title: "货币对",
      dataIndex: "base",
      width: 120,
      render: (_: unknown, record: ExchangeRateItem) => `${record.base} → ${record.quote}`,
    },
    {
      title: "汇率",
      dataIndex: "rate",
      width: 120,
    },
    {
      title: "来源",
      dataIndex: "source",
      width: 110,
      render: (_: unknown, record: ExchangeRateItem) => (
        <Tag color={record.source === "api" ? "arcoblue" : "gray"}>{SOURCE_LABEL[record.source] ?? record.source}</Tag>
      ),
    },
    {
      title: "人工校验",
      dataIndex: "verified",
      width: 110,
      render: (_: unknown, record: ExchangeRateItem) =>
        record.verified ? <Tag color="green">已校验</Tag> : <Tag color="orangered">待校验</Tag>,
    },
    {
      title: "生效日期",
      dataIndex: "effectiveDate",
      width: 130,
      render: (_: unknown, record: ExchangeRateItem) => record.effectiveDate.slice(0, 10),
    },
    {
      title: "操作",
      dataIndex: "actions",
      width: 140,
      fixed: "right" as const,
      render: (_: unknown, record: ExchangeRateItem) => (
        <Space>
          <Tooltip content="详情">
            <Button type="text" icon={<IconEye />} onClick={() => openDrawer("detail", record)} />
          </Tooltip>
          {/* 校验 / 取消校验是本页特有动作：用语义 icon + Tooltip 表达切换含义 */}
          <Tooltip content={record.verified ? "取消校验" : "标记已校验"}>
            <Button
              type="text"
              icon={record.verified ? <IconCloseCircle /> : <IconCheckCircle />}
              onClick={() => {
                void handleVerify(record);
              }}
            />
          </Tooltip>
          <Tooltip content="编辑">
            <Button type="text" icon={<IconEdit />} onClick={() => openDrawer("edit", record)} />
          </Tooltip>
          <Tooltip content="删除">
            <Popconfirm
              className="w-56"
              title="确认删除该汇率记录？"
              onOk={() => {
                void handleDelete(record);
              }}
            >
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
        <h1 className="text-xl font-semibold text-gray-800">汇率管理</h1>
      </div>
      <p className="m-0 text-xs text-gray-400">
        全局金额以美元（USD）为准；供应链人民币成本按此处最新汇率折算。cron
        每日自动抓取，抓取结果需人工校验后作为结算口径。
      </p>

      {/* 2. 筛选区：条件网格，搜索 / 重置 贴在最后一项那一行的最右。无卡片容器 */}
      <div className="grid grid-cols-4 gap-3">
        <Input
          placeholder="基础货币"
          style={{ width: "100%" }}
          value={draft.base}
          onChange={(value) => patchDraft({ base: value })}
          onPressEnter={handleSearch}
        />
        <Input
          placeholder="报价货币"
          style={{ width: "100%" }}
          value={draft.quote}
          onChange={(value) => patchDraft({ quote: value })}
          onPressEnter={handleSearch}
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

      {/* 3. 操作行：选中后批量删除 + 右侧「新增」；不放刷新按钮 */}
      <div className="flex items-center gap-2">
        <div className="ml-auto flex items-center gap-2">
          {selectedKeys.length > 0 && (
            <Popconfirm
              className="w-56"
              title={`确认删除选中的 ${selectedKeys.length} 项？`}
              onOk={() => {
                void handleBulkDelete();
              }}
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

      {/* 4. 列表区：无卡片容器 */}
      <div>
        {/* Spin 必须带 block：Arco 的 .arco-spin 是 display:inline-block，会按内容宽度收缩 */}
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
            noDataElement={<span className="text-gray-400">暂无汇率记录</span>}
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

      {/* 5. 右侧抽屉：新增 / 编辑 / 详情共用，只换标题与可编辑性 */}
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
        {drawerMode === "detail" ? (
          <Descriptions
            column={1}
            data={[
              { label: "货币对", value: drawerRecord ? `${drawerRecord.base} → ${drawerRecord.quote}` : "" },
              { label: "汇率", value: drawerRecord?.rate ?? "" },
              {
                label: "来源",
                value: drawerRecord ? (SOURCE_LABEL[drawerRecord.source] ?? drawerRecord.source) : "",
              },
              { label: "人工校验", value: drawerRecord ? (drawerRecord.verified ? "已校验" : "待校验") : "" },
              { label: "生效日期", value: drawerRecord?.effectiveDate.slice(0, 10) ?? "" },
              { label: "创建时间", value: drawerRecord?.createdAt.slice(0, 10) ?? "" },
            ]}
          />
        ) : (
          <Form form={form} layout="vertical">
            {drawerMode === "create" && (
              <>
                <Form.Item label="基础货币" field="base" rules={[{ required: true, message: "请输入基础货币" }]}>
                  <Input placeholder="CNY" />
                </Form.Item>
                <Form.Item label="报价货币" field="quote" rules={[{ required: true, message: "请输入报价货币" }]}>
                  <Input placeholder="USD" />
                </Form.Item>
              </>
            )}
            <Form.Item
              label="汇率（1 基础货币 = ? 报价货币）"
              field="rate"
              rules={[
                { required: true, message: "请输入汇率" },
                {
                  validator: (value: number | undefined, callback: (error?: string) => void) => {
                    if (value !== undefined && value <= 0) {
                      callback("汇率必须大于 0");
                    } else {
                      callback();
                    }
                  },
                },
              ]}
            >
              <InputNumber placeholder="0.14" precision={6} min={0} className="w-full" />
            </Form.Item>
            <Form.Item label="生效日期" field="effectiveDate" rules={[{ required: true, message: "请选择生效日期" }]}>
              <Input type="date" />
            </Form.Item>
            {drawerRecord && (
              <div className="rounded bg-gray-50 p-3 text-xs text-gray-500">
                当前记录来源：{SOURCE_LABEL[drawerRecord.source] ?? drawerRecord.source}；
                {drawerRecord.verified ? "已人工校验" : "尚未人工校验"}
              </div>
            )}
          </Form>
        )}
      </Drawer>
    </div>
  );
}
