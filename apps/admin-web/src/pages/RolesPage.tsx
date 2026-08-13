import { useCallback, useEffect, useState } from "react";
import { Button, Form, Input, Message, Modal, Popconfirm, Select, Table, Tag } from "@arco-design/web-react";
import { get, post, put, del } from "../api/client";

interface Permission {
  id: string;
  code: string;
  name: string;
  resource: string;
  action: string;
}

interface RoleItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: Permission[];
}

interface RoleFormValues {
  code?: string;
  name?: string;
  description?: string;
  permissionIds?: string[];
}

export function RolesPage() {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<RoleItem | null>(null);
  const [form] = Form.useForm<RoleFormValues>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [roleList, permList] = await Promise.all([
        get<RoleItem[]>("/roles"),
        get<Permission[]>("/roles/permissions"),
      ]);
      setRoles(roleList);
      setPermissions(permList);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setModalVisible(true);
  };

  const openEdit = (role: RoleItem) => {
    setEditing(role);
    form.setFieldsValue({
      code: role.code,
      name: role.name,
      description: role.description ?? "",
      permissionIds: role.permissions.map((p) => p.id),
    });
    setModalVisible(true);
  };

  const save = async () => {
    const values = await form.validate();
    if (editing) {
      await put<void>(`/roles/${editing.id}`, {
        name: values.name,
        description: values.description,
        permissionIds: values.permissionIds ?? [],
      });
      Message.success("角色已更新");
    } else {
      await post<void>("/roles", {
        code: values.code,
        name: values.name,
        description: values.description,
        permissionIds: values.permissionIds ?? [],
      });
      Message.success("角色已创建");
    }
    setModalVisible(false);
    void load();
  };

  const remove = async (role: RoleItem) => {
    await del<void>(`/roles/${role.id}`);
    Message.success("角色已删除");
    void load();
  };

  const columns = [
    { title: "编码", dataIndex: "code" },
    { title: "名称", dataIndex: "name" },
    { title: "描述", dataIndex: "description", render: (v: string | null) => v ?? "-" },
    {
      title: "类型",
      dataIndex: "isSystem",
      render: (v: boolean) => <Tag color={v ? "gray" : "green"}>{v ? "系统" : "自定义"}</Tag>,
    },
    {
      title: "权限",
      dataIndex: "permissions",
      render: (perms: Permission[]) =>
        perms.length === 0 ? (
          <span className="text-gray-400">无权限</span>
        ) : (
          perms.map((p) => (
            <Tag key={p.id} className="mr-1">
              {p.code}
            </Tag>
          ))
        ),
    },
    {
      title: "操作",
      render: (_: unknown, role: RoleItem) => (
        <div className="space-x-2">
          <Button size="mini" disabled={role.isSystem} onClick={() => openEdit(role)}>
            编辑
          </Button>
          <Popconfirm title={`确认删除角色 ${role.name}？`} onOk={() => remove(role)}>
            <Button size="mini" status="danger" disabled={role.isSystem}>
              删除
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">角色与权限</h2>
        <Button type="primary" onClick={openCreate}>
          新建角色
        </Button>
      </div>
      <Table rowKey="id" loading={loading} columns={columns} data={roles} />
      <Modal
        title={editing ? `编辑角色 - ${editing.name}` : "新建角色"}
        visible={modalVisible}
        onOk={save}
        onCancel={() => setModalVisible(false)}
        unmountOnExit
      >
        <Form form={form} layout="vertical">
          <Form.Item label="编码" field="code" rules={[{ required: true, message: "请输入角色编码" }]}>
            <Input placeholder="如 ops" disabled={Boolean(editing)} />
          </Form.Item>
          <Form.Item label="名称" field="name" rules={[{ required: true, message: "请输入角色名称" }]}>
            <Input placeholder="如 运维" />
          </Form.Item>
          <Form.Item label="描述" field="description">
            <Input.TextArea placeholder="角色说明（可选）" />
          </Form.Item>
          <Form.Item label="权限" field="permissionIds">
            <Select mode="multiple" placeholder="选择权限">
              {permissions.map((p) => (
                <Select.Option key={p.id} value={p.id}>
                  {p.name}（{p.code}）
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
