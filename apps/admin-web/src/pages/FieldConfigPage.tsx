/**
 * 字段配置 —— 按 apps/admin-web/src/pages/SampleListPage.tsx 的样板改造（规范见 docs/frontend-rules.md 第五节）。
 *
 * 结构：标题区 → 筛选区（关键字 + 搜索/重置贴最后一行最右）→ 操作行（左侧分类胶囊 tab，右侧最右为新增，
 * 多选后出现批量删除）→ 列表区（Spin 点指示符、分页默认 10 条 + 总数 + 每页条数、左端固定「模块」、
 * 右端固定「操作」、超长文本截断）。新增 / 编辑 / 详情共用右侧抽屉，分类切换立即生效并回到第 1 页。
 */
import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Descriptions,
  Drawer,
  Form,
  Input,
  Message,
  Notification,
  Pagination,
  Popconfirm,
  Skeleton,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Tooltip,
} from "@arco-design/web-react";
import { IconDelete, IconEdit, IconEye, IconPlus, IconRefresh, IconSearch } from "@arco-design/web-react/icon";
import {
  fetchFieldConfigs,
  createFieldConfig,
  updateFieldConfig,
  deleteFieldConfig,
  type FieldConfigItem,
} from "../api/field-config";

const CATEGORY_TABS = [
  { key: "scheduler", title: "定时任务" },
  { key: "business", title: "业务前台" },
  { key: "admin", title: "管理后台" },
];

type DrawerMode = "create" | "edit" | "detail";

const DRAWER_TITLE: Record<DrawerMode, string> = { create: "新增字段", edit: "编辑字段", detail: "字段详情" };
const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
// 列宽合计（含多选列 50）：超过容器宽度就横向滚动，配合 fixed 列实现左右两端悬浮。增删列时同步这个值
const TABLE_SCROLL_X = 1090;
const OPTION_TAG_LIMIT = 5;

interface OptionItem {
  value: string;
  label?: string;
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton text={{ rows: 2 }} />
      <Skeleton text={{ rows: 3 }} />
    </div>
  );
}

function OptionInput({ value, onChange }: { value: OptionItem[]; onChange: (v: OptionItem[]) => void }) {
  const [inputValue, setInputValue] = useState("");
  const [inputLabel, setInputLabel] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editLabel, setEditLabel] = useState("");

  const addOption = () => {
    const trimmedValue = inputValue.trim();
    if (!trimmedValue) {
      Message.warning("请输入选项值");
      return;
    }
    if (value.some((o) => o.value === trimmedValue)) {
      Message.warning("选项值已存在");
      return;
    }
    const trimmedLabel = inputLabel.trim();
    onChange([...value, { value: trimmedValue, label: trimmedLabel || undefined }]);
    setInputValue("");
    setInputLabel("");
  };

  const removeOption = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  const startEdit = (idx: number) => {
    setEditingIndex(idx);
    setEditValue(value[idx].value);
    setEditLabel(value[idx].label ?? "");
  };

  const saveEdit = () => {
    if (editingIndex === null) return;
    const trimmedValue = editValue.trim();
    if (!trimmedValue) {
      Message.warning("选项值不能为空");
      return;
    }
    if (value.some((o, i) => i !== editingIndex && o.value === trimmedValue)) {
      Message.warning("选项值已存在");
      return;
    }
    const trimmedLabel = editLabel.trim();
    const updated = value.map((o, i) =>
      i === editingIndex ? { value: trimmedValue, label: trimmedLabel || undefined } : o
    );
    onChange(updated);
    setEditingIndex(null);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addOption();
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveEdit();
    } else if (e.key === "Escape") {
      cancelEdit();
    }
  };

  return (
    <div>
      <div className="mb-2 flex gap-2">
        <Input value={inputValue} onChange={setInputValue} onKeyDown={handleKeyDown} placeholder="选项值 (必填)" />
        <Input value={inputLabel} onChange={setInputLabel} onKeyDown={handleKeyDown} placeholder="显示名 (选填)" />
        <Button type="primary" onClick={addOption}>
          添加
        </Button>
      </div>
      <div className="flex flex-col gap-1">
        {value.map((opt, idx) => (
          <div key={idx} className="flex items-center gap-2">
            {editingIndex === idx ? (
              <>
                <Input
                  value={editValue}
                  onChange={setEditValue}
                  onKeyDown={handleEditKeyDown}
                  placeholder="选项值"
                  className="flex-1"
                />
                <Input
                  value={editLabel}
                  onChange={setEditLabel}
                  onKeyDown={handleEditKeyDown}
                  placeholder="显示名"
                  className="flex-1"
                />
                <Button size="mini" type="primary" onClick={saveEdit}>
                  保存
                </Button>
                <Button size="mini" onClick={cancelEdit}>
                  取消
                </Button>
              </>
            ) : (
              <>
                <Tag color="arcoblue" className="flex-1">
                  {opt.label ?? opt.value}
                  {opt.label && <span className="ml-1 text-xs text-gray-400">({opt.value})</span>}
                </Tag>
                <Button size="mini" type="text" onClick={() => startEdit(idx)}>
                  编辑
                </Button>
                <Button size="mini" status="danger" type="text" onClick={() => removeOption(idx)}>
                  删除
                </Button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/** 列表「选项」列：只展示前若干个，其余折叠成 +N 并用 Tooltip 显示全部 */
function optionLabels(options: unknown): string[] {
  if (!Array.isArray(options)) {
    return [];
  }
  return options.map((opt) => {
    if (typeof opt === "string") {
      return opt;
    }
    if (typeof opt === "object" && opt !== null && "label" in opt) {
      return String(opt.label);
    }
    if (typeof opt === "object" && opt !== null && "value" in opt) {
      return String(opt.value);
    }
    return String(opt);
  });
}

export function FieldConfigPage() {
  const [category, setCategory] = useState(CATEGORY_TABS[0].key);
  const [data, setData] = useState<FieldConfigItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [inputValue, setInputValue] = useState("");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedKeys, setSelectedKeys] = useState<number[]>([]);
  const [drawerMode, setDrawerMode] = useState<DrawerMode | null>(null);
  const [drawerRecord, setDrawerRecord] = useState<FieldConfigItem | null>(null);
  const [form] = Form.useForm();
  const [options, setOptions] = useState<OptionItem[]>([]);

  const load = useCallback(async (currentPage: number, size: number, search: string, currentCategory: string) => {
    setLoading(true);
    try {
      const result = await fetchFieldConfigs({
        category: currentCategory,
        page: currentPage,
        pageSize: size,
        keyword: search || undefined,
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
    void load(page, pageSize, keyword, category);
  }, [page, pageSize, keyword, category, load]);

  const handleSearch = () => {
    setKeyword(inputValue);
    setPage(1);
  };

  const handleReset = () => {
    setInputValue("");
    setKeyword("");
    setPage(1);
  };

  // 分类 tab 即点即生效，不需要再点「搜索」
  const handleCategoryChange = (value: string) => {
    setCategory(value);
    setPage(1);
  };

  const openDrawer = (mode: DrawerMode, record?: FieldConfigItem) => {
    setDrawerMode(mode);
    setDrawerRecord(record ?? null);
    if (mode === "detail") {
      return;
    }
    form.resetFields();
    const parsedOptions: OptionItem[] = Array.isArray(record?.options)
      ? record.options.map((o) => {
          if (typeof o === "string") return { value: o };
          if (typeof o === "object" && o !== null && "value" in o) {
            return { value: String(o.value), label: "label" in o ? String(o.label) : undefined };
          }
          return { value: String(o) };
        })
      : [];
    setOptions(parsedOptions);
    if (record) {
      form.setFieldsValue({
        module: record.module,
        label: record.label,
        description: record.description ?? "",
      });
    }
  };

  const closeDrawer = () => {
    setDrawerMode(null);
    setDrawerRecord(null);
    setOptions([]);
  };

  const handleSave = async () => {
    const values = await form.validate();
    try {
      if (drawerMode === "edit" && drawerRecord) {
        await updateFieldConfig(drawerRecord.id, {
          label: values.label,
          options: options,
          description: values.description,
        });
        Notification.success({ title: "成功", content: "更新成功" });
      } else {
        await createFieldConfig({
          category,
          module: values.module,
          label: values.label,
          options: options,
          description: values.description,
        });
        Notification.success({ title: "成功", content: "创建成功" });
      }
      closeDrawer();
      void load(page, pageSize, keyword, category);
    } catch (error) {
      Notification.error({ title: "失败", content: error instanceof Error ? error.message : "保存失败" });
    }
  };

  const removeOne = async (id: number) => {
    try {
      await deleteFieldConfig(id);
      Notification.success({ title: "成功", content: "删除成功" });
      setSelectedKeys((prev) => prev.filter((key) => key !== id));
      // 删掉本页最后一条时回退一页，避免停在空页
      if (data.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        void load(page, pageSize, keyword, category);
      }
    } catch (error) {
      Notification.error({ title: "失败", content: error instanceof Error ? error.message : "删除失败" });
    }
  };

  const removeSelected = async () => {
    try {
      await Promise.all(selectedKeys.map((id) => deleteFieldConfig(id)));
      Notification.success({ title: "成功", content: `已删除 ${selectedKeys.length} 项` });
      setSelectedKeys([]);
      setPage(1);
      void load(1, pageSize, keyword, category);
    } catch (error) {
      Notification.error({ title: "失败", content: error instanceof Error ? error.message : "批量删除失败" });
    }
  };

  const renderOptions = (opts: unknown) => {
    const labels = optionLabels(opts);
    if (labels.length === 0) {
      return <span className="text-gray-400">-</span>;
    }
    return (
      <div className="flex flex-wrap gap-1">
        {labels.slice(0, OPTION_TAG_LIMIT).map((label, index) => (
          <Tag key={index} color="arcoblue">
            {label}
          </Tag>
        ))}
        {labels.length > OPTION_TAG_LIMIT && (
          <Tooltip content={labels.join("、")}>
            <Tag>+{labels.length - OPTION_TAG_LIMIT}</Tag>
          </Tooltip>
        )}
      </div>
    );
  };

  const columns = [
    // 左侧固定列必须排在列首
    {
      title: "模块 (key)",
      dataIndex: "module",
      fixed: "left" as const,
      width: 180,
      render: (value: string) => (
        <Tooltip content={value}>
          <span className="block max-w-[150px] truncate">{value}</span>
        </Tooltip>
      ),
    },
    {
      title: "显示名称",
      dataIndex: "label",
      width: 180,
      render: (value: string) => (
        <Tooltip content={value}>
          <span className="block max-w-[150px] truncate">{value}</span>
        </Tooltip>
      ),
    },
    { title: "选项", dataIndex: "options", width: 300, render: (value: unknown) => renderOptions(value) },
    {
      title: "描述",
      dataIndex: "description",
      width: 240,
      render: (value: string | null) =>
        value ? (
          <Tooltip content={value}>
            <span className="block max-w-[210px] truncate">{value}</span>
          </Tooltip>
        ) : (
          "-"
        ),
    },
    {
      title: "操作",
      dataIndex: "actions",
      fixed: "right" as const,
      width: 140,
      render: (_: unknown, record: FieldConfigItem) => (
        <Space>
          <Tooltip content="详情">
            <Button type="text" icon={<IconEye />} onClick={() => openDrawer("detail", record)} />
          </Tooltip>
          <Tooltip content="编辑">
            <Button type="text" icon={<IconEdit />} onClick={() => openDrawer("edit", record)} />
          </Tooltip>
          <Tooltip content="删除">
            <Popconfirm className="w-56" title="确认删除该字段配置？" onOk={() => removeOne(record.id)}>
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
        <h1 className="text-xl font-semibold text-gray-800">字段配置</h1>
      </div>

      {/* 2. 筛选区：条件网格 + 搜索/重置贴最后一行最右 */}
      <div className="grid grid-cols-4 gap-3">
        <Input
          placeholder="模块 / 显示名称"
          style={{ width: "100%" }}
          value={inputValue}
          onChange={setInputValue}
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

      {/* 3. 操作行：左侧分类胶囊 tab（即点即生效），右侧最右是「新增」；选中后新增前多出「批量删除」 */}
      <div className="flex items-center gap-2">
        <Tabs
          type="capsule"
          size="small"
          className="w-fit shrink-0"
          activeTab={category}
          onChange={handleCategoryChange}
        >
          {CATEGORY_TABS.map((tab) => (
            <Tabs.TabPane key={tab.key} title={tab.title} />
          ))}
        </Tabs>
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

      {/* 4. 列表区：Spin 点指示符 + 多选表格（左右两端固定列） */}
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
        width={480}
        title={drawerMode ? DRAWER_TITLE[drawerMode] : ""}
        unmountOnExit
        footer={drawerMode === "detail" ? null : undefined}
        onOk={handleSave}
        onCancel={closeDrawer}
      >
        {drawerMode === "detail" ? (
          drawerRecord ? (
            <Descriptions
              column={1}
              data={[
                { label: "分类", value: CATEGORY_TABS.find((tab) => tab.key === drawerRecord.category)?.title ?? "-" },
                { label: "模块 (key)", value: drawerRecord.module },
                { label: "显示名称", value: drawerRecord.label },
                { label: "选项", value: optionLabels(drawerRecord.options).join("、") || "-" },
                { label: "描述", value: drawerRecord.description ?? "-" },
                { label: "创建时间", value: drawerRecord.createdAt },
                { label: "更新时间", value: drawerRecord.updatedAt },
              ]}
            />
          ) : (
            <DetailSkeleton />
          )
        ) : (
          <Form form={form} layout="vertical">
            <Form.Item field="module" label="模块 (key)" rules={[{ required: true, message: "请输入模块标识" }]}>
              <Input placeholder="如：tags、modules、cron" disabled={drawerMode === "edit"} />
            </Form.Item>
            <Form.Item field="label" label="显示名称" rules={[{ required: true, message: "请输入显示名称" }]}>
              <Input placeholder="如：标签、模块、Cron 表达式" />
            </Form.Item>
            <Form.Item label="选项">
              <OptionInput value={options} onChange={setOptions} />
            </Form.Item>
            <Form.Item field="description" label="描述">
              <Input.TextArea placeholder="字段描述（可选）" autoSize={{ minRows: 3, maxRows: 6 }} />
            </Form.Item>
          </Form>
        )}
      </Drawer>
    </div>
  );
}
