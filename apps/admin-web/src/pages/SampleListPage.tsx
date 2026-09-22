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
 * 结构（筛选区与列表区都不要卡片容器：无边框、无圆角、无内边距，直接落在页面背景上）：
 *   1. 页面标题区        h1 text-xl font-semibold
 *   2. 筛选区            条件网格（多列，条件数不限）；「搜索 / 重置」贴在最后一个条件所在行的最右，
 *                        只有该行被填满时才落到下一行最右（用 col-start-<末列号> 实现）
 *   3. 操作行            左侧**分类切换**（页面级小 tab：Tabs type="capsule" size="small"，即点即生效；
 *                        分类由 tab 承担，条件网格里就不再重复放分类），
 *                        右侧靠最右是「新增」；列表选中数据后，在「新增」前多出「导出 / 批量删除」，
 *                        未选中时这两个按钮不显示
 *   4. 列表区            多选表格 + 独立 Pagination
 * 新增 / 编辑 / 详情共用右侧抽屉（Drawer placement="right"）：详情为只读（取数期间骨架屏，取回后用 Descriptions 展示），
 * 新增 / 编辑为可编辑表单。行操作：详情（小眼睛 icon）/ 编辑 / 删除。
 *
 * 筛选条件演示覆盖 5 类控件（网格内 10 个 + 页面级 tab 1 个）：
 *   输入框     名称、编码、备注
 *   多选搜索   负责人（Select mode="multiple"，自带输入搜索）
 *   远程搜索   关联商品（Select showSearch + filterOption={false}，候选由服务端按关键字返回）
 *   树形选择   所属部门（TreeSelect）
 *   时间选择器 创建时间、更新时间（DatePicker.RangePicker）
 *   另有单选下拉：状态、所属模块；单选（Radio.Group）用在新增/编辑抽屉的状态字段
 * 网格内的条件在草稿态（draft）里编辑，点「搜索」才提交为 applied 并重新查询；「重置」同时清空两者。
 *
 * 形态约束：
 *   - 列表加载用 `Spin dot` 指示符，不做整页骨架屏（首次进入也不显示骨架屏）；骨架屏只用于抽屉这类局部内容
 *   - 查询 / 重置 / 翻页 / 新增编辑保存后重新请求列表，都会触发列表的 Spin
 *   - 分页展示总数（`共 N 条`）、可切页、可切换每页条数（切换每页条数后回到第 1 页）
 *   - 列多时横向滚动：`scroll={{ x }}`，左端固定「编码」、右端固定「操作」，滚动时两端始终可见
 *   - 操作列 fixed: "right" + 只有 icon 的按钮 + Tooltip 说明
 *   - 超长文本用定宽 + truncate 截断，Tooltip 悬浮显示全文
 *   - 反馈统一用 Notification（成功 title "成功" / 失败 title "失败"）
 *   - 批量操作按钮随选中状态出现/消失，不留占位
 *
 * 设计 token（颜色/圆角/字号）来自 tailwind/web.cjs，不要在页面里写死颜色或自带 theme。
 */
import { useCallback, useEffect, useState } from "react";
import {
  Button,
  DatePicker,
  Descriptions,
  Drawer,
  Form,
  Input,
  Notification,
  Pagination,
  Popconfirm,
  Radio,
  Select,
  Skeleton,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Tooltip,
  TreeSelect,
} from "@arco-design/web-react";
import {
  IconDelete,
  IconDownload,
  IconEdit,
  IconEye,
  IconPlus,
  IconRefresh,
  IconSearch,
} from "@arco-design/web-react/icon";

type SampleStatus = "enabled" | "disabled";

/** 右侧抽屉的三种用途：新增 / 编辑 / 详情 */
type DrawerMode = "create" | "edit" | "detail";

const DRAWER_TITLE: Record<DrawerMode, string> = { create: "新增", edit: "编辑", detail: "详情" };

interface SampleItem {
  id: number;
  name: string;
  code: string;
  status: SampleStatus;
  priority: string;
  category: string;
  module: string;
  department: string;
  product: string;
  owner: string;
  source: string;
  quantity: number;
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
  category: string;
  module: string;
  department: string;
  product: string;
  owners: string[];
  createdRange: string[];
  updatedRange: string[];
  remark: string;
}

const DEFAULT_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const DEMO_QUANTITY_STEP = 3;
/** 分类 tab 中「全部」的取值 */
const CATEGORY_ALL = "all";
// 列宽合计（含多选列 50）：超过容器宽度就横向滚动，配合 fixed 列实现左右两端悬浮。增删列时同步这个值
const TABLE_SCROLL_X = 2380;
const DEMO_TOTAL = 46;
const DEMO_DELAY_MS = 400;

const STATUS_TEXT: Record<SampleStatus, string> = { enabled: "启用", disabled: "禁用" };
const STATUS_OPTIONS: { label: string; value: SampleFilters["status"] }[] = [
  { label: "全部", value: "all" },
  { label: "启用", value: "enabled" },
  { label: "禁用", value: "disabled" },
];
const CATEGORY_OPTIONS = ["商品", "订单", "用户", "内容"];
/** 页面级 tab 的分类选项：第一项固定「全部」，其余与分类字典一致 */
const CATEGORY_TAB_OPTIONS = [
  { label: "全部", value: CATEGORY_ALL },
  ...CATEGORY_OPTIONS.map((item) => ({ label: item, value: item })),
];
const MODULE_OPTIONS = ["admin", "owl", "cron", "mobile", "portal"];
const OWNER_OPTIONS = ["张三", "李四", "王五", "赵六"];
const PRIORITY_OPTIONS = ["高", "中", "低"];
const PRIORITY_COLOR: Record<string, string> = { 高: "red", 中: "orange", 低: "gray" };
const SOURCE_OPTIONS = ["手动创建", "接口同步", "批量导入"];
// 仅用于示例数据的展示（列表「标签」列），不参与筛选
const DEMO_TAGS = ["重点", "归档", "待审", "内部"];

// TreeSelect 用的部门树。示例里直接把部门名当 key，真实页面一般用 id + labelInValue。
const DEPARTMENT_TREE = [
  {
    key: "总部",
    title: "总部",
    children: [
      {
        key: "技术部",
        title: "技术部",
        children: [
          { key: "前端组", title: "前端组" },
          { key: "后端组", title: "后端组" },
        ],
      },
      { key: "市场部", title: "市场部" },
    ],
  },
  { key: "分部", title: "分部", children: [{ key: "运营组", title: "运营组" }] },
];
const DEPARTMENT_FLAT = ["前端组", "后端组", "市场部", "运营组"];

// 远程搜索：模拟服务端按关键字返回候选（真实页面换成接口调用即可）
const REMOTE_POOL = [
  "云端存储包 100G",
  "云端存储包 500G",
  "云主机 2C4G",
  "云主机 4C8G",
  "云主机 8C16G",
  "数据库实例 基础版",
  "数据库实例 高可用版",
  "CDN 流量包 1T",
  "CDN 流量包 5T",
  "对象存储归档包",
  "短信包 1 万条",
  "短信包 10 万条",
];
const REMOTE_DELAY_MS = 300;
const DETAIL_DELAY_MS = 600;
const REMOTE_DEBOUNCE_MS = 300;
const REMOTE_LIMIT = 8;

async function fetchRemoteOptions(keyword: string): Promise<string[]> {
  await new Promise((resolve) => setTimeout(resolve, REMOTE_DELAY_MS));
  const matched = keyword ? REMOTE_POOL.filter((item) => item.includes(keyword)) : REMOTE_POOL;
  return matched.slice(0, REMOTE_LIMIT);
}

const EMPTY_FILTERS: SampleFilters = {
  name: "",
  code: "",
  status: "all",
  category: CATEGORY_ALL,
  module: "",
  department: "",
  product: "",
  owners: [],
  createdRange: [],
  updatedRange: [],
  remark: "",
};

/** 详情抽屉在取数期间的骨架屏（列表本身不用骨架屏，用 Spin 指示符） */
function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton text={{ rows: 2 }} />
      <Skeleton text={{ rows: 2 }} />
      <Skeleton text={{ rows: 3 }} />
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
    priority: PRIORITY_OPTIONS[index % PRIORITY_OPTIONS.length],
    category: CATEGORY_OPTIONS[index % CATEGORY_OPTIONS.length],
    module: MODULE_OPTIONS[index % MODULE_OPTIONS.length],
    department: DEPARTMENT_FLAT[index % DEPARTMENT_FLAT.length],
    product: REMOTE_POOL[index % REMOTE_POOL.length],
    owner: OWNER_OPTIONS[index % OWNER_OPTIONS.length],
    source: SOURCE_OPTIONS[index % SOURCE_OPTIONS.length],
    quantity: (index + 1) * DEMO_QUANTITY_STEP,
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
    (filters.category === CATEGORY_ALL || item.category === filters.category) &&
    (!filters.module || item.module === filters.module) &&
    (!filters.department || item.department === filters.department) &&
    (!filters.product || item.product === filters.product) &&
    (filters.owners.length === 0 || filters.owners.includes(item.owner)) &&
    (!createdFrom || createdAt >= createdFrom) &&
    (!createdTo || createdAt <= createdTo) &&
    (!updatedFrom || updatedAt >= updatedFrom) &&
    (!updatedTo || updatedAt <= updatedTo) &&
    (!filters.remark || item.remark.includes(filters.remark))
  );
}

async function fetchPage(filters: SampleFilters, page: number, pageSize: number): Promise<SampleItemPage> {
  const filtered = DEMO_ITEMS.filter((item) => matchFilters(item, filters));
  const list = filtered.slice((page - 1) * pageSize, page * pageSize);
  // 留一点延迟，方便观察骨架屏
  await new Promise((resolve) => setTimeout(resolve, DEMO_DELAY_MS));
  return { list, pageNum: page, pageSize, total: filtered.length };
}

function removeItem(id: number): void {
  const index = DEMO_ITEMS.findIndex((item) => item.id === id);
  if (index >= 0) {
    DEMO_ITEMS.splice(index, 1);
  }
}

// 详情单独取数：真实页面这里是 get(`/samples/${id}`)，取数期间抽屉显示骨架屏
async function fetchDetail(id: number): Promise<SampleItem | null> {
  await new Promise((resolve) => setTimeout(resolve, DETAIL_DELAY_MS));
  return DEMO_ITEMS.find((item) => item.id === id) ?? null;
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
  // 远程搜索：输入关键字 → 防抖 → 请求服务端候选（这里用 fetchRemoteOptions 模拟）
  const [remoteKeyword, setRemoteKeyword] = useState("");
  const [remoteOptions, setRemoteOptions] = useState<string[]>([]);
  const [remoteLoading, setRemoteLoading] = useState(false);
  // 表格多选：选中后才出现「导出 / 批量删除」
  const [selectedKeys, setSelectedKeys] = useState<number[]>([]);
  // 右侧抽屉：新增 / 编辑 / 详情共用同一个 Drawer
  const [drawerMode, setDrawerMode] = useState<DrawerMode | null>(null);
  const [drawerRecord, setDrawerRecord] = useState<SampleItem | null>(null);
  // 详情是异步取数，取数期间抽屉里显示骨架屏
  const [detailData, setDetailData] = useState<SampleItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  // 每页条数可选，切换后回到第 1 页
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const load = useCallback(async (currentPage: number, filters: SampleFilters, size: number) => {
    setLoading(true);
    try {
      const result = await fetchPage(filters, currentPage, size);
      setData(result.list);
      setTotal(result.total);
    } catch (error) {
      Notification.error({ title: "失败", content: error instanceof Error ? error.message : "加载失败" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(page, applied, pageSize);
  }, [page, pageSize, applied, load]);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setRemoteLoading(true);
      try {
        const options = await fetchRemoteOptions(remoteKeyword);
        if (!cancelled) {
          setRemoteOptions(options);
        }
      } finally {
        if (!cancelled) {
          setRemoteLoading(false);
        }
      }
    }, REMOTE_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [remoteKeyword]);

  useEffect(() => {
    if (drawerMode !== "detail" || !drawerRecord) {
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    void fetchDetail(drawerRecord.id).then((item) => {
      if (!cancelled) {
        setDetailData(item);
        setDetailLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [drawerMode, drawerRecord]);

  const patchDraft = (patch: Partial<SampleFilters>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const handleSearch = () => {
    setApplied(draft);
    setPage(1);
  };

  // 分类 tab 像标签页一样即点即生效，不需要再点「搜索」
  const handleCategoryChange = (category: string) => {
    setDraft((prev) => ({ ...prev, category }));
    setApplied((prev) => ({ ...prev, category }));
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
      setSelectedKeys((prev) => prev.filter((key) => key !== id));
      Notification.success({ title: "成功", content: "删除成功" });
      // 删掉本页最后一条时回退一页，避免停在空页
      if (data.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        void load(page, applied, pageSize);
      }
    } catch (error) {
      Notification.error({ title: "失败", content: error instanceof Error ? error.message : "删除失败" });
    }
  };

  const handleBulkDelete = async () => {
    try {
      selectedKeys.forEach((id) => removeItem(id));
      Notification.success({ title: "成功", content: `已删除 ${selectedKeys.length} 项` });
      setSelectedKeys([]);
      setPage(1);
      void load(1, applied, pageSize);
    } catch (error) {
      Notification.error({ title: "失败", content: error instanceof Error ? error.message : "批量删除失败" });
    }
  };

  const handleExport = () => {
    Notification.success({ title: "成功", content: `已导出选中 ${selectedKeys.length} 项（示例）` });
  };

  const openDrawer = (mode: DrawerMode, record?: SampleItem) => {
    setDrawerMode(mode);
    setDrawerRecord(record ?? null);
  };

  const closeDrawer = () => {
    setDrawerMode(null);
    setDrawerRecord(null);
  };

  const handleDrawerOk = () => {
    Notification.success({ title: "成功", content: `已保存（${drawerMode === "create" ? "新增" : "编辑"}示例）` });
    closeDrawer();
    void load(page, applied, pageSize);
  };

  const columns = [
    // 左侧固定列必须排在列首（表格库的通用约束），所以把「编码」放在第一列并 fixed: "left"
    { title: "编码", dataIndex: "code", fixed: "left" as const, width: 160 },
    {
      title: "名称",
      dataIndex: "name",
      width: 220,
      render: (text: string) => (
        <Tooltip content={text}>
          <span className="block max-w-[200px] truncate">{text}</span>
        </Tooltip>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 100,
      render: (value: SampleStatus) => <Tag color={value === "enabled" ? "green" : "red"}>{STATUS_TEXT[value]}</Tag>,
    },
    {
      title: "优先级",
      dataIndex: "priority",
      width: 100,
      render: (value: string) => <Tag color={PRIORITY_COLOR[value]}>{value}</Tag>,
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
    { title: "所属模块", dataIndex: "module", width: 120 },
    { title: "所属部门", dataIndex: "department", width: 120 },
    { title: "负责人", dataIndex: "owner", width: 100 },
    { title: "来源", dataIndex: "source", width: 120 },
    { title: "数量", dataIndex: "quantity", width: 100 },
    {
      title: "关联商品",
      dataIndex: "product",
      width: 200,
      render: (text: string) => (
        <Tooltip content={text}>
          <span className="block max-w-[160px] truncate">{text}</span>
        </Tooltip>
      ),
    },
    {
      title: "备注",
      dataIndex: "remark",
      width: 200,
      render: (text: string) => (
        <Tooltip content={text}>
          <span className="block max-w-[160px] truncate">{text}</span>
        </Tooltip>
      ),
    },
    { title: "创建时间", dataIndex: "createdAt", width: 180 },
    { title: "更新时间", dataIndex: "updatedAt", width: 180 },
    {
      title: "操作",
      dataIndex: "actions",
      fixed: "right" as const,
      width: 140,
      render: (_: unknown, record: SampleItem) => (
        <Space>
          <Tooltip content="详情">
            <Button type="text" icon={<IconEye />} onClick={() => openDrawer("detail", record)} />
          </Tooltip>
          <Tooltip content="编辑">
            <Button type="text" icon={<IconEdit />} onClick={() => openDrawer("edit", record)} />
          </Tooltip>
          <Tooltip content="删除">
            <Popconfirm className="w-56" title="确认删除？" onOk={() => handleDelete(record.id)}>
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
        <h1 className="text-xl font-semibold text-gray-800">示例资源</h1>
      </div>

      {/* 2. 筛选区：条件网格，搜索 / 重置 贴在最后一项那一行的最右。无卡片容器 */}
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
        {/* 单选下拉（状态筛选；分类已由页面级 tab 承担，这里不重复放） */}
        <Select
          allowClear
          placeholder="状态"
          style={{ width: "100%" }}
          value={draft.status === "all" ? undefined : draft.status}
          onChange={(value: SampleStatus | undefined) => patchDraft({ status: value ?? "all" })}
        >
          {STATUS_OPTIONS.filter((option) => option.value !== "all").map((option) => (
            <Select.Option key={option.value} value={option.value}>
              {option.label}
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
        {/* 树形选择（TreeSelect） */}
        <TreeSelect
          allowClear
          treeData={DEPARTMENT_TREE}
          placeholder="所属部门"
          style={{ width: "100%" }}
          value={draft.department || undefined}
          onChange={(value: string) => patchDraft({ department: value ?? "" })}
        />
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
        {/* 远程搜索：开启 showSearch + 关掉本地 filterOption，候选由服务端按关键字返回。
              注意已选项一旦不在候选里就只会回显原始 value，真实页面可配合 labelInValue 或把已选项留在候选中。 */}
        <Select
          showSearch
          allowClear
          filterOption={false}
          loading={remoteLoading}
          placeholder="关联商品"
          style={{ width: "100%" }}
          value={draft.product || undefined}
          onChange={(value: string) => patchDraft({ product: value ?? "" })}
          onSearch={(value: string) => setRemoteKeyword(value)}
        >
          {remoteOptions.map((option) => (
            <Select.Option key={option} value={option}>
              {option}
            </Select.Option>
          ))}
        </Select>
        {/* 时间选择器 */}
        <DatePicker.RangePicker
          format="YYYY-MM-DD"
          style={{ width: "100%" }}
          placeholder={["创建开始", "创建结束"]}
          value={draft.createdRange}
          onChange={(dateStrings: string[]) => patchDraft({ createdRange: dateStrings })}
        />
        {/* 时间选择器 */}
        <DatePicker.RangePicker
          format="YYYY-MM-DD"
          style={{ width: "100%" }}
          placeholder={["更新开始", "更新结束"]}
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
        {/* 搜索 / 重置不另起一行：col-start-4 表示落在第 4 列——
              最后一行没填满时与最后一个条件同行、贴该行最右；刚好填满时自动落到下一行最右 */}
        <div className="col-start-4 flex items-center justify-end gap-2">
          <Tooltip content="搜索">
            <Button type="primary" icon={<IconSearch />} onClick={handleSearch} />
          </Tooltip>
          <Tooltip content="重置">
            <Button icon={<IconRefresh />} onClick={handleReset} />
          </Tooltip>
        </div>
      </div>

      {/* 3. 操作行：左侧状态切换（页面级小 tab，点一下立即生效），右侧「新增」；选中列表数据后，新增前多出「导出 / 批量删除」 */}
      <div className="flex items-center gap-2">
        <Tabs
          type="capsule"
          size="small"
          className="w-fit shrink-0"
          activeTab={applied.category}
          onChange={handleCategoryChange}
        >
          {CATEGORY_TAB_OPTIONS.map((option) => (
            <Tabs.TabPane key={option.value} title={option.label} />
          ))}
        </Tabs>
        <div className="ml-auto flex items-center gap-2">
          {selectedKeys.length > 0 && (
            <>
              <Popconfirm className="w-56" title={`确认导出选中的 ${selectedKeys.length} 项？`} onOk={handleExport}>
                <Tooltip content={`导出选中（${selectedKeys.length}）`}>
                  <Button icon={<IconDownload />} />
                </Tooltip>
              </Popconfirm>
              <Popconfirm className="w-56" title={`确认删除选中的 ${selectedKeys.length} 项？`} onOk={handleBulkDelete}>
                <Tooltip content={`批量删除（${selectedKeys.length}）`}>
                  <Button status="danger" icon={<IconDelete />} />
                </Tooltip>
              </Popconfirm>
            </>
          )}
          <Tooltip content="新增">
            <Button icon={<IconPlus />} onClick={() => openDrawer("create")} />
          </Tooltip>
        </div>
      </div>

      {/* 4. 列表区：无卡片容器 */}
      <div>
        {/* 列表加载用 Spin 点指示符，不用骨架屏；查询 / 重置 / 翻页 / 新增编辑保存后重新请求都会走到这里。
            Spin 必须带 block：Arco 的 .arco-spin 是 display:inline-block，会按内容宽度收缩，
            宽表格会被撑出页面、内部横向滚动失效 */}
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
              onChange: (keys) => setSelectedKeys(keys as number[]),
            }}
          />
        </Spin>
        <div className="mt-4 flex justify-end">
          {/* 分页：展示总数、可切页、可切换每页条数（切换后回到第 1 页） */}
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

      {/* 5. 右侧抽屉：新增 / 编辑 / 详情共用，只换标题与可编辑性 */}
      <Drawer
        visible={drawerMode !== null}
        placement="right"
        width={480}
        title={drawerMode ? DRAWER_TITLE[drawerMode] : ""}
        unmountOnExit
        footer={drawerMode === "detail" ? null : undefined}
        onOk={handleDrawerOk}
        onCancel={closeDrawer}
      >
        {drawerMode === "detail" ? (
          // 详情只展示、不可编辑：取数期间骨架屏，取回后用只读的 Descriptions 呈现
          detailLoading || !detailData ? (
            <DetailSkeleton />
          ) : (
            <Descriptions
              column={1}
              data={[
                { label: "名称", value: detailData.name },
                { label: "编码", value: detailData.code },
                { label: "状态", value: STATUS_TEXT[detailData.status] },
                { label: "分类", value: detailData.category },
                { label: "所属模块", value: detailData.module },
                { label: "所属部门", value: detailData.department },
                { label: "关联商品", value: detailData.product },
                { label: "负责人", value: detailData.owner },
                { label: "标签", value: detailData.tags.join("、") },
                { label: "创建时间", value: detailData.createdAt },
                { label: "更新时间", value: detailData.updatedAt },
                { label: "备注", value: detailData.remark },
              ]}
            />
          )
        ) : (
          <Form layout="vertical">
            <Form.Item label="名称">
              <Input placeholder="请输入名称" defaultValue={drawerRecord?.name ?? ""} />
            </Form.Item>
            <Form.Item label="编码">
              <Input placeholder="请输入编码" defaultValue={drawerRecord?.code ?? ""} />
            </Form.Item>
            <Form.Item label="状态">
              <Radio.Group defaultValue={drawerRecord?.status ?? "enabled"}>
                <Radio value="enabled">启用</Radio>
                <Radio value="disabled">禁用</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item label="分类">
              <Select
                allowClear
                placeholder="请选择分类"
                style={{ width: "100%" }}
                defaultValue={drawerRecord?.category}
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <Select.Option key={option} value={option}>
                    {option}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="备注">
              <Input.TextArea
                placeholder="请输入备注"
                autoSize={{ minRows: 3, maxRows: 6 }}
                defaultValue={drawerRecord?.remark ?? ""}
              />
            </Form.Item>
          </Form>
        )}
      </Drawer>
    </div>
  );
}
