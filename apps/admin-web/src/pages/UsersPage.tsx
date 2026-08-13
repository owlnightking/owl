import { useEffect, useMemo, useState } from "react";
import { Button, Message, Modal, Select, Table, Tag, Input } from "@arco-design/web-react";
import { get, put } from "../api/client";

interface UserRole {
  id: string;
  code: string;
  name: string;
}

interface UserItem {
  id: string;
  name: string;
  unionId: string;
  email: string | null;
  status: string;
  lastLoginAt: string | null;
  roles: UserRole[];
}

interface PageData {
  items: UserItem[];
  total: number;
}

interface RoleOption {
  id: string;
  code: string;
  name: string;
  isSystem: boolean;
}

export function UsersPage() {
  const [data, setData] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);
  const [editing, setEditing] = useState<UserItem | null>(null);
  const [editingRoleIds, setEditingRoleIds] = useState<string[]>([]);

  const load = useMemo(
    () => async (p: number, ps: number, kw: string) => {
      setLoading(true);
      try {
        const result = await get<PageData>("/users", { page: p, pageSize: ps, keyword: kw || undefined });
        setData(result.items);
        setTotal(result.total);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void load(page, pageSize, keyword);
  }, [page, pageSize, keyword, load]);

  useEffect(() => {
    void get<RoleOption[]>("/roles").then((roles) => setRoleOptions(roles));
  }, []);

  const openEdit = (user: UserItem) => {
    setEditing(user);
    setEditingRoleIds(user.roles.map((r) => r.id));
  };

  const saveRoles = async () => {
    if (!editing) {
      return;
    }
    await put<void>(`/users/${editing.id}/roles`, { roleIds: editingRoleIds });
    Message.success("角色已更新");
    setEditing(null);
    void load(page, pageSize, keyword);
  };

  const toggleStatus = async (user: UserItem) => {
    const next = user.status === "active" ? "disabled" : "active";
    await put<void>(`/users/${user.id}/status`, { status: next });
    Message.success(`已${next === "active" ? "启用" : "禁用"}`);
    void load(page, pageSize, keyword);
  };

  const columns = [
    { title: "姓名", dataIndex: "name" },
    { title: "unionId", dataIndex: "unionId" },
    { title: "邮箱", dataIndex: "email", render: (v: string | null) => v ?? "-" },
    {
      title: "角色",
      dataIndex: "roles",
      render: (roles: UserRole[]) =>
        roles.length === 0 ? (
          <span className="text-gray-400">未分配</span>
        ) : (
          roles.map((r) => (
            <Tag key={r.id} color="arcoblue" className="mr-1">
              {r.name}
            </Tag>
          ))
        ),
    },
    {
      title: "状态",
      dataIndex: "status",
      render: (v: string) => <Tag color={v === "active" ? "green" : "red"}>{v === "active" ? "启用" : "禁用"}</Tag>,
    },
    {
      title: "操作",
      render: (_: unknown, user: UserItem) => (
        <div className="space-x-2">
          <Button size="mini" onClick={() => openEdit(user)}>
            分配角色
          </Button>
          <Button
            size="mini"
            status={user.status === "active" ? "danger" : "success"}
            onClick={() => toggleStatus(user)}
          >
            {user.status === "active" ? "禁用" : "启用"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">用户管理</h2>
        <Input.Search
          style={{ width: 240 }}
          placeholder="搜索姓名 / 邮箱"
          onSearch={(v) => {
            setKeyword(v);
            setPage(1);
          }}
        />
      </div>
      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        data={data}
        pagination={{
          current: page,
          pageSize,
          total,
          showTotal: true,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
      />
      <Modal
        title={`分配角色 - ${editing?.name ?? ""}`}
        visible={Boolean(editing)}
        onOk={saveRoles}
        onCancel={() => setEditing(null)}
        unmountOnExit
      >
        <Select
          mode="multiple"
          style={{ width: "100%" }}
          placeholder="选择角色"
          value={editingRoleIds}
          onChange={setEditingRoleIds}
        >
          {roleOptions.map((r) => (
            <Select.Option key={r.id} value={r.id}>
              {r.name}（{r.code}）
            </Select.Option>
          ))}
        </Select>
      </Modal>
    </div>
  );
}
