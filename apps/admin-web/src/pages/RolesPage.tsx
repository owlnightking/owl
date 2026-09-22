/**
 * 角色与权限 —— 按 apps/admin-web/src/pages/SampleListPage.tsx 的样板改造（规范见 docs/frontend-rules.md 第五节）。
 *
 * 结构：标题区 → 筛选区（条件网格 + 搜索/重置贴最后一行最右）→ 操作行（右侧新增）→ 列表区（Spin 加载、
 * 分页默认 10 条 + 总数 + 每页条数、左端固定「编码」、右端固定「操作」、超长截断）。
 * 新增 / 编辑 / 详情共用右侧抽屉；系统内置角色（isSystem）不可编辑、删除与勾选。
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
import { IconDelete, IconEdit, IconEye, IconPlus, IconRefresh, IconSearch } from "@arco-design/web-react/icon";
import { del, get, post, put } from "../api/client";

interface Permission {
  id: number;
  code: string;
  name: string;
  resource: string;
  action: string;
}

interface RoleItem {
  id: number;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  createdAt: string;
  permissions: Permission[];
}

interface RolePageData {
  list: RoleItem[];
  pageNum: number;
  pageSize: number;
  total: number;
}

interface RoleFormValues {
  code?: string;
  name?: string;
  description?: string;
  permissionIds?: number[];
}

type DrawerMode = "create" | "edit" | "detail";

const DRAWER_TITLE: Record<DrawerMode, string> = { create: "新增角色", edit: "编辑角色", detail: "角色详情" };
const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton text={{ rows: 2 }} />
      <Skeleton text={{ rows: 3 }} />
    </div>
  );
}

export function RolesPage() {
  const [data, setData] = useState<RoleItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [inputValue, setInputValue] = useState("");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<number[]>([]);
  const [drawerMode, setDrawerMode] = useState<DrawerMode | null>(null);
  const [drawerRecord, setDrawerRecord] = useState<RoleItem | null>(null);
  const [form] = Form.useForm<RoleFormValues>();

  const load = useCallback(async (currentPage: number, size: number, search: string) => {
    setLoading(true);
    try {
      const result = await get<RolePageData>("/roles", {
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
    void get<Permission[]>("/roles/permissions")
      .then(setPermissions)
      .catch((error: unknown) => {
        Notification.error({ title: "失败", content: error instanceof Error ? error.message : "权限列表加载失败" });
      });
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

  const openDrawer = (mode: DrawerMode, role?: RoleItem) => {
    setDrawerMode(mode);
    setDrawerRecord(role ?? null);
    if (mode === "detail") {
      return;
    }
    form.resetFields();
    if (role) {
      form.setFieldsValue({
        code: role.code,
        name: role.name,
        description: role.description ?? "",
        permissionIds: role.permissions.map((item) => item.id),
      });
    }
  };

  const closeDrawer = () => {
    setDrawerMode(null);
    setDrawerRecord(null);
  };

  const save = async () => {
    const values = await form.validate();
    try {
      if (drawerMode === "edit" && drawerRecord) {
        await put<void>(`/roles/${drawerRecord.id}`, {
          name: values.name,
          description: values.description,
          permissionIds: values.permissionIds ?? [],
        });
        Notification.success({ title: "成功", content: "角色已更新" });
      } else {
        await post<void>("/roles", {
          code: values.code,
          name: values.name,
          description: values.description,
          permissionIds: values.permissionIds ?? [],
        });
        Notification.success({ title: "成功", content: "角色已创建" });
      }
      closeDrawer();
      void load(page, pageSize, keyword);
    } catch (error) {
      Notification.error({ title: "失败", content: error instanceof Error ? error.message : "保存失败" });
    }
  };

  const removeOne = async (id: number) => {
    try {
      await del<void>(`/roles/${id}`);
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
    try {
      await Promise.all(selectedKeys.map((id) => del<void>(`/roles/${id}`)));
      Notification.success({ title: "成功", content: `已删除 ${selectedKeys.length} 项` });
      setSelectedKeys([]);
      setPage(1);
      void load(1, pageSize, keyword);
    } catch (error) {
      Notification.error({ title: "失败", content: error instanceof Error ? error.message : "批量删除失败" });
    }
  };

  const columns = [
    // 左侧固定列必须排在列首
    { title: "编码", dataIndex: "code", fixed: "left" as const, width: 160 },
    { title: "名称", dataIndex: "name", width: 140 },
    {
      title: "描述",
      dataIndex: "description",
      width: 280,
      render: (value: string | null) =>
        value ? (
          <Tooltip content={value}>
            <span className="block max-w-[240px] truncate">{value}</span>
          </Tooltip>
        ) : (
          "-"
        ),
    },
    {
      title: "类型",
      dataIndex: "isSystem",
      width: 100,
      render: (value: boolean) => <Tag color={value ? "gray" : "green"}>{value ? "系统" : "自定义"}</Tag>,
    },
    {
      title: "权限",
      dataIndex: "permissions",
      width: 320,
      render: (items: Permission[]) =>
        items.length === 0 ? (
          <span className="text-gray-400">无权限</span>
        ) : (
          <Space>
            {items.slice(0, 3).map((item) => (
              <Tag key={item.id}>{item.code}</Tag>
            ))}
            {items.length > 3 ? (
              <Tooltip content={items.map((i) => i.code).join("、")}>+{items.length - 3}</Tooltip>
            ) : null}
          </Space>
        ),
    },
    {
      title: "操作",
      dataIndex: "actions",
      fixed: "right" as const,
      width: 140,
      render: (_: unknown, record: RoleItem) => (
        <Space>
          <Tooltip content="详情">
            <Button type="text" icon={<IconEye />} onClick={() => openDrawer("detail", record)} />
          </Tooltip>
          <Tooltip content="编辑">
            <Button
              type="text"
              icon={<IconEdit />}
              disabled={record.isSystem}
              onClick={() => openDrawer("edit", record)}
            />
          </Tooltip>
          <Tooltip content="删除">
            <Popconfirm className="w-56" title="确认删除该角色？" onOk={() => removeOne(record.id)}>
              <Button type="text" status="danger" icon={<IconDelete />} disabled={record.isSystem} />
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
        <h1 className="text-xl font-semibold text-gray-800">角色与权限</h1>
      </div>

      {/* 2. 筛选区：条件网格 + 搜索/重置贴最后一行最右 */}
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

      {/* 3. 操作行：右侧最右是「新增」；选中后新增前多出「批量删除」 */}
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

      {/* 4. 列表区：Spin 点指示符 + 多选表格（左右两端固定列） */}
      <div>
        <Spin loading={loading} dot block>
          <Table
            rowKey="id"
            columns={columns}
            data={data}
            pagination={false}
            scroll={{ x: 1040 }}
            rowSelection={{
              fixed: true,
              selectedRowKeys: selectedKeys,
              checkboxProps: (record: RoleItem) => ({ disabled: record.isSystem }),
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
        onOk={save}
        onCancel={closeDrawer}
      >
        {drawerMode === "detail" ? (
          drawerRecord ? (
            <Descriptions
              column={1}
              data={[
                { label: "编码", value: drawerRecord.code },
                { label: "名称", value: drawerRecord.name },
                { label: "描述", value: drawerRecord.description ?? "-" },
                { label: "类型", value: drawerRecord.isSystem ? "系统" : "自定义" },
                { label: "权限", value: drawerRecord.permissions.map((item) => item.code).join("、") || "无权限" },
              ]}
            />
          ) : (
            <DetailSkeleton />
          )
        ) : (
          <Form form={form} layout="vertical">
            <Form.Item label="编码" field="code" rules={[{ required: true, message: "请输入角色编码" }]}>
              <Input placeholder="如 ops" disabled={drawerMode === "edit"} />
            </Form.Item>
            <Form.Item label="名称" field="name" rules={[{ required: true, message: "请输入角色名称" }]}>
              <Input placeholder="如 运维" />
            </Form.Item>
            <Form.Item label="描述" field="description">
              <Input.TextArea placeholder="角色说明（可选）" autoSize={{ minRows: 3, maxRows: 6 }} />
            </Form.Item>
            <Form.Item label="权限" field="permissionIds">
              <Select mode="multiple" placeholder="选择权限" style={{ width: "100%" }}>
                {permissions.map((item) => (
                  <Select.Option key={item.id} value={item.id}>
                    {item.name}（{item.code}）
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
