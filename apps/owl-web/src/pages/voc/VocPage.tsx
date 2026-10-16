/**
 * VOC 模块 —— 五渠道用户之声工单（按样板页改造，规范见 docs/frontend-rules.md 第五节）。
 *
 * 结构：标题区 → 筛选区（渠道 / 分类 / 状态，draft/applied 网格 + 搜索/重置贴最后一行最右）→
 * 操作行（选中后批量删除 + 右侧 icon「新增」）→ 列表区（Spin 点指示符、多选、操作列固定右、独立分页）→
 * 右侧抽屉三态：详情（只读 Descriptions）/ 编辑（状态 + 处理备注表单）/ 新增（录入工单）。
 * 状态推进：新建 → 已归类 → 已解决 / 已忽略。金额无涉。
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
import { IconDelete, IconEdit, IconEye, IconPlus, IconRefresh, IconSearch } from "@arco-design/web-react/icon";
import { del, get, post, put } from "../../api/client";
import {
  VOC_CATEGORY_LABELS,
  VOC_SOURCE_LABELS,
  VOC_STATUS_LABELS,
  type PageData,
  type VocTicketItem,
  toDateOnly,
} from "../../api/pipeline";

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
// 列宽合计（含多选列 50）：超过容器宽度就横向滚动，配合 fixed 操作列悬浮。增删列时同步这个值
const TABLE_SCROLL_X = 1050;

/** 右侧抽屉的三种用途：新增（录入）/ 编辑（处理）/ 详情（只读） */
type DrawerMode = "create" | "edit" | "detail";

const DRAWER_TITLE: Record<DrawerMode, string> = { create: "录入 VOC 工单", edit: "工单处理", detail: "工单详情" };

/** 筛选条件（空串 = 不过滤） */
interface VocFilters {
  source: string;
  category: string;
  status: string;
}

const EMPTY_FILTERS: VocFilters = { source: "", category: "", status: "" };

function statusTagColor(status: string): string {
  if (status === "resolved") return "green";
  if (status === "triaged") return "blue";
  if (status === "ignored") return "gray";
  return "orangered";
}

export function VocPage() {
  const [data, setData] = useState<VocTicketItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [draft, setDraft] = useState<VocFilters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<VocFilters>(EMPTY_FILTERS);
  const [selectedKeys, setSelectedKeys] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerMode, setDrawerMode] = useState<DrawerMode | null>(null);
  const [drawerRecord, setDrawerRecord] = useState<VocTicketItem | null>(null);
  const [form] = Form.useForm();
  const [handleForm] = Form.useForm();

  const load = useCallback(async (currentPage: number, size: number, filters: VocFilters) => {
    setLoading(true);
    try {
      const result = await get<PageData<VocTicketItem>>("/voc/tickets", {
        page: currentPage,
        pageSize: size,
        source: filters.source || undefined,
        category: filters.category || undefined,
        status: filters.status || undefined,
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

  const refresh = () => {
    void load(page, pageSize, applied);
  };

  const patchDraft = (patch: Partial<VocFilters>) => {
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

  const openCreate = () => {
    setDrawerMode("create");
    setDrawerRecord(null);
    form.resetFields();
    form.setFieldsValue({ source: "community" });
  };

  const openDetail = (record: VocTicketItem) => {
    setDrawerMode("detail");
    setDrawerRecord(record);
  };

  const openEdit = (record: VocTicketItem) => {
    setDrawerMode("edit");
    setDrawerRecord(record);
    handleForm.resetFields();
    handleForm.setFieldsValue(record);
  };

  const closeDrawer = () => {
    setDrawerMode(null);
    setDrawerRecord(null);
  };

  const submitCreate = async () => {
    try {
      const values = await form.validate();
      await post("/voc/tickets", values);
      Notification.success({ title: "成功", content: "工单已录入" });
      closeDrawer();
      refresh();
    } catch (error) {
      if (error instanceof Error && error.message) return;
      Notification.error({ title: "失败", content: "请检查表单输入" });
    }
  };

  const submitHandle = async () => {
    if (!drawerRecord) return;
    try {
      const values = await handleForm.validate();
      await put(`/voc/tickets/${drawerRecord.id}`, values);
      Notification.success({ title: "成功", content: "工单已更新" });
      closeDrawer();
      refresh();
    } catch (error) {
      if (error instanceof Error && error.message) return;
      Notification.error({ title: "失败", content: "请检查表单输入" });
    }
  };

  const advanceStatus = async (record: VocTicketItem, next: string) => {
    try {
      await put(`/voc/tickets/${record.id}`, { status: next });
      refresh();
    } catch (error) {
      Notification.error({ title: "失败", content: error instanceof Error ? error.message : "状态更新失败" });
    }
  };

  const remove = async (record: VocTicketItem) => {
    try {
      await del(`/voc/tickets/${record.id}`);
      Notification.success({ title: "成功", content: "删除成功" });
      setSelectedKeys((prev) => prev.filter((key) => key !== record.id));
      // 删掉本页最后一条时回退一页，避免停在空页
      if (data.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        refresh();
      }
    } catch (error) {
      Notification.error({ title: "失败", content: error instanceof Error ? error.message : "删除失败" });
    }
  };

  const handleBulkDelete = async () => {
    try {
      for (const id of selectedKeys) {
        await del(`/voc/tickets/${id}`);
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
      title: "渠道",
      dataIndex: "source",
      width: 110,
      render: (_: unknown, record: VocTicketItem) => (
        <Tag color="arcoblue">{VOC_SOURCE_LABELS[record.source] ?? record.source}</Tag>
      ),
    },
    {
      title: "标题",
      dataIndex: "title",
      width: 220,
      render: (text: string) => (
        <Tooltip content={text}>
          <span className="block max-w-[200px] truncate">{text}</span>
        </Tooltip>
      ),
    },
    {
      title: "分类",
      dataIndex: "category",
      width: 100,
      render: (_: unknown, record: VocTicketItem) => (
        <Tag>{VOC_CATEGORY_LABELS[record.category] ?? record.category}</Tag>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 100,
      render: (_: unknown, record: VocTicketItem) => (
        <Tag color={statusTagColor(record.status)}>{VOC_STATUS_LABELS[record.status] ?? record.status}</Tag>
      ),
    },
    {
      title: "关联",
      dataIndex: "productLineName",
      width: 140,
      render: (_: unknown, record: VocTicketItem) => {
        const text = record.productLineName ?? "-";
        return (
          <Tooltip content={text}>
            <span className="block max-w-[120px] truncate">{text}</span>
          </Tooltip>
        );
      },
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      width: 110,
      render: (_: unknown, record: VocTicketItem) => toDateOnly(record.createdAt),
    },
    {
      title: "操作",
      dataIndex: "actions",
      width: 220,
      fixed: "right" as const,
      render: (_: unknown, record: VocTicketItem) => (
        <Space>
          {/* 状态推进是 VOC 特有动作：保留短文字按钮，语义比通用 icon 更直观 */}
          {record.status === "new" && (
            <Tooltip content="归类为已归类">
              <Button type="text" size="small" onClick={() => void advanceStatus(record, "triaged")}>
                归类
              </Button>
            </Tooltip>
          )}
          {record.status === "triaged" && (
            <Tooltip content="推进为已解决">
              <Button type="text" size="small" onClick={() => void advanceStatus(record, "resolved")}>
                解决
              </Button>
            </Tooltip>
          )}
          <Tooltip content="详情">
            <Button type="text" icon={<IconEye />} onClick={() => openDetail(record)} />
          </Tooltip>
          <Tooltip content="编辑">
            <Button type="text" icon={<IconEdit />} onClick={() => openEdit(record)} />
          </Tooltip>
          <Tooltip content="删除">
            <Popconfirm
              className="w-56"
              title="确认删除？"
              onOk={() => {
                void remove(record);
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
        <h1 className="text-xl font-semibold text-gray-800">VOC 用户之声</h1>
      </div>
      <p className="m-0 text-xs text-gray-400">渠道：售后邮箱 / 社群 / 工坊留言 / WhatsApp / Twitter 私信</p>

      {/* 2. 筛选区：条件网格，搜索 / 重置 贴在最后一项那一行的最右。无卡片容器 */}
      <div className="grid grid-cols-4 gap-3">
        <Select
          allowClear
          placeholder="渠道"
          style={{ width: "100%" }}
          value={draft.source || undefined}
          onChange={(value: string | undefined) => patchDraft({ source: value ?? "" })}
        >
          {Object.entries(VOC_SOURCE_LABELS).map(([value, label]) => (
            <Select.Option key={value} value={value}>
              {label}
            </Select.Option>
          ))}
        </Select>
        <Select
          allowClear
          placeholder="分类"
          style={{ width: "100%" }}
          value={draft.category || undefined}
          onChange={(value: string | undefined) => patchDraft({ category: value ?? "" })}
        >
          {Object.entries(VOC_CATEGORY_LABELS).map(([value, label]) => (
            <Select.Option key={value} value={value}>
              {label}
            </Select.Option>
          ))}
        </Select>
        <Select
          allowClear
          placeholder="状态"
          style={{ width: "100%" }}
          value={draft.status || undefined}
          onChange={(value: string | undefined) => patchDraft({ status: value ?? "" })}
        >
          {Object.entries(VOC_STATUS_LABELS).map(([value, label]) => (
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
            <Button icon={<IconPlus />} onClick={openCreate} />
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
            noDataElement={<span className="text-gray-400">暂无 VOC 工单</span>}
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
          void (drawerMode === "create" ? submitCreate() : submitHandle());
        }}
        onCancel={closeDrawer}
      >
        {drawerMode === "detail" ? (
          <Descriptions
            column={1}
            data={[
              {
                label: "渠道",
                value: drawerRecord ? (VOC_SOURCE_LABELS[drawerRecord.source] ?? drawerRecord.source) : "",
              },
              {
                label: "分类",
                value: drawerRecord ? (VOC_CATEGORY_LABELS[drawerRecord.category] ?? drawerRecord.category) : "",
              },
              { label: "标题", value: drawerRecord?.title ?? "" },
              { label: "内容", value: drawerRecord?.content ?? "（无内容）" },
              {
                label: "状态",
                value: drawerRecord ? (VOC_STATUS_LABELS[drawerRecord.status] ?? drawerRecord.status) : "",
              },
              { label: "处理备注", value: drawerRecord?.handledNote ?? "-" },
              { label: "关联产品线", value: drawerRecord?.productLineName ?? "-" },
              { label: "创建时间", value: drawerRecord ? toDateOnly(drawerRecord.createdAt) : "" },
            ]}
          />
        ) : drawerMode === "create" ? (
          <Form form={form} layout="vertical">
            <Form.Item label="渠道" field="source" rules={[{ required: true, message: "请选择渠道" }]}>
              <Select placeholder="社群">
                {Object.entries(VOC_SOURCE_LABELS).map(([value, label]) => (
                  <Select.Option key={value} value={value}>
                    {label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="标题" field="title" rules={[{ required: true, message: "请输入标题" }]}>
              <Input placeholder="用户反馈磁吸力度不足" />
            </Form.Item>
            <Form.Item label="内容" field="content">
              <Input.TextArea placeholder="问题描述 / 复现步骤" />
            </Form.Item>
            <Form.Item label="分类" field="category">
              <Select placeholder="改进建议">
                {Object.entries(VOC_CATEGORY_LABELS).map(([value, label]) => (
                  <Select.Option key={value} value={value}>
                    {label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="产品线 ID（可选）" field="productLineId">
              <InputNumber placeholder="1" min={1} className="w-full" />
            </Form.Item>
            <Form.Item label="SPU ID（可选）" field="spuId">
              <InputNumber placeholder="1" min={1} className="w-full" />
            </Form.Item>
            <Form.Item label="状态" field="status">
              <Select placeholder="新建">
                {Object.entries(VOC_STATUS_LABELS).map(([value, label]) => (
                  <Select.Option key={value} value={value}>
                    {label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        ) : (
          <Form form={handleForm} layout="vertical">
            {drawerRecord && (
              <div className="mb-3 rounded bg-gray-50 p-3 text-xs text-gray-500">
                <div>
                  渠道：{VOC_SOURCE_LABELS[drawerRecord.source] ?? drawerRecord.source}；分类：
                  {VOC_CATEGORY_LABELS[drawerRecord.category] ?? drawerRecord.category}
                </div>
                <div className="mt-1">{drawerRecord.content ?? "（无内容）"}</div>
              </div>
            )}
            <Form.Item label="状态" field="status" rules={[{ required: true, message: "请选择状态" }]}>
              <Select placeholder="新建">
                {Object.entries(VOC_STATUS_LABELS).map(([value, label]) => (
                  <Select.Option key={value} value={value}>
                    {label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="处理备注" field="handledNote">
              <Input.TextArea placeholder="归类结论 / 解决方案 / 忽略原因" />
            </Form.Item>
          </Form>
        )}
      </Drawer>
    </div>
  );
}
