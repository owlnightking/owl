import { useCallback, useEffect, useState } from "react";
import { Button, Form, Input, Message, Modal, Popconfirm, Space, Table, Tabs, Tag } from "@arco-design/web-react";
import { fetchFieldConfigs, upsertFieldConfig, deleteFieldConfig, type FieldConfigItem } from "../api/field-config";

const CATEGORY_TABS = [
  { key: "scheduler", title: "定时任务" },
  { key: "business", title: "业务前台" },
  { key: "admin", title: "管理后台" },
];

interface OptionItem {
  value: string;
  label?: string;
}

function OptionInput({ value, onChange }: { value: OptionItem[]; onChange: (v: OptionItem[]) => void }) {
  const [inputValue, setInputValue] = useState("");
  const [inputLabel, setInputLabel] = useState("");

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addOption();
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
            <Tag color="arcoblue" className="flex-1">
              {opt.label ?? opt.value}
              {opt.label && <span className="ml-1 text-xs text-gray-400">({opt.value})</span>}
            </Tag>
            <Button size="mini" status="danger" type="text" onClick={() => removeOption(idx)}>
              删除
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FieldConfigPage() {
  const [category, setCategory] = useState("scheduler");
  const [data, setData] = useState<FieldConfigItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<FieldConfigItem | null>(null);
  const [form] = Form.useForm();
  const [options, setOptions] = useState<OptionItem[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const items = await fetchFieldConfigs(category);
      setData(items);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setOptions([]);
    setModalVisible(true);
  };

  const openEdit = (item: FieldConfigItem) => {
    setEditing(item);
    const parsedOptions: OptionItem[] = Array.isArray(item.options)
      ? item.options.map((o) => {
          if (typeof o === "string") return { value: o };
          if (typeof o === "object" && o !== null && "value" in o) {
            return { value: String(o.value), label: "label" in o ? String(o.label) : undefined };
          }
          return { value: String(o) };
        })
      : [];
    setOptions(parsedOptions);
    form.setFieldsValue({
      module: item.module,
      label: item.label,
      description: item.description ?? "",
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    const values = await form.validate();
    try {
      await upsertFieldConfig(category, values.module, {
        label: values.label,
        options: options,
        description: values.description,
      });
      Message.success(editing ? "已更新" : "已创建");
      setModalVisible(false);
      setEditing(null);
      void load();
    } catch (error) {
      Message.error(error instanceof Error ? error.message : "操作失败");
    }
  };

  const handleDelete = async (item: FieldConfigItem) => {
    try {
      await deleteFieldConfig(item.category, item.module);
      Message.success("已删除");
      void load();
    } catch (error) {
      Message.error(error instanceof Error ? error.message : "删除失败");
    }
  };

  const renderOptions = (opts: unknown) => {
    if (!opts || !Array.isArray(opts) || opts.length === 0) {
      return <span className="text-gray-400">-</span>;
    }
    return (
      <div className="flex flex-wrap gap-1">
        {opts.slice(0, 5).map((opt, i) => {
          let displayLabel: string;
          if (typeof opt === "string") {
            displayLabel = opt;
          } else if (typeof opt === "object" && opt !== null && "label" in opt) {
            displayLabel = String(opt.label);
          } else if (typeof opt === "object" && opt !== null && "value" in opt) {
            displayLabel = String(opt.value);
          } else {
            displayLabel = String(opt);
          }
          return (
            <Tag key={i} color="arcoblue">
              {displayLabel}
            </Tag>
          );
        })}
        {opts.length > 5 && <Tag>+{opts.length - 5}</Tag>}
      </div>
    );
  };

  const columns = [
    { title: "模块 (key)", dataIndex: "module" },
    { title: "显示名称", dataIndex: "label" },
    { title: "选项", dataIndex: "options", render: (v: unknown) => renderOptions(v) },
    { title: "描述", dataIndex: "description", render: (v: string | null) => v ?? "-" },
    {
      title: "操作",
      width: 160,
      render: (_: unknown, item: FieldConfigItem) => (
        <Space>
          <Button size="mini" onClick={() => openEdit(item)}>
            编辑
          </Button>
          <Popconfirm title="确认删除此字段配置？" onOk={() => void handleDelete(item)}>
            <Button size="mini" status="danger">
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">字段配置</h2>
        <Button type="primary" onClick={openCreate}>
          新增字段
        </Button>
      </div>

      <Tabs activeTab={category} onChange={setCategory}>
        {CATEGORY_TABS.map((tab) => (
          <Tabs.TabPane key={tab.key} title={tab.title} />
        ))}
      </Tabs>

      <div className="mt-4">
        <Table rowKey="id" loading={loading} columns={columns} data={data} pagination={false} />
      </div>

      <Modal
        title={editing ? `编辑字段 - ${editing.module}` : "新增字段"}
        visible={modalVisible}
        onOk={() => void handleSave()}
        onCancel={() => setModalVisible(false)}
        unmountOnExit
      >
        <Form form={form} layout="vertical">
          <Form.Item
            field="module"
            label="模块 (key)"
            rules={[{ required: true, message: "请输入模块标识" }]}
            disabled={Boolean(editing)}
          >
            <Input placeholder="如：tags、modules、cron" />
          </Form.Item>
          <Form.Item field="label" label="显示名称" rules={[{ required: true, message: "请输入显示名称" }]}>
            <Input placeholder="如：标签、模块、Cron 表达式" />
          </Form.Item>
          <Form.Item label="选项">
            <OptionInput value={options} onChange={setOptions} />
          </Form.Item>
          <Form.Item field="description" label="描述">
            <Input.TextArea placeholder="字段描述（可选）" rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
