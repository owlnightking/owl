/**
 * 徽章管理 —— 按 apps/admin-web/src/pages/SampleListPage.tsx 的样板改造（规范见 docs/frontend-rules.md 第五节）。
 *
 * 结构：标题区 → 筛选区（名称关键字 + 搜索/重置贴最后一行最右）→ 操作行（右侧新增，多选后出现批量删除）
 * → 列表区（Spin 点指示符、分页默认 10 条 + 总数 + 每页条数、左端固定「名称」、右端固定「操作」、描述截断）。
 * 新增 / 编辑 / 详情共用右侧抽屉；图标上传继续使用公共组件 ImageUpload。
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
  Skeleton,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
} from "@arco-design/web-react";
import { IconDelete, IconEdit, IconEye, IconPlus, IconRefresh, IconSearch } from "@arco-design/web-react/icon";
import { del, get, post, put } from "../api/client";
import { ImageUpload } from "../components/ImageUpload";

interface BadgeItem {
  id: number;
  name: string;
  icon: string | null;
  description: string | null;
  coinReward: number;
  expReward: number;
  enabled: boolean;
  sortOrder: number;
  createdAt: string;
}

interface BadgePageData {
  list: BadgeItem[];
  pageNum: number;
  pageSize: number;
  total: number;
}

type DrawerMode = "create" | "edit" | "detail";

const DRAWER_TITLE: Record<DrawerMode, string> = { create: "新增徽章", edit: "编辑徽章", detail: "徽章详情" };
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

export function BadgesPage() {
  const [data, setData] = useState<BadgeItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [inputValue, setInputValue] = useState("");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedKeys, setSelectedKeys] = useState<number[]>([]);
  const [drawerMode, setDrawerMode] = useState<DrawerMode | null>(null);
  const [drawerRecord, setDrawerRecord] = useState<BadgeItem | null>(null);
  const [iconUrl, setIconUrl] = useState<string | undefined>(undefined);
  const [form] = Form.useForm();

  const load = useCallback(async (currentPage: number, size: number, search: string) => {
    setLoading(true);
    try {
      const result = await get<BadgePageData>("/recognition/badges", {
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

  const handleSearch = () => {
    setKeyword(inputValue);
    setPage(1);
  };

  const handleReset = () => {
    setInputValue("");
    setKeyword("");
    setPage(1);
  };

  const openDrawer = (mode: DrawerMode, record?: BadgeItem) => {
    setDrawerMode(mode);
    setDrawerRecord(record ?? null);
    if (mode === "detail") {
      return;
    }
    form.resetFields();
    setIconUrl(record?.icon ?? undefined);
    if (record) {
      form.setFieldsValue(record);
    }
  };

  const closeDrawer = () => {
    setDrawerMode(null);
    setDrawerRecord(null);
    setIconUrl(undefined);
  };

  const handleSubmit = async () => {
    const values = await form.validate();
    const payload = { ...values, icon: iconUrl };
    try {
      if (drawerMode === "edit" && drawerRecord) {
        await put(`/recognition/badges/${drawerRecord.id}`, payload);
        Notification.success({ title: "成功", content: "更新成功" });
      } else {
        await post("/recognition/badges", payload);
        Notification.success({ title: "成功", content: "创建成功" });
      }
      closeDrawer();
      void load(page, pageSize, keyword);
    } catch (error) {
      Notification.error({ title: "失败", content: error instanceof Error ? error.message : "保存失败" });
    }
  };

  const removeOne = async (id: number) => {
    try {
      await del(`/recognition/badges/${id}`);
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
      await Promise.all(selectedKeys.map((id) => del<void>(`/recognition/badges/${id}`)));
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
    {
      title: "名称",
      dataIndex: "name",
      fixed: "left" as const,
      width: 160,
      render: (value: string) => (
        <Tooltip content={value}>
          <span className="block max-w-[130px] truncate">{value}</span>
        </Tooltip>
      ),
    },
    {
      title: "图标",
      dataIndex: "icon",
      width: 90,
      render: (value: string | null) => (value ? <img src={value} alt="" className="h-8 w-8" /> : "-"),
    },
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
    { title: "奖励币", dataIndex: "coinReward", width: 100 },
    { title: "奖励经验", dataIndex: "expReward", width: 110 },
    {
      title: "状态",
      dataIndex: "enabled",
      width: 100,
      render: (value: boolean) => <Tag color={value ? "green" : "gray"}>{value ? "启用" : "禁用"}</Tag>,
    },
    { title: "排序", dataIndex: "sortOrder", width: 90 },
    {
      title: "操作",
      dataIndex: "actions",
      fixed: "right" as const,
      width: 140,
      render: (_: unknown, record: BadgeItem) => (
        <Space>
          <Tooltip content="详情">
            <Button type="text" icon={<IconEye />} onClick={() => openDrawer("detail", record)} />
          </Tooltip>
          <Tooltip content="编辑">
            <Button type="text" icon={<IconEdit />} onClick={() => openDrawer("edit", record)} />
          </Tooltip>
          <Tooltip content="删除">
            <Popconfirm className="w-56" title="确认删除该徽章？" onOk={() => removeOne(record.id)}>
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
        <h1 className="text-xl font-semibold text-gray-800">徽章管理</h1>
      </div>

      {/* 2. 筛选区：条件网格 + 搜索/重置贴最后一行最右 */}
      <div className="grid grid-cols-4 gap-3">
        <Input
          placeholder="徽章名称"
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

      {/* 3. 操作行：右侧「新增」；选中后新增前出现「批量删除」 */}
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
            scroll={{ x: 1150 }}
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
        onOk={handleSubmit}
        onCancel={closeDrawer}
      >
        {drawerMode === "detail" ? (
          drawerRecord ? (
            <Descriptions
              column={1}
              data={[
                { label: "名称", value: drawerRecord.name },
                { label: "描述", value: drawerRecord.description ?? "-" },
                { label: "奖励币", value: drawerRecord.coinReward },
                { label: "奖励经验", value: drawerRecord.expReward },
                { label: "状态", value: drawerRecord.enabled ? "启用" : "禁用" },
                { label: "排序", value: drawerRecord.sortOrder },
                {
                  label: "图标",
                  value: drawerRecord.icon ? <img src={drawerRecord.icon} alt="" className="h-10 w-10" /> : "-",
                },
              ]}
            />
          ) : (
            <DetailSkeleton />
          )
        ) : (
          <Form form={form} layout="vertical">
            <Form.Item field="name" label="名称" rules={[{ required: true, message: "请输入徽章名称" }]}>
              <Input placeholder="如 团队之星" />
            </Form.Item>
            <Form.Item label="图标">
              <ImageUpload value={iconUrl} onChange={setIconUrl} />
            </Form.Item>
            <Form.Item field="description" label="描述">
              <Input.TextArea placeholder="徽章说明（可选）" autoSize={{ minRows: 3, maxRows: 6 }} />
            </Form.Item>
            <Form.Item field="coinReward" label="奖励币数" initialValue={0}>
              <Input type="number" />
            </Form.Item>
            <Form.Item field="expReward" label="奖励经验" initialValue={0}>
              <Input type="number" />
            </Form.Item>
            <Form.Item field="sortOrder" label="排序" initialValue={0}>
              <Input type="number" />
            </Form.Item>
          </Form>
        )}
      </Drawer>
    </div>
  );
}
