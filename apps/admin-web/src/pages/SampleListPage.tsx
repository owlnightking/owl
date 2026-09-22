/**
 * web 端列表页样板 —— 新增列表页请以本文件为模板（规范见 docs/frontend-rules.md 第五节）。
 *
 * 运行位置：管理台「样板页」菜单（/sample-list）。本页是**设计样张**，内置示例数据，
 * 打开即可看到标准形态，不依赖任何后端接口。
 *
 * 换成真实页面时只需替换取数与删除两处（文件底部标注了 DEMO 的两个函数）：
 * 组件的筛选、加载态、分页、删除、骨架屏结构都不用动。
 * 真实取数与错误处理的完整写法见 apps/admin-web/src/pages/MdDocsPage.tsx。
 *
 * 结构固定三段（筛选区与列表区都不要卡片容器：无边框、无圆角、无内边距，直接落在页面背景上）：
 *   1. 页面标题区        h1 text-xl font-semibold
 *   2. 筛选区            左边的条件网格（多列，条件数不限）+ 右下角对齐的「搜索 / 重置 / 新增」icon 按钮
 *   3. 列表区            表格 + 独立 Pagination
 * 另可按需在筛选区与列表区之间插一行**状态切换**（Radio.Group type="button"，像标签页一样即点即生效），
 * 本页就放了这一行。
 *
 * 筛选条件演示覆盖 4 类控件（网格内 8 个 + 状态切换行 1 个）：
 *   输入框     名称、编码、备注
 *   单选       状态（Radio.Group，在状态切换行）
 *   多选搜索   分类、负责人（Select mode="multiple"）
 *   时间选择器 创建时间、更新时间（DatePicker.RangePicker）
 *   另有单选下拉：所属模块
 * 网格内的条件在草稿态（draft）里编辑，点「搜索」才提交为 applied 并重新查询；「重置」同时清空两者。
 *
 * 形态约束：
 *   - 加载中显示整页骨架屏
 *   - 操作列 fixed: "right" + 只有 icon 的按钮 + Tooltip 说明
 *   - 超长文本用定宽 + truncate 截断，Tooltip 悬浮显示全文
 *   - 反馈统一用 Notification（成功 title "成功" / 失败 title "失败"）
 *
 * 设计 token（颜色/圆角/字号）来自 tailwind/web.cjs，不要在页面里写死颜色或自带 theme。
 */
import { useCallback, useEffect, useState } from "react";
import {
  Button,
  DatePicker,
  Input,
  Notification,
  Pagination,
  Popconfirm,
  Radio,
  Select,
  Skeleton,
  Space,
  Table,
  Tag,
  Tooltip,
} from "@arco-design/web-react";
import { IconDelete, IconEdit, IconPlus, IconRefresh, IconSearch } from "@arco-design/web-react/icon";

type SampleStatus = "enabled" | "disabled";

interface SampleItem {
  id: number;
  name: string;
  code: string;
  status: SampleStatus;
  category: string;
  module: string;
  owner: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  remark: string;
}

interface SampleItemPage {
  list: SampleItem[];
  pageNum: number;
  pageSize: number;
  total: number;
}

/** 筛选条件；真实页面把它整体透传给接口即可 */
interface SampleFilters {
  name: string;
  code: string;
  status: SampleStatus | "all";
  categories: string[];
  module: string;
  owners: string[];
  createdRange: string[];
  updatedRange: string[];
  remark: string;
}

const PAGE_SIZE = 20;
const DEMO_TOTAL = 46;
const DEMO_DELAY_MS = 400;

const STATUS_TEXT: Record<SampleStatus, string> = { enabled: "启用", disabled: "禁用" };
const STATUS_OPTIONS: { label: string; value: SampleFilters["status"] }[] = [
  { label: "全部", value: "all" },
  { label: "启用", value: "enabled" },
  { label: "禁用", value: "disabled" },
];
const CATEGORY_OPTIONS = ["商品", "订单", "用户", "内容"];
const MODULE_OPTIONS = ["admin", "owl", "cron", "mobile", "portal"];
const OWNER_OPTIONS = ["张三", "李四", "王五", "赵六"];
// 仅用于示例数据的展示（列表「标签」列），不参与筛选
const DEMO_TAGS = ["重点", "归档", "待审", "内部"];

const EMPTY_FILTERS: SampleFilters = {
  name: "",
  code: "",
  status: "all",
  categories: [],
  module: "",
  owners: [],
  createdRange: [],
  updatedRange: [],
  remark: "",
};

function ListPageSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {/* 标题区 */}
      <Skeleton text={{ rows: 1 }} />
      {/* 筛选区 */}
      <Skeleton text={{ rows: 3 }} />
      {/* 列表区 */}
      <Skeleton text={{ rows: 8 }} />
    </div>
  );
}

// ---------------------------------------------------------------- DEMO 数据源
// 真实页面：删掉本段，改用 apps/admin-web/src/api/client 的 get / del（写法见 MdDocsPage.tsx）。
const DEMO_ITEMS: SampleItem[] = Array.from({ length: DEMO_TOTAL }, (_, index) => {
  const day = String((index % 28) + 1).padStart(2, "0");
  return {
    id: index + 1,
    name: `示例资源 ${String(index + 1).padStart(2, "0")} · 一个刻意写得很长的名称用来演示截断`,
    code: `SAMPLE_${String(index + 1).padStart(3, "0")}`,
    status: index % 3 === 0 ? "disabled" : "enabled",
    category: CATEGORY_OPTIONS[index % CATEGORY_OPTIONS.length],
    module: MODULE_OPTIONS[index % MODULE_OPTIONS.length],
    owner: OWNER_OPTIONS[index % OWNER_OPTIONS.length],
    tags: [DEMO_TAGS[index % DEMO_TAGS.length], DEMO_TAGS[(index + 2) % DEMO_TAGS.length]],
    createdAt: `2026-09-${day} 10:24:00`,
    updatedAt: `2026-10-${day} 18:05:00`,
    remark: `第 ${index + 1} 条示例备注`,
  };
});

function matchFilters(item: SampleItem, filters: SampleFilters): boolean {
  const [createdFrom, createdTo] = filters.createdRange;
  const [updatedFrom, updatedTo] = filters.updatedRange;
  const createdAt = item.createdAt.slice(0, 10);
  const updatedAt = item.updatedAt.slice(0, 10);
  return (
    (!filters.name || item.name.includes(filters.name)) &&
    (!filters.code || item.code.includes(filters.code)) &&
    (filters.status === "all" || item.status === filters.status) &&
    (filters.categories.length === 0 || filters.categories.includes(item.category)) &&
    (!filters.module || item.module === filters.module) &&
    (filters.owners.length === 0 || filters.owners.includes(item.owner)) &&
    (!createdFrom || createdAt >= createdFrom) &&
    (!createdTo || createdAt <= createdTo) &&
    (!updatedFrom || updatedAt >= updatedFrom) &&
    (!updatedTo || updatedAt <= updatedTo) &&
    (!filters.remark || item.remark.includes(filters.remark))
  );
}

async function fetchPage(filters: SampleFilters, page: number): Promise<SampleItemPage> {
  const filtered = DEMO_ITEMS.filter((item) => matchFilters(item, filters));
  const list = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  // 留一点延迟，方便观察骨架屏
  await new Promise((resolve) => setTimeout(resolve, DEMO_DELAY_MS));
  return { list, pageNum: page, pageSize: PAGE_SIZE, total: filtered.length };
}

function removeItem(id: number): void {
  const index = DEMO_ITEMS.findIndex((item) => item.id === id);
  if (index >= 0) {
    DEMO_ITEMS.splice(index, 1);
  }
}
// -----------------------------------------------------------------------------

export function SampleListPage() {
  const [data, setData] = useState<SampleItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  // draft 是正在编辑的条件，applied 是点过「搜索」后真正生效的条件
  const [draft, setDraft] = useState<SampleFilters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<SampleFilters>(EMPTY_FILTERS);

  const load = useCallback(async (currentPage: number, filters: SampleFilters) => {
    setLoading(true);
    try {
      const result = await fetchPage(filters, currentPage);
      setData(result.list);
      setTotal(result.total);
    } catch (error) {
      Notification.error({ title: "失败", content: error instanceof Error ? error.message : "加载失败" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(page, applied);
  }, [page, applied, load]);

  const patchDraft = (patch: Partial<SampleFilters>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const handleSearch = () => {
    setApplied(draft);
    setPage(1);
  };

  // 状态切换行像标签页一样即点即生效，不需要再点「搜索」
  const handleStatusChange = (status: SampleFilters["status"]) => {
    setDraft((prev) => ({ ...prev, status }));
    setApplied((prev) => ({ ...prev, status }));
    setPage(1);
  };

  const handleReset = () => {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
    setPage(1);
  };

  const handleDelete = async (id: number) => {
    try {
      removeItem(id);
      Notification.success({ title: "成功", content: "删除成功" });
      // 删掉本页最后一条时回退一页，避免停在空页
      if (data.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        void load(page, applied);
      }
    } catch (error) {
      Notification.error({ title: "失败", content: error instanceof Error ? error.message : "删除失败" });
    }
  };

  const columns = [
    {
      title: "名称",
      dataIndex: "name",
      render: (text: string) => (
        <Tooltip content={text}>
          <span className="block max-w-[200px] truncate">{text}</span>
        </Tooltip>
      ),
    },
    { title: "编码", dataIndex: "code", width: 140 },
    {
      title: "状态",
      dataIndex: "status",
      width: 100,
      render: (value: SampleStatus) => <Tag color={value === "enabled" ? "green" : "red"}>{STATUS_TEXT[value]}</Tag>,
    },
    {
      title: "分类",
      dataIndex: "category",
      width: 100,
      render: (value: string) => <Tag>{value}</Tag>,
    },
    {
      title: "标签",
      dataIndex: "tags",
      width: 180,
      render: (tags: string[]) => (
        <Space>
          {tags.map((tag) => (
            <Tag key={tag} color="arcoblue">
              {tag}
            </Tag>
          ))}
        </Space>
      ),
    },
    { title: "负责人", dataIndex: "owner", width: 100 },
    {
      title: "备注",
      dataIndex: "remark",
      width: 180,
      render: (text: string) => (
        <Tooltip content={text}>
          <span className="block max-w-[140px] truncate">{text}</span>
        </Tooltip>
      ),
    },
    { title: "创建时间", dataIndex: "createdAt", width: 180 },
    {
      title: "操作",
      dataIndex: "actions",
      fixed: "right" as const,
      width: 120,
      render: (_: unknown, record: SampleItem) => (
        <Space>
          <Tooltip content="编辑">
            <Button type="text" icon={<IconEdit />} />
          </Tooltip>
          <Tooltip content="删除">
            <Popconfirm title="确认删除？" onOk={() => handleDelete(record.id)}>
              <Button type="text" status="danger" icon={<IconDelete />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  if (loading) {
    return <ListPageSkeleton />;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 1. 页面标题区 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">示例资源</h1>
      </div>

      {/* 2. 筛选区：条件网格 + 右下角对齐的按钮组。无卡片容器 */}
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-4 gap-3">
          {/* 输入框 */}
          <Input
            placeholder="名称"
            style={{ width: "100%" }}
            value={draft.name}
            onChange={(value) => patchDraft({ name: value })}
            onPressEnter={handleSearch}
          />
          {/* 输入框 */}
          <Input
            placeholder="编码"
            style={{ width: "100%" }}
            value={draft.code}
            onChange={(value) => patchDraft({ code: value })}
            onPressEnter={handleSearch}
          />
          {/* 多选搜索：mode="multiple" 自带输入搜索 */}
          <Select
            mode="multiple"
            placeholder="分类"
            style={{ width: "100%" }}
            value={draft.categories}
            onChange={(value: string[]) => patchDraft({ categories: value })}
          >
            {CATEGORY_OPTIONS.map((option) => (
              <Select.Option key={option} value={option}>
                {option}
              </Select.Option>
            ))}
          </Select>
          {/* 单选下拉 */}
          <Select
            allowClear
            placeholder="所属模块"
            style={{ width: "100%" }}
            value={draft.module || undefined}
            onChange={(value: string) => patchDraft({ module: value ?? "" })}
          >
            {MODULE_OPTIONS.map((option) => (
              <Select.Option key={option} value={option}>
                {option}
              </Select.Option>
            ))}
          </Select>
          {/* 多选搜索：mode="multiple" 自带输入搜索 */}
          <Select
            mode="multiple"
            placeholder="负责人"
            style={{ width: "100%" }}
            value={draft.owners}
            onChange={(value: string[]) => patchDraft({ owners: value })}
          >
            {OWNER_OPTIONS.map((option) => (
              <Select.Option key={option} value={option}>
                {option}
              </Select.Option>
            ))}
          </Select>
          {/* 时间选择器 */}
          <DatePicker.RangePicker
            format="YYYY-MM-DD"
            style={{ width: "100%" }}
            placeholder={["创建起", "创建止"]}
            value={draft.createdRange}
            onChange={(dateStrings: string[]) => patchDraft({ createdRange: dateStrings })}
          />
          {/* 时间选择器 */}
          <DatePicker.RangePicker
            format="YYYY-MM-DD"
            style={{ width: "100%" }}
            placeholder={["更新起", "更新止"]}
            value={draft.updatedRange}
            onChange={(dateStrings: string[]) => patchDraft({ updatedRange: dateStrings })}
          />
          {/* 输入框 */}
          <Input
            placeholder="备注"
            style={{ width: "100%" }}
            value={draft.remark}
            onChange={(value) => patchDraft({ remark: value })}
            onPressEnter={handleSearch}
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          <Tooltip content="搜索">
            <Button type="primary" icon={<IconSearch />} onClick={handleSearch} />
          </Tooltip>
          <Tooltip content="重置">
            <Button icon={<IconRefresh />} onClick={handleReset} />
          </Tooltip>
          <Tooltip content="新增">
            <Button icon={<IconPlus />} />
          </Tooltip>
        </div>
      </div>

      {/* 3. 状态切换行：位于筛选区与列表区之间，点一下立即生效 */}
      <Radio.Group type="button" value={applied.status} onChange={handleStatusChange}>
        {STATUS_OPTIONS.map((option) => (
          <Radio key={option.value} value={option.value}>
            {option.label}
          </Radio>
        ))}
      </Radio.Group>

      {/* 4. 列表区：无卡片容器 */}
      <div>
        <Table rowKey="id" columns={columns} data={data} pagination={false} />
        <div className="mt-4 flex justify-end">
          <Pagination total={total} current={page} pageSize={PAGE_SIZE} showTotal onChange={setPage} />
        </div>
      </div>
    </div>
  );
}
