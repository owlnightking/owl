/**
 * 用户管理 —— 按 apps/admin-web/src/pages/SampleListPage.tsx 的样板改造（规范见 docs/frontend-rules.md 第五节）。
 *
 * 结构：标题区 → 筛选区（条件网格 + 搜索/重置贴最后一行最右）→ 列表区（Spin 加载、
 * 分页默认 10 条 + 总数 + 每页条数、左端固定「姓名」、右端固定「操作」、超长截断）。
 *
 * 接口只支持「列表 / 用户组 / 启停用」：角色绑定在用户组上（见 user-group 模块），
 * 没有按用户的分配角色接口，也没有新增、删除与详情接口，因此不设操作行，
 * 操作列不放「删除」，详情直接展示列表行已有字段（不额外取数，抽屉内也不需要骨架屏）。
 * 别称与部门来自飞书同步（feishu-sync）；离职人员同步后软删，不出现在本列表。
 */
import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Descriptions,
  Drawer,
  Input,
  Notification,
  Pagination,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
} from "@arco-design/web-react";
import { IconEye, IconLock, IconRefresh, IconSearch, IconUnlock } from "@arco-design/web-react/icon";
import { get, put } from "../api/client";
import { PersonName } from "../components/PersonName";

type UserStatus = "active" | "disabled";

interface UserGroupBrief {
  id: number;
  code: string;
  name: string;
}

interface UserDepartmentBrief {
  id: number;
  name: string;
  path: string;
}

interface UserItem {
  id: number;
  unionId: string;
  name: string;
  nickname: string | null;
  avatarUrl: string | null;
  email: string | null;
  status: UserStatus;
  department: UserDepartmentBrief | null;
  lastLoginAt: string | null;
  createdAt: string;
  groups: UserGroupBrief[];
}

interface UserPageData {
  list: UserItem[];
  pageNum: number;
  pageSize: number;
  total: number;
}

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const STATUS_TEXT: Record<UserStatus, string> = { active: "启用", disabled: "禁用" };
// 列宽合计：姓名 160 + 别称 100 + 部门 180 + unionId 180 + 邮箱 200 + 用户组 180 + 状态 90 + 最近登录 160 + 操作 140。增删列时同步
const TABLE_SCROLL_X = 1390;

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
  const [drawerRecord, setDrawerRecord] = useState<UserItem | null>(null);

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

  const handleSearch = () => {
    setAppliedKeyword(draftKeyword);
    setPage(1);
  };

  const handleReset = () => {
    setDraftKeyword("");
    setAppliedKeyword("");
    setPage(1);
  };

  const openDetail = (user: UserItem) => {
    setDrawerRecord(user);
  };

  const closeDrawer = () => {
    setDrawerRecord(null);
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
      width: 160,
      render: (_: unknown, record: UserItem) => (
        <Tooltip content={record.name}>
          <PersonName name={record.name} avatarUrl={record.avatarUrl} className="max-w-[110px]" />
        </Tooltip>
      ),
    },
    {
      title: "别称",
      dataIndex: "nickname",
      width: 100,
      render: (value: string | null) =>
        value ? (
          <Tooltip content={value}>
            <span className="block max-w-[80px] truncate">{value}</span>
          </Tooltip>
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
    {
      title: "部门",
      dataIndex: "department",
      width: 180,
      render: (department: UserDepartmentBrief | null) =>
        department ? (
          <Tooltip content={department.path}>
            <span className="block max-w-[160px] truncate">{department.path}</span>
          </Tooltip>
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
    {
      title: "unionId",
      dataIndex: "unionId",
      width: 180,
      render: (value: string) => (
        <Tooltip content={value}>
          <span className="block max-w-[160px] truncate">{value}</span>
        </Tooltip>
      ),
    },
    {
      title: "邮箱",
      dataIndex: "email",
      width: 200,
      render: (value: string | null) =>
        value ? (
          <Tooltip content={value}>
            <span className="block max-w-[180px] truncate">{value}</span>
          </Tooltip>
        ) : (
          "-"
        ),
    },
    {
      title: "用户组",
      dataIndex: "groups",
      width: 180,
      render: (groups: UserGroupBrief[]) =>
        groups.length === 0 ? (
          <span className="text-gray-400">未分配</span>
        ) : (
          <Space>
            {groups.map((group) => (
              <Tag key={group.id} color="arcoblue">
                {group.name}
              </Tag>
            ))}
          </Space>
        ),
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 90,
      render: (value: UserStatus) => <Tag color={value === "active" ? "green" : "red"}>{STATUS_TEXT[value]}</Tag>,
    },
    {
      title: "最近登录时间",
      dataIndex: "lastLoginAt",
      width: 160,
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
            <Button type="text" icon={<IconEye />} onClick={() => openDetail(record)} />
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
          placeholder="姓名 / 别称 / 邮箱"
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

      {/* 3. 列表区：Spin 点指示符 + 表格（左右两端固定列） */}
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

      {/* 5. 右侧抽屉：详情（直接用列表行已有字段，没有单独的详情接口） */}
      <Drawer
        visible={drawerRecord !== null}
        placement="right"
        width={480}
        title="用户详情"
        unmountOnExit
        footer={null}
        onCancel={closeDrawer}
      >
        <Descriptions
          column={1}
          data={[
            { label: "姓名", value: <PersonName name={drawerRecord?.name} avatarUrl={drawerRecord?.avatarUrl} /> },
            { label: "别称", value: drawerRecord?.nickname ?? "-" },
            { label: "部门", value: drawerRecord?.department?.path ?? "-" },
            { label: "unionId", value: drawerRecord?.unionId ?? "-" },
            { label: "邮箱", value: drawerRecord?.email ?? "-" },
            {
              label: "状态",
              value: drawerRecord ? STATUS_TEXT[drawerRecord.status] : "-",
            },
            {
              label: "用户组",
              value: drawerRecord?.groups.map((group) => group.name).join("、") || "未分配",
            },
            { label: "最近登录时间", value: formatTime(drawerRecord?.lastLoginAt ?? null) },
            { label: "创建时间", value: drawerRecord?.createdAt ?? "-" },
          ]}
        />
      </Drawer>
    </div>
  );
}
