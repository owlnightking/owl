/**
 * 用户组 Tab —— 用户组 CRUD + 成员管理 + 角色挂钩。
 * 列表结构对齐 SampleListPage（筛选网格 → 操作行 → Spin 列表 + 独立分页 → 右侧抽屉）。
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
  Skeleton,
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
  IconLock,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconUser,
} from "@arco-design/web-react/icon";
import { del, get, post, put } from "../../api/client";
import type {
  RoleOption,
  UserGroupItem,
  UserGroupMemberItem,
  UserGroupMemberPageData,
  UserGroupPageData,
  UserOption,
} from "./types";

type DrawerMode = "create" | "edit" | "detail" | "members" | "roles";

const DRAWER_TITLE: Record<DrawerMode, string> = {
  create: "新增用户组",
  edit: "编辑用户组",
  detail: "用户组详情",
  members: "管理成员",
  roles: "挂钩角色",
};

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
// 列宽合计（含多选列 50）：编码 140 + 名称 140 + 说明 220 + 成员 90 + 角色 220 + 类型 90 + 创建 160 + 操作 190
const TABLE_SCROLL_X = 1300;
/** 系统管理组内不可移除的成员（与后端 UserGroupService 保持一致） */
const PROTECTED_MEMBER_NAMES = new Set(["Calvin"]);

/** 系统组：不可编辑/删除；自定义组仍绑定角色时也不可删 */
function groupEditDisabled(record: UserGroupItem): boolean {
  return record.isSystem;
}

function groupDeleteDisabled(record: UserGroupItem): { disabled: boolean; reason: string } {
  if (record.isSystem) return { disabled: true, reason: "系统用户组不可删除" };
  if (record.roles.length > 0) return { disabled: true, reason: "仍绑定角色，请先解绑" };
  return { disabled: false, reason: "" };
}

interface GroupFormValues {
  code?: string;
  name?: string;
  description?: string;
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton text={{ rows: 2 }} />
      <Skeleton text={{ rows: 3 }} />
    </div>
  );
}

export function UserGroupTab() {
  const [data, setData] = useState<UserGroupItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [inputValue, setInputValue] = useState("");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedKeys, setSelectedKeys] = useState<number[]>([]);
  const [drawerMode, setDrawerMode] = useState<DrawerMode | null>(null);
  const [drawerRecord, setDrawerRecord] = useState<UserGroupItem | null>(null);
  const [form] = Form.useForm<GroupFormValues>();

  // 成员抽屉
  const [memberPage, setMemberPage] = useState(1);
  const [memberPageSize, setMemberPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [members, setMembers] = useState<UserGroupMemberItem[]>([]);
  const [memberTotal, setMemberTotal] = useState(0);
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberIds, setMemberIds] = useState<number[]>([]);
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [memberKeyword, setMemberKeyword] = useState("");

  // 角色抽屉
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);
  const [roleIds, setRoleIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (currentPage: number, size: number, search: string) => {
    setLoading(true);
    try {
      const result = await get<UserGroupPageData>("/user-groups", {
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
    void load(page, pageSize, keyword);
  }, [page, pageSize, keyword, load]);

  useEffect(() => {
    void get<RoleOption[]>("/roles/options")
      .then(setRoleOptions)
      .catch(() => setRoleOptions([]));
  }, []);

  const loadMembers = useCallback(async (groupId: number, currentPage: number, size: number, search: string) => {
    setMemberLoading(true);
    try {
      const result = await get<UserGroupMemberPageData>(`/user-groups/${groupId}/members`, {
        page: currentPage,
        pageSize: size,
        keyword: search || undefined,
      });
      setMembers(result.list);
      setMemberTotal(result.total);
      setMemberIds(result.list.map((item) => item.id));
    } catch (error) {
      Notification.error({ title: "失败", content: error instanceof Error ? error.message : "成员加载失败" });
    } finally {
      setMemberLoading(false);
    }
  }, []);

  const loadUserOptions = useCallback(async (search: string) => {
    try {
      const result = await get<{ list: UserOption[] }>("/users", {
        page: 1,
        pageSize: 50,
        keyword: search || undefined,
      });
      setUserOptions(result.list);
    } catch {
      setUserOptions([]);
    }
  }, []);

  const handleSearch = () => {
    setKeyword(inputValue);
    setPage(1);
  };

  const handleReset = () => {
    setInputValue("");
    setKeyword("");
    setPage(1);
  };

  const openDrawer = (mode: DrawerMode, record?: UserGroupItem) => {
    setDrawerMode(mode);
    setDrawerRecord(record ?? null);
    setSaving(false);
    if (mode === "detail") return;
    if (mode === "members" && record) {
      setMemberPage(1);
      setMemberKeyword("");
      void loadMembers(record.id, 1, DEFAULT_PAGE_SIZE, "");
      void loadUserOptions("");
      return;
    }
    if (mode === "roles" && record) {
      setRoleIds(record.roles.map((item) => item.id));
      return;
    }
    form.resetFields();
    if (record && (mode === "edit" || mode === "create")) {
      form.setFieldsValue({
        code: record.code,
        name: record.name,
        description: record.description ?? "",
      });
    }
  };

  const closeDrawer = () => {
    setDrawerMode(null);
    setDrawerRecord(null);
  };

  const save = async () => {
    const values = await form.validate();
    setSaving(true);
    try {
      if (drawerMode === "edit" && drawerRecord) {
        await put<void>(`/user-groups/${drawerRecord.id}`, {
          name: values.name,
          description: values.description,
        });
        Notification.success({ title: "成功", content: "用户组已更新" });
      } else {
        await post<void>("/user-groups", {
          code: values.code,
          name: values.name,
          description: values.description,
        });
        Notification.success({ title: "成功", content: "用户组已创建" });
      }
      closeDrawer();
      void load(page, pageSize, keyword);
    } catch (error) {
      Notification.error({ title: "失败", content: error instanceof Error ? error.message : "保存失败" });
    } finally {
      setSaving(false);
    }
  };

  const saveMembers = async () => {
    if (!drawerRecord) return;
    setSaving(true);
    try {
      await put<void>(`/user-groups/${drawerRecord.id}/members`, { userIds: memberIds });
      Notification.success({ title: "成功", content: "成员已更新" });
      closeDrawer();
      void load(page, pageSize, keyword);
    } catch (error) {
      Notification.error({ title: "失败", content: error instanceof Error ? error.message : "成员保存失败" });
    } finally {
      setSaving(false);
    }
  };

  const saveRoles = async () => {
    if (!drawerRecord) return;
    setSaving(true);
    try {
      await put<void>(`/user-groups/${drawerRecord.id}/roles`, { roleIds });
      Notification.success({ title: "成功", content: "角色已挂钩" });
      closeDrawer();
      void load(page, pageSize, keyword);
    } catch (error) {
      Notification.error({ title: "失败", content: error instanceof Error ? error.message : "角色保存失败" });
    } finally {
      setSaving(false);
    }
  };

  const removeOne = async (id: number) => {
    try {
      await del<void>(`/user-groups/${id}`);
      Notification.success({ title: "成功", content: "删除成功" });
      setSelectedKeys((prev) => prev.filter((key) => key !== id));
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
    const deletable = selectedKeys.filter((id) => {
      const record = data.find((item) => item.id === id);
      return record ? !groupDeleteDisabled(record).disabled : false;
    });
    if (deletable.length === 0) {
      Notification.warning({ title: "无法删除", content: "选中项均为系统组或仍绑定角色" });
      return;
    }
    try {
      await Promise.all(deletable.map((id) => del<void>(`/user-groups/${id}`)));
      Notification.success({ title: "成功", content: `已删除 ${deletable.length} 项` });
      setSelectedKeys([]);
      setPage(1);
      void load(1, pageSize, keyword);
    } catch (error) {
      Notification.error({ title: "失败", content: error instanceof Error ? error.message : "批量删除失败" });
    }
  };

  const isMemberDrawer = drawerMode === "members";
  const isRolesDrawer = drawerMode === "roles";
  const isFormDrawer = drawerMode === "create" || drawerMode === "edit";

  const columns = [
    { title: "编码", dataIndex: "code", fixed: "left" as const, width: 140 },
    { title: "名称", dataIndex: "name", width: 140 },
    {
      title: "说明",
      dataIndex: "description",
      width: 220,
      render: (value: string | null) =>
        value ? (
          <Tooltip content={value}>
            <span className="block max-w-[200px] truncate">{value}</span>
          </Tooltip>
        ) : (
          "-"
        ),
    },
    { title: "成员", dataIndex: "memberCount", width: 90 },
    {
      title: "角色",
      dataIndex: "roles",
      width: 220,
      render: (items: UserGroupItem["roles"]) =>
        items.length === 0 ? (
          <span className="text-gray-400">未挂钩</span>
        ) : (
          <Space wrap>
            {items.slice(0, 2).map((item) => (
              <Tag key={item.id}>{item.name}</Tag>
            ))}
            {items.length > 2 ? (
              <Tooltip content={items.map((i) => i.name).join("、")}>+{items.length - 2}</Tooltip>
            ) : null}
          </Space>
        ),
    },
    {
      title: "类型",
      dataIndex: "isSystem",
      width: 90,
      render: (value: boolean) => <Tag color={value ? "gray" : "green"}>{value ? "系统" : "自定义"}</Tag>,
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      width: 160,
      render: (value: string) => new Date(value).toLocaleString(),
    },
    {
      title: "操作",
      dataIndex: "actions",
      fixed: "right" as const,
      width: 190,
      render: (_: unknown, record: UserGroupItem) => (
        <Space>
          <Tooltip content="详情">
            <Button type="text" icon={<IconEye />} onClick={() => openDrawer("detail", record)} />
          </Tooltip>
          <Tooltip content="成员">
            <Button type="text" icon={<IconUser />} onClick={() => openDrawer("members", record)} />
          </Tooltip>
          <Tooltip content={record.isSystem ? "系统组不可改角色" : "挂钩角色"}>
            <Button
              type="text"
              icon={<IconLock />}
              disabled={record.isSystem}
              onClick={() => openDrawer("roles", record)}
            />
          </Tooltip>
          <Tooltip content="编辑">
            <Button
              type="text"
              icon={<IconEdit />}
              disabled={groupEditDisabled(record)}
              onClick={() => openDrawer("edit", record)}
            />
          </Tooltip>
          <Tooltip content={groupDeleteDisabled(record).reason || "删除"}>
            <Popconfirm
              className="w-56"
              title="确认删除该用户组？"
              disabled={groupDeleteDisabled(record).disabled}
              onOk={() => removeOne(record.id)}
            >
              <Button
                type="text"
                status="danger"
                icon={<IconDelete />}
                disabled={groupDeleteDisabled(record).disabled}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const memberColumns = [
    {
      title: "姓名",
      dataIndex: "name",
      width: 140,
      render: (value: string) => (
        <span className="inline-flex items-center gap-1">
          {value}
          {PROTECTED_MEMBER_NAMES.has(value) ? <Tag color="blue">固定</Tag> : null}
        </span>
      ),
    },
    {
      title: "邮箱",
      dataIndex: "email",
      width: 200,
      render: (value: string | null) => value ?? "-",
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 90,
      render: (value: string) => (
        <Tag color={value === "active" ? "green" : "gray"}>{value === "active" ? "在职" : value}</Tag>
      ),
    },
    {
      title: "加入时间",
      dataIndex: "joinedAt",
      width: 160,
      render: (value: string) => new Date(value).toLocaleString(),
    },
  ];

  const memberNameById = new Map(userOptions.map((u) => [u.id, u.name]));
  for (const m of members) memberNameById.set(m.id, m.name);

  const handleChangeMembers = (keys: (string | number)[]) => {
    const next = keys as number[];
    const protectedIds = new Set<number>();
    for (const [id, name] of memberNameById) {
      if (PROTECTED_MEMBER_NAMES.has(name)) protectedIds.add(id);
    }
    // 只阻止「取消勾选受保护成员」
    const removedProtected = [...protectedIds].filter((id) => memberIds.includes(id) && !next.includes(id));
    if (removedProtected.length > 0) {
      Notification.warning({ title: "不可移除", content: "系统管理组固定成员不可删除" });
      setMemberIds([...next, ...removedProtected]);
      return;
    }
    setMemberIds(next);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 1. 筛选区 */}
      <div className="grid grid-cols-4 gap-3">
        <Input
          placeholder="编码 / 名称"
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

      {/* 2. 操作行 */}
      <div className="flex items-center justify-end gap-2">
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

      {/* 3. 列表区 */}
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
              checkboxProps: (record: UserGroupItem) => ({
                disabled: groupDeleteDisabled(record).disabled,
              }),
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

      {/* 4. 抽屉：新增 / 编辑 / 详情 / 成员 / 角色 */}
      <Drawer
        visible={drawerMode !== null}
        placement="right"
        width={isMemberDrawer || isRolesDrawer ? 560 : 480}
        title={drawerMode ? DRAWER_TITLE[drawerMode] : ""}
        unmountOnExit
        okText={isMemberDrawer || isRolesDrawer ? "保存" : undefined}
        confirmLoading={saving}
        footer={
          drawerMode === "detail" ? null : isMemberDrawer || isRolesDrawer ? (
            <>
              <Button onClick={closeDrawer} className="mr-2">
                取消
              </Button>
              <Button type="primary" loading={saving} onClick={isMemberDrawer ? saveMembers : saveRoles}>
                保存
              </Button>
            </>
          ) : (
            <>
              <Button onClick={closeDrawer} className="mr-2">
                取消
              </Button>
              <Button type="primary" loading={saving} onClick={save}>
                保存
              </Button>
            </>
          )
        }
        onCancel={closeDrawer}
      >
        {drawerMode === "detail" ? (
          drawerRecord ? (
            <Descriptions
              column={1}
              data={[
                { label: "编码", value: drawerRecord.code },
                { label: "名称", value: drawerRecord.name },
                { label: "说明", value: drawerRecord.description ?? "-" },
                { label: "类型", value: drawerRecord.isSystem ? "系统" : "自定义" },
                { label: "成员数", value: String(drawerRecord.memberCount) },
                {
                  label: "角色",
                  value: drawerRecord.roles.map((item) => item.name).join("、") || "未挂钩",
                },
                { label: "创建时间", value: new Date(drawerRecord.createdAt).toLocaleString() },
              ]}
            />
          ) : (
            <DetailSkeleton />
          )
        ) : isFormDrawer ? (
          <Form form={form} layout="vertical">
            <Form.Item label="编码" field="code" rules={[{ required: true, message: "请输入用户组编码" }]}>
              <Input placeholder="如 finance" disabled={drawerMode === "edit"} />
            </Form.Item>
            <Form.Item label="名称" field="name" rules={[{ required: true, message: "请输入用户组名称" }]}>
              <Input placeholder="如 财务组" />
            </Form.Item>
            <Form.Item label="说明" field="description">
              <Input.TextArea placeholder="用户组说明（可选）" autoSize={{ minRows: 3, maxRows: 6 }} />
            </Form.Item>
          </Form>
        ) : isMemberDrawer ? (
          <div className="flex flex-col gap-3">
            <Input
              placeholder="搜索姓名 / 邮箱后从下方选择"
              allowClear
              value={memberKeyword}
              onChange={(value) => {
                setMemberKeyword(value);
                void loadUserOptions(value);
              }}
            />
            <Select
              mode="multiple"
              placeholder="选择成员（可搜索）"
              style={{ width: "100%" }}
              value={memberIds}
              onChange={handleChangeMembers}
              filterOption={false}
              showSearch
              onSearch={(value) => void loadUserOptions(value)}
              loading={memberLoading}
            >
              {userOptions.map((user) => (
                <Select.Option key={user.id} value={user.id}>
                  {user.name}
                  {user.email ? `（${user.email}）` : ""}
                </Select.Option>
              ))}
            </Select>
            <div className="text-sm font-medium text-gray-800">当前成员</div>
            <Spin loading={memberLoading} dot>
              <Table rowKey="id" columns={memberColumns} data={members} pagination={false} scroll={{ x: 520 }} />
            </Spin>
            <div className="flex justify-end">
              <Pagination
                showTotal={(count) => `共 ${count} 条`}
                total={memberTotal}
                current={memberPage}
                pageSize={memberPageSize}
                sizeCanChange
                sizeOptions={PAGE_SIZE_OPTIONS}
                onChange={(currentPage, currentSize) => {
                  setMemberPage(currentPage);
                  setMemberPageSize(currentSize);
                  if (drawerRecord) void loadMembers(drawerRecord.id, currentPage, currentSize, memberKeyword);
                }}
                onPageSizeChange={(size) => {
                  setMemberPageSize(size);
                  setMemberPage(1);
                  if (drawerRecord) void loadMembers(drawerRecord.id, 1, size, memberKeyword);
                }}
              />
            </div>
          </div>
        ) : isRolesDrawer ? (
          <div className="flex flex-col gap-3">
            <div className="text-sm text-gray-500">为该用户组挂钩角色，成员将继承角色权限。</div>
            <Select
              mode="multiple"
              placeholder="选择角色"
              style={{ width: "100%" }}
              value={roleIds}
              onChange={(keys) => setRoleIds(keys as number[])}
            >
              {roleOptions.map((role) => (
                <Select.Option key={role.id} value={role.id}>
                  {role.name}（{role.code}）
                </Select.Option>
              ))}
            </Select>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
