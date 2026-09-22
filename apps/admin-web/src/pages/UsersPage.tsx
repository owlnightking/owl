/**
 * 用户管理 —— 按 apps/admin-web/src/pages/SampleListPage.tsx 的样板改造（规范见 docs/frontend-rules.md 第五节）。
 *
 * 结构：标题区 → 筛选区（条件网格 + 搜索/重置贴最后一行最右）→ 操作行（右侧刷新）→ 列表区（Spin 加载、
 * 分页默认 10 条 + 总数 + 每页条数、左端固定「姓名」、右端固定「操作」、超长截断）。
 *
 * 接口只支持「列表 / 分配角色 / 启停用」：没有新增、删除与详情接口，因此操作行不放「新增」，
 * 操作列不放「删除」，详情直接展示列表行已有字段（不额外取数，抽屉内也不需要骨架屏）。
 * 编辑（分配角色）与详情共用右侧抽屉。
 */
import { useCallback, useEffect, useState } from "react";
import {
  Avatar,
  Button,
  Descriptions,
  Drawer,
  Form,
  Input,
  Notification,
  Pagination,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
} from "@arco-design/web-react";
import { IconEdit, IconEye, IconLock, IconRefresh, IconSearch, IconUnlock } from "@arco-design/web-react/icon";
import { get, put } from "../api/client";

type UserStatus = "active" | "disabled";

/** 右侧抽屉的两种用途：编辑（分配角色）/ 详情 */
type DrawerMode = "edit" | "detail";

interface UserRole {
  id: number;
  code: string;
  name: string;
}

interface UserItem {
  id: number;
  unionId: string;
  name: string;
  avatarUrl: string | null;
  email: string | null;
  status: UserStatus;
  lastLoginAt: string | null;
  createdAt: string;
  roles: UserRole[];
}

interface UserPageData {
  list: UserItem[];
  pageNum: number;
  pageSize: number;
  total: number;
}

interface RoleOption {
  id: number;
  code: string;
  name: string;
  isSystem: boolean;
}

interface UserFormValues {
  name?: string;
  roleIds?: number[];
}

const DRAWER_TITLE: Record<DrawerMode, string> = { edit: "分配角色", detail: "用户详情" };
const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const STATUS_TEXT: Record<UserStatus, string> = { active: "启用", disabled: "禁用" };
// 列宽合计：姓名 200 + unionId 200 + 邮箱 220 + 角色 220 + 状态 100 + 最近登录时间 180 + 操作 140。增删列时同步
const TABLE_SCROLL_X = 1260;

function formatTime(value: string | null): string {
  return value ? new Date(value).toLocaleString() : "-";
}

export function UsersPage() {
  const [data, setData] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  // draft 是正在输入的关键字，applied 是点过「搜索」后真正生效的关键字
  const [draftKeyword, setDraftKeyword] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);
  const [drawerMode, setDrawerMode] = useState<DrawerMode | null>(null);
  const [drawerRecord, setDrawerRecord] = useState<UserItem | null>(null);
  const [form] = Form.useForm<UserFormValues>();

  const load = useCallback(async (currentPage: number, size: number, search: string) => {
    setLoading(true);
    try {
      const result = await get<UserPageData>("/users", {
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
    void load(page, pageSize, appliedKeyword);
  }, [page, pageSize, appliedKeyword, load]);

  useEffect(() => {
    void get<RoleOption[]>("/roles/options")
      .then(setRoleOptions)
      .catch((error: unknown) => {
        Notification.error({ title: "失败", content: error instanceof Error ? error.message : "角色列表加载失败" });
      });
  }, []);

  const handleSearch = () => {
    setAppliedKeyword(draftKeyword);
    setPage(1);
  };

  const handleReset = () => {
    setDraftKeyword("");
    setAppliedKeyword("");
    setPage(1);
  };

  const openDrawer = (mode: DrawerMode, user: UserItem) => {
    setDrawerMode(mode);
    setDrawerRecord(user);
    if (mode === "detail") {
      return;
    }
    form.resetFields();
    form.setFieldsValue({ name: user.name, roleIds: user.roles.map((role) => role.id) });
  };

  const closeDrawer = () => {
    setDrawerMode(null);
    setDrawerRecord(null);
  };

  const saveRoles = async () => {
    const values = await form.validate();
    if (!drawerRecord) {
      return;
    }
    try {
      await put<void>(`/users/${drawerRecord.id}/roles`, { roleIds: values.roleIds ?? [] });
      Notification.success({ title: "成功", content: "角色已更新" });
      closeDrawer();
      void load(page, pageSize, appliedKeyword);
    } catch (error) {
      Notification.error({ title: "失败", content: error instanceof Error ? error.message : "保存失败" });
    }
  };

  const toggleStatus = async (user: UserItem) => {
    const next: UserStatus = user.status === "active" ? "disabled" : "active";
    try {
      await put<void>(`/users/${user.id}/status`, { status: next });
      Notification.success({ title: "成功", content: next === "active" ? "已启用" : "已禁用" });
      void load(page, pageSize, appliedKeyword);
    } catch (error) {
      Notification.error({ title: "失败", content: error instanceof Error ? error.message : "操作失败" });
    }
  };

  const columns = [
    // 左侧固定列必须排在列首
    {
      title: "姓名",
      dataIndex: "name",
      fixed: "left" as const,
      width: 200,
      render: (_: unknown, record: UserItem) => (
        <div className="flex items-center gap-2">
          <Avatar size={24} shape="circle">
            {record.avatarUrl ? <img src={record.avatarUrl} alt={record.name} /> : record.name?.charAt(0)}
          </Avatar>
          <Tooltip content={record.name}>
            <span className="block max-w-[130px] truncate">{record.name}</span>
          </Tooltip>
        </div>
      ),
    },
    {
      title: "unionId",
      dataIndex: "unionId",
      width: 200,
      render: (value: string) => (
        <Tooltip content={value}>
          <span className="block max-w-[170px] truncate">{value}</span>
        </Tooltip>
      ),
    },
    {
      title: "邮箱",
      dataIndex: "email",
      width: 220,
      render: (value: string | null) =>
        value ? (
          <Tooltip content={value}>
            <span className="block max-w-[190px] truncate">{value}</span>
          </Tooltip>
        ) : (
          "-"
        ),
    },
    {
      title: "角色",
      dataIndex: "roles",
      width: 220,
      render: (roles: UserRole[]) =>
        roles.length === 0 ? (
          <span className="text-gray-400">未分配</span>
        ) : (
          <Space>
            {roles.map((role) => (
              <Tag key={role.id} color="arcoblue">
                {role.name}
              </Tag>
            ))}
          </Space>
        ),
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 100,
      render: (value: UserStatus) => <Tag color={value === "active" ? "green" : "red"}>{STATUS_TEXT[value]}</Tag>,
    },
    {
      title: "最近登录时间",
      dataIndex: "lastLoginAt",
      width: 180,
      render: (value: string | null) => formatTime(value),
    },
    {
      title: "操作",
      dataIndex: "actions",
      fixed: "right" as const,
      width: 140,
      render: (_: unknown, record: UserItem) => (
        <Space>
          <Tooltip content="详情">
            <Button type="text" icon={<IconEye />} onClick={() => openDrawer("detail", record)} />
          </Tooltip>
          <Tooltip content="分配角色">
            <Button type="text" icon={<IconEdit />} onClick={() => openDrawer("edit", record)} />
          </Tooltip>
          {record.status === "active" ? (
            <Tooltip content="禁用">
              <Button type="text" status="danger" icon={<IconLock />} onClick={() => void toggleStatus(record)} />
            </Tooltip>
          ) : (
            <Tooltip content="启用">
              <Button type="text" icon={<IconUnlock />} onClick={() => void toggleStatus(record)} />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* 1. 页面标题区 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">用户管理</h1>
      </div>

      {/* 2. 筛选区：条件网格 + 搜索/重置贴最后一行最右 */}
      <div className="grid grid-cols-4 gap-3">
        <Input
          placeholder="姓名 / 邮箱"
          style={{ width: "100%" }}
          value={draftKeyword}
          onChange={setDraftKeyword}
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

      {/* 3. 操作行：用户没有新增接口，右侧只保留刷新 */}
      <div className="flex items-center justify-end gap-2">
        <Tooltip content="刷新">
          <Button icon={<IconRefresh />} onClick={() => void load(page, pageSize, appliedKeyword)} />
        </Tooltip>
      </div>

      {/* 4. 列表区：Spin 点指示符 + 表格（左右两端固定列） */}
      <div>
        <Spin loading={loading} dot block>
          <Table rowKey="id" columns={columns} data={data} pagination={false} scroll={{ x: TABLE_SCROLL_X }} />
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

      {/* 5. 右侧抽屉：编辑（分配角色）/ 详情共用 */}
      <Drawer
        visible={drawerMode !== null}
        placement="right"
        width={480}
        title={drawerMode ? DRAWER_TITLE[drawerMode] : ""}
        unmountOnExit
        footer={drawerMode === "detail" ? null : undefined}
        onOk={saveRoles}
        onCancel={closeDrawer}
      >
        {drawerMode === "detail" ? (
          // 详情直接用列表行已有字段，没有单独的详情接口
          <Descriptions
            column={1}
            data={[
              { label: "姓名", value: drawerRecord?.name ?? "-" },
              { label: "unionId", value: drawerRecord?.unionId ?? "-" },
              { label: "邮箱", value: drawerRecord?.email ?? "-" },
              {
                label: "状态",
                value: drawerRecord ? STATUS_TEXT[drawerRecord.status] : "-",
              },
              {
                label: "角色",
                value: drawerRecord?.roles.map((role) => role.name).join("、") || "未分配",
              },
              { label: "最近登录时间", value: formatTime(drawerRecord?.lastLoginAt ?? null) },
              { label: "创建时间", value: drawerRecord?.createdAt ?? "-" },
            ]}
          />
        ) : (
          <Form form={form} layout="vertical">
            <Form.Item label="姓名" field="name">
              <Input disabled />
            </Form.Item>
            <Form.Item label="角色" field="roleIds">
              <Select mode="multiple" placeholder="选择角色" style={{ width: "100%" }}>
                {roleOptions.map((role) => (
                  <Select.Option key={role.id} value={role.id}>
                    {role.name}（{role.code}）
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        )}
      </Drawer>
    </div>
  );
}
