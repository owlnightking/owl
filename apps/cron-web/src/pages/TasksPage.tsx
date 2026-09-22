/**
 * 定时任务列表 —— 按 apps/admin-web/src/pages/SampleListPage.tsx 的样板改造（规范见 docs/frontend-rules.md 第五、六节）。
 *
 * 结构：标题区 → 筛选区（任务名称关键字 + 搜索/重置贴最后一行最右）→ 操作行（右侧靠最右为新增，
 * 选中数据后其左侧出现批量删除）→ 列表区（Spin 点指示符、分页默认 10 条 + 总数 + 每页条数、
 * 左端固定「任务名称」、右端固定「操作」、长文本截断）。
 * 新增 / 编辑 / 详情共用右侧抽屉；启停开关与手动触发保留为行内控件（外面套 Tooltip）。
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
  Switch,
  Table,
  Tag,
  Tooltip,
} from "@arco-design/web-react";
import {
  IconDelete,
  IconEdit,
  IconEye,
  IconPlayArrow,
  IconPlus,
  IconRefresh,
  IconSearch,
} from "@arco-design/web-react/icon";
import type { SchedulerConfig } from "../types/scheduler";
import { createScheduler, deleteScheduler, fetchSchedulerPage, triggerTask, updateScheduler } from "../api/scheduler";
import { fetchFieldConfigs } from "../api/field-config";

interface SelectOption {
  label: string;
  value: string;
}

/** 右侧抽屉的三种用途：新增 / 编辑 / 详情 */
type DrawerMode = "create" | "edit" | "detail";

const DRAWER_TITLE: Record<DrawerMode, string> = { create: "新增任务", edit: "编辑任务", detail: "任务详情" };
const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
// 列宽合计（含多选列 50）：超过容器宽度就横向滚动，配合 fixed 列实现左右两端悬浮。增删列时同步这个值
const TABLE_SCROLL_X = 1190;

function parseOptions(raw: unknown): SelectOption[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    if (typeof item === "string") return { label: item, value: item };
    if (typeof item === "object" && item !== null && "value" in item) {
      const val = String(item.value);
      const lab = "label" in item && item.label != null ? String(item.label) : val;
      return { label: lab, value: val };
    }
    return { label: String(item), value: String(item) };
  });
}

function renderSelectOptions(options: SelectOption[]) {
  return options.map((opt) => (
    <Select.Option key={opt.value} value={opt.value}>
      {opt.label}
    </Select.Option>
  ));
}

export function TasksPage() {
  const [data, setData] = useState<SchedulerConfig[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  // loading 初值为 true：首次进入也走列表区 Spin，不给整页门与骨架屏
  const [loading, setLoading] = useState(true);
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [drawerMode, setDrawerMode] = useState<DrawerMode | null>(null);
  const [drawerRecord, setDrawerRecord] = useState<SchedulerConfig | null>(null);
  const [triggering, setTriggering] = useState<string | null>(null);
  const [form] = Form.useForm();

  const [tagOptions, setTagOptions] = useState<SelectOption[]>([]);
  const [moduleOptions, setModuleOptions] = useState<SelectOption[]>([]);
  const [cronOptions, setCronOptions] = useState<SelectOption[]>([]);

  const loadFieldConfigs = useCallback(async () => {
    try {
      const items = await fetchFieldConfigs("scheduler");
      for (const item of items) {
        const opts = parseOptions(item.options);
        switch (item.module) {
          case "tags":
            setTagOptions(opts);
            break;
          case "modules":
            setModuleOptions(opts);
            break;
          case "cron":
            setCronOptions(opts);
            break;
        }
      }
    } catch (error) {
      Notification.error({ title: "失败", content: error instanceof Error ? error.message : "加载字段配置失败" });
    }
  }, []);

  const load = useCallback(async (currentPage: number, size: number, search: string) => {
    setLoading(true);
    try {
      const result = await fetchSchedulerPage({ page: currentPage, pageSize: size, keyword: search || undefined });
      setData(result.list);
      setTotal(result.total);
    } catch (error) {
      Notification.error({ title: "失败", content: error instanceof Error ? error.message : "加载失败" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(page, pageSize, keyword);
  }, [page, pageSize, keyword, load]);

  useEffect(() => {
    void loadFieldConfigs();
  }, [loadFieldConfigs]);

  const handleSearch = () => {
    setKeyword(keywordInput);
    setPage(1);
  };

  const handleReset = () => {
    setKeywordInput("");
    setKeyword("");
    setPage(1);
  };

  const openDrawer = (mode: DrawerMode, record?: SchedulerConfig) => {
    setDrawerMode(mode);
    setDrawerRecord(record ?? null);
    if (mode === "detail") {
      return;
    }
    form.resetFields();
    if (mode === "edit" && record) {
      form.setFieldsValue({
        cron: record.cron,
        description: record.description ?? "",
        tags: record.tags?.[0] ?? "",
        module: record.module,
      });
    }
  };

  const closeDrawer = () => {
    setDrawerMode(null);
    setDrawerRecord(null);
  };

  const handleSubmit = async () => {
    const values = await form.validate().catch(() => null);
    if (!values) {
      return;
    }
    try {
      if (drawerMode === "edit" && drawerRecord) {
        await updateScheduler(drawerRecord.id, {
          cron: values.cron,
          description: values.description,
          tags: values.tags ? [values.tags] : [],
          module: values.module,
        });
        Notification.success({ title: "成功", content: "任务已更新" });
      } else {
        await createScheduler({
          name: values.name,
          area: values.module,
          cron: values.cron,
          handler: values.handler,
          tags: values.tags ? [values.tags] : [],
          module: values.module,
          description: values.description,
        });
        Notification.success({ title: "成功", content: "任务已创建" });
      }
      closeDrawer();
      void load(page, pageSize, keyword);
    } catch (error) {
      Notification.error({ title: "失败", content: error instanceof Error ? error.message : "保存失败" });
    }
  };

  const removeOne = async (config: SchedulerConfig) => {
    try {
      await deleteScheduler(config.id);
      Notification.success({ title: "成功", content: "删除成功" });
      setSelectedKeys((prev) => prev.filter((key) => key !== config.id));
      // 删掉本页最后一条时回退一页，避免停在空页
      if (data.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        void load(page, pageSize, keyword);
      }
    } catch (error) {
      Notification.error({ title: "失败", content: error instanceof Error ? error.message : "删除失败" });
    }
  };

  const removeSelected = async () => {
    try {
      await Promise.all(selectedKeys.map((id) => deleteScheduler(id)));
      Notification.success({ title: "成功", content: `已删除 ${selectedKeys.length} 项` });
      setSelectedKeys([]);
      setPage(1);
      void load(1, pageSize, keyword);
    } catch (error) {
      Notification.error({ title: "失败", content: error instanceof Error ? error.message : "批量删除失败" });
    }
  };

  const toggleEnabled = async (config: SchedulerConfig) => {
    try {
      await updateScheduler(config.id, { enabled: !config.enabled });
      Notification.success({ title: "成功", content: `已${config.enabled ? "禁用" : "启用"}` });
      void load(page, pageSize, keyword);
    } catch (error) {
      Notification.error({ title: "失败", content: error instanceof Error ? error.message : "操作失败" });
    }
  };

  const handleTrigger = async (config: SchedulerConfig) => {
    setTriggering(config.id);
    try {
      await triggerTask(config.area, config.handler);
      Notification.success({ title: "成功", content: `${config.name} 已触发执行` });
    } catch (error) {
      Notification.error({ title: "失败", content: error instanceof Error ? error.message : "触发失败" });
    } finally {
      setTriggering(null);
    }
  };

  const columns = [
    // 左侧固定列必须排在列首
    {
      title: "任务名称",
      dataIndex: "name",
      fixed: "left" as const,
      width: 200,
      render: (value: string) => (
        <Tooltip content={value}>
          <span className="block max-w-[170px] truncate">{value}</span>
        </Tooltip>
      ),
    },
    {
      title: "Handler",
      dataIndex: "handler",
      width: 160,
      render: (value: string) => (
        <Tooltip content={value}>
          <span className="block max-w-[130px] truncate">{value}</span>
        </Tooltip>
      ),
    },
    {
      title: "Cron 表达式",
      dataIndex: "cron",
      width: 160,
      render: (value: string) => (
        <Tooltip content={value}>
          <span className="block max-w-[130px] truncate">{value}</span>
        </Tooltip>
      ),
    },
    {
      title: "标签",
      dataIndex: "tags",
      width: 200,
      render: (tags: string[]) =>
        tags.length === 0 ? (
          <span className="text-gray-400">-</span>
        ) : (
          tags.map((tag) => (
            <Tag key={tag} color="arcoblue" className="mr-1">
              {tag}
            </Tag>
          ))
        ),
    },
    {
      title: "模块",
      dataIndex: "module",
      width: 120,
      render: (value: string | null) => {
        const option = moduleOptions.find((item) => item.value === value);
        return option ? <Tag color="green">{option.label}</Tag> : <span className="text-gray-400">{value ?? "-"}</span>;
      },
    },
    {
      title: "状态",
      dataIndex: "enabled",
      width: 100,
      render: (value: boolean, record: SchedulerConfig) => (
        <Tooltip content={value ? "点击禁用" : "点击启用"}>
          <Switch checked={value} onChange={() => void toggleEnabled(record)} />
        </Tooltip>
      ),
    },
    {
      title: "操作",
      dataIndex: "actions",
      fixed: "right" as const,
      width: 200,
      render: (_: unknown, record: SchedulerConfig) => (
        <Space>
          <Tooltip content="详情">
            <Button type="text" icon={<IconEye />} onClick={() => openDrawer("detail", record)} />
          </Tooltip>
          <Tooltip content="编辑">
            <Button type="text" icon={<IconEdit />} onClick={() => openDrawer("edit", record)} />
          </Tooltip>
          <Tooltip content="手动触发">
            <Button
              type="text"
              icon={<IconPlayArrow />}
              loading={triggering === record.id}
              onClick={() => void handleTrigger(record)}
            />
          </Tooltip>
          <Tooltip content="删除">
            <Popconfirm className="w-56" title="确认删除该任务？" onOk={() => removeOne(record)}>
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
        <h1 className="text-xl font-semibold text-gray-800">定时任务</h1>
      </div>

      {/* 2. 筛选区：条件网格，搜索 / 重置 贴在最右。无卡片容器 */}
      <div className="grid grid-cols-4 gap-3">
        <Input
          placeholder="任务名称关键字"
          style={{ width: "100%" }}
          value={keywordInput}
          onChange={setKeywordInput}
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

      {/* 3. 操作行：右侧靠最右是新增；选中数据后其左侧多出批量删除，未选中时不渲染 */}
      <div className="flex items-center gap-2">
        <div className="ml-auto flex items-center gap-2">
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
      </div>

      {/* 4. 列表区：无卡片容器。Spin 必须带 block，否则宽表格被撑出页面、内部横向滚动失效 */}
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
              onChange: (keys) => setSelectedKeys(keys as string[]),
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

      {/* 5. 右侧抽屉：新增 / 编辑 / 详情共用，只换标题与可编辑性 */}
      <Drawer
        visible={drawerMode !== null}
        placement="right"
        width={480}
        title={drawerMode ? DRAWER_TITLE[drawerMode] : ""}
        unmountOnExit
        footer={drawerMode === "detail" ? null : undefined}
        onOk={() => void handleSubmit()}
        onCancel={closeDrawer}
      >
        {drawerMode === "detail" ? (
          <Descriptions
            column={1}
            data={
              drawerRecord
                ? [
                    { label: "任务名称", value: drawerRecord.name },
                    { label: "区域", value: drawerRecord.area },
                    { label: "Handler", value: drawerRecord.handler },
                    { label: "Cron 表达式", value: drawerRecord.cron },
                    { label: "标签", value: drawerRecord.tags.length > 0 ? drawerRecord.tags.join("、") : "-" },
                    {
                      label: "模块",
                      value:
                        moduleOptions.find((item) => item.value === drawerRecord.module)?.label ??
                        drawerRecord.module ??
                        "-",
                    },
                    { label: "状态", value: drawerRecord.enabled ? "启用" : "禁用" },
                    { label: "超时时间", value: `${drawerRecord.timeoutMs} ms` },
                    { label: "更新时间", value: drawerRecord.updatedAt },
                    { label: "描述", value: drawerRecord.description ?? "-" },
                  ]
                : []
            }
          />
        ) : (
          <Form form={form} layout="vertical">
            {/* 任务名称与 Handler 只在新增时可编辑：编辑接口不支持改这两项 */}
            {drawerMode === "create" && (
              <Form.Item field="name" label="任务名称" rules={[{ required: true, message: "请输入任务名称" }]}>
                <Input placeholder="如：feishu-daily-sync" />
              </Form.Item>
            )}
            {drawerMode === "create" && (
              <Form.Item field="handler" label="Handler" rules={[{ required: true, message: "请输入 handler" }]}>
                <Input placeholder="如：feishu-sync" />
              </Form.Item>
            )}
            <Form.Item field="cron" label="Cron 表达式" rules={[{ required: true, message: "请选择 Cron 表达式" }]}>
              <Select placeholder="选择 Cron 表达式">{renderSelectOptions(cronOptions)}</Select>
            </Form.Item>
            <Form.Item field="tags" label="标签" rules={[{ required: true, message: "请选择标签" }]}>
              <Select placeholder="选择标签">{renderSelectOptions(tagOptions)}</Select>
            </Form.Item>
            <Form.Item field="module" label="模块" rules={[{ required: true, message: "请选择模块" }]}>
              <Select placeholder="选择模块">{renderSelectOptions(moduleOptions)}</Select>
            </Form.Item>
            <Form.Item field="description" label="描述">
              <Input.TextArea placeholder="任务描述（可选）" rows={3} />
            </Form.Item>
          </Form>
        )}
      </Drawer>
    </div>
  );
}
