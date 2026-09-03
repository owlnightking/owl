import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Form,
  Input,
  Message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tag,
} from "@arco-design/web-react";
import type { SchedulerConfig } from "../types/scheduler";
import { fetchSchedulers, createScheduler, updateScheduler, deleteScheduler, triggerTask } from "../api/scheduler";
import { fetchFieldConfigs } from "../api/field-config";

interface SelectOption {
  label: string;
  value: string;
}

function parseOptions(raw: unknown): SelectOption[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    if (typeof item === "string") return { label: item, value: item };
    if (typeof item === "object" && item !== null && "label" in item && "value" in item) {
      return { label: String(item.label), value: String(item.value) };
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
  const [loading, setLoading] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [editing, setEditing] = useState<SchedulerConfig | null>(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [triggering, setTriggering] = useState<string | null>(null);

  const [tagOptions, setTagOptions] = useState<SelectOption[]>([]);
  const [moduleOptions, setModuleOptions] = useState<SelectOption[]>([]);
  const [cronOptions, setCronOptions] = useState<SelectOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);

  const loadFieldConfigs = useCallback(async () => {
    setOptionsLoading(true);
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
      Message.error(error instanceof Error ? error.message : "加载字段配置失败");
    } finally {
      setOptionsLoading(false);
    }
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const items = await fetchSchedulers();
      setData(items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFieldConfigs();
    void load();
  }, [loadFieldConfigs]);

  const handleCreate = async () => {
    const values = await createForm.validate();
    try {
      await createScheduler({
        name: values.name,
        area: values.module,
        cron: values.cron,
        handler: values.handler,
        tags: values.tags ? [values.tags] : [],
        module: values.module,
        description: values.description,
      });
      Message.success("任务已创建");
      setCreateVisible(false);
      createForm.resetFields();
      void load();
    } catch (error) {
      Message.error(error instanceof Error ? error.message : "创建失败");
    }
  };

  const openEdit = (config: SchedulerConfig) => {
    setEditing(config);
    editForm.setFieldsValue({
      cron: config.cron,
      description: config.description ?? "",
      tags: config.tags?.[0] ?? "",
      module: config.module,
    });
    setEditVisible(true);
  };

  const handleEdit = async () => {
    if (!editing) return;
    const values = await editForm.validate();
    try {
      await updateScheduler(editing.id, {
        cron: values.cron,
        description: values.description,
        tags: values.tags ? [values.tags] : [],
        module: values.module,
      });
      Message.success("任务已更新");
      setEditVisible(false);
      setEditing(null);
      void load();
    } catch (error) {
      Message.error(error instanceof Error ? error.message : "更新失败");
    }
  };

  const handleDelete = async (config: SchedulerConfig) => {
    try {
      await deleteScheduler(config.id);
      Message.success("已删除");
      void load();
    } catch (error) {
      Message.error(error instanceof Error ? error.message : "删除失败");
    }
  };

  const toggleEnabled = async (config: SchedulerConfig) => {
    await updateScheduler(config.id, { enabled: !config.enabled });
    Message.success(`已${config.enabled ? "禁用" : "启用"}`);
    void load();
  };

  const handleTrigger = async (config: SchedulerConfig) => {
    setTriggering(config.id);
    try {
      await triggerTask(config.area, config.handler);
      Message.success(`${config.name} 已触发执行`);
    } catch (error) {
      Message.error(error instanceof Error ? error.message : "触发失败");
    } finally {
      setTriggering(null);
    }
  };

  const columns = [
    { title: "任务名称", dataIndex: "name" },
    { title: "Handler", dataIndex: "handler" },
    { title: "Cron 表达式", dataIndex: "cron" },
    {
      title: "标签",
      dataIndex: "tags",
      render: (tags: string[]) =>
        tags.length === 0 ? (
          <span className="text-gray-400">-</span>
        ) : (
          tags.map((t) => (
            <Tag key={t} color="arcoblue" className="mr-1">
              {t}
            </Tag>
          ))
        ),
    },
    {
      title: "模块",
      dataIndex: "module",
      render: (v: string | null) => {
        const opt = moduleOptions.find((m) => m.value === v);
        return opt ? <Tag color="green">{opt.label}</Tag> : <span className="text-gray-400">{v ?? "-"}</span>;
      },
    },
    {
      title: "状态",
      dataIndex: "enabled",
      render: (v: boolean, record: SchedulerConfig) => <Switch checked={v} onChange={() => toggleEnabled(record)} />,
    },
    {
      title: "操作",
      width: 260,
      render: (_: unknown, record: SchedulerConfig) => (
        <Space>
          <Button size="mini" onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Button
            size="mini"
            type="primary"
            status="warning"
            loading={triggering === record.id}
            onClick={() => void handleTrigger(record)}
          >
            手动触发
          </Button>
          <Popconfirm title="确认删除此任务？" onOk={() => void handleDelete(record)}>
            <Button size="mini" status="danger">
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (optionsLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spin tip="加载字段配置中..." />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">定时任务列表</h2>
        <Button type="primary" onClick={() => setCreateVisible(true)}>
          新增任务
        </Button>
      </div>
      <Table rowKey="id" loading={loading} columns={columns} data={data} pagination={false} />

      <Modal
        title="新增定时任务"
        visible={createVisible}
        onOk={() => void handleCreate()}
        onCancel={() => setCreateVisible(false)}
        unmountOnExit
      >
        <Form form={createForm} layout="vertical">
          <Form.Item field="name" label="任务名称" rules={[{ required: true, message: "请输入任务名称" }]}>
            <Input placeholder="如：feishu-daily-sync" />
          </Form.Item>
          <Form.Item field="handler" label="Handler" rules={[{ required: true, message: "请输入 handler" }]}>
            <Input placeholder="如：feishu-sync" />
          </Form.Item>
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
      </Modal>

      <Modal
        title={`编辑任务 - ${editing?.name ?? ""}`}
        visible={editVisible}
        onOk={() => void handleEdit()}
        onCancel={() => setEditVisible(false)}
        unmountOnExit
      >
        <Form form={editForm} layout="vertical">
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
      </Modal>
    </div>
  );
}
