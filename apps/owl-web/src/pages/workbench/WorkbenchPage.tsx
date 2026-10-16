/**
 * 工作台概览 —— 产品线流水线全局视图（按样板页改造，规范见 docs/frontend-rules.md 第五节）。
 *
 * 结构：概览卡片区（产品线总数 + 各 IPD 阶段计数，仪表盘卡片不属于列表区规则）→
 * 筛选区（关键字 / IPD 阶段 / 生命周期，draft/applied 网格）→ 列表区（Spin 点指示符 +
 * 操作列固定右 + 超长名称截断 + 独立分页）。
 * 无操作行：本页是只读导航列表（新增 / 编辑入口在 IPD 模块），没有批量与行内写操作。
 * 数据来源：GET /ipd/product-lines；阶段计数由当前页数据粗略聚合，仅作导航参考。
 */
import { useCallback, useEffect, useState } from "react";
import { Button, Input, Notification, Pagination, Select, Spin, Table, Tag, Tooltip } from "@arco-design/web-react";
import { IconEye, IconRefresh, IconSearch } from "@arco-design/web-react/icon";
import { useNavigate } from "react-router-dom";
import { get } from "../../api/client";
import {
  IPD_STAGE_LABELS,
  IPD_STAGE_ORDER,
  LIFECYCLE_STAGE_OPTIONS,
  type PageData,
  type ProductLineItem,
  ipdStageLabel,
  lifecycleStageLabel,
} from "../../api/pipeline";

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
// 列宽合计：超过容器宽度就横向滚动，配合 fixed 操作列悬浮。增删列时同步这个值
const TABLE_SCROLL_X = 740;

/** 筛选条件（空串 = 不过滤），对应后端 keyword / ipdStage / lifecycleStage */
interface WorkbenchFilters {
  keyword: string;
  ipdStage: string;
  lifecycleStage: string;
}

const EMPTY_FILTERS: WorkbenchFilters = { keyword: "", ipdStage: "", lifecycleStage: "" };

function statCard(label: string, value: number, accent: string) {
  return (
    <div
      key={label}
      className={`flex flex-col gap-1 rounded-lg border border-gray-100 bg-white p-4 shadow-sm ${accent}`}
    >
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-2xl font-semibold">{value}</span>
    </div>
  );
}

export function WorkbenchPage() {
  const navigate = useNavigate();
  const [list, setList] = useState<ProductLineItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [draft, setDraft] = useState<WorkbenchFilters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<WorkbenchFilters>(EMPTY_FILTERS);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (currentPage: number, size: number, filters: WorkbenchFilters) => {
    setLoading(true);
    try {
      const result = await get<PageData<ProductLineItem>>("/ipd/product-lines", {
        page: currentPage,
        pageSize: size,
        keyword: filters.keyword || undefined,
        ipdStage: filters.ipdStage || undefined,
        lifecycleStage: filters.lifecycleStage || undefined,
      });
      setList(result.list);
      setTotal(result.total);
    } catch (error) {
      Notification.error({ title: "失败", content: error instanceof Error ? error.message : "加载失败" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(page, pageSize, applied);
  }, [page, pageSize, applied, load]);

  const patchDraft = (patch: Partial<WorkbenchFilters>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const handleSearch = () => {
    setApplied({ ...draft, keyword: draft.keyword.trim() });
    setPage(1);
  };

  const handleReset = () => {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
    setPage(1);
  };

  const stageCounts = IPD_STAGE_ORDER.map((stage) => ({
    stage,
    count: list.filter((item) => item.ipdStage === stage).length,
  }));

  const columns = [
    {
      title: "编号",
      dataIndex: "code",
      width: 130,
    },
    {
      title: "名称",
      dataIndex: "name",
      width: 220,
      render: (_: unknown, record: ProductLineItem) => (
        <Tooltip content={record.name}>
          <span
            className="block max-w-[200px] cursor-pointer truncate text-blue-600 hover:underline"
            onClick={() => navigate(`/ipd/product-lines/${record.id}`)}
          >
            {record.name}
          </span>
        </Tooltip>
      ),
    },
    {
      title: "IPD 阶段",
      dataIndex: "ipdStage",
      width: 110,
      render: (_: unknown, record: ProductLineItem) => <Tag color="blue">{ipdStageLabel(record.ipdStage)}</Tag>,
    },
    {
      title: "生命周期",
      dataIndex: "lifecycleStage",
      width: 110,
      render: (_: unknown, record: ProductLineItem) => (
        <Tag color="green">{lifecycleStageLabel(record.lifecycleStage)}</Tag>
      ),
    },
    {
      title: "SPU 数",
      dataIndex: "spuCount",
      width: 90,
    },
    {
      title: "操作",
      dataIndex: "actions",
      width: 80,
      fixed: "right" as const,
      render: (_: unknown, record: ProductLineItem) => (
        <Tooltip content="详情">
          <Button type="text" icon={<IconEye />} onClick={() => navigate(`/ipd/product-lines/${record.id}`)} />
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* 1. 页面标题区 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">工作台</h1>
      </div>

      {/* 概览卡片（仪表盘统计区，不属于列表页的筛选 / 列表规则） */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {statCard("产品线总数", total, "text-gray-800")}
        {stageCounts.map(({ stage, count }) =>
          statCard(IPD_STAGE_LABELS[stage], count, stage === "decision" ? "text-blue-600" : "text-gray-800")
        )}
      </div>

      {/* 2. 筛选区：条件网格，搜索 / 重置 贴在最后一项那一行的最右。无卡片容器 */}
      <div className="grid grid-cols-4 gap-3">
        <Input
          placeholder="名称 / 编号关键字"
          style={{ width: "100%" }}
          value={draft.keyword}
          onChange={(value) => patchDraft({ keyword: value })}
          onPressEnter={handleSearch}
        />
        <Select
          allowClear
          placeholder="IPD 阶段"
          style={{ width: "100%" }}
          value={draft.ipdStage || undefined}
          onChange={(value: string | undefined) => patchDraft({ ipdStage: value ?? "" })}
        >
          {IPD_STAGE_ORDER.map((stage) => (
            <Select.Option key={stage} value={stage}>
              {IPD_STAGE_LABELS[stage]}
            </Select.Option>
          ))}
        </Select>
        <Select
          allowClear
          placeholder="生命周期"
          style={{ width: "100%" }}
          value={draft.lifecycleStage || undefined}
          onChange={(value: string | undefined) => patchDraft({ lifecycleStage: value ?? "" })}
        >
          {LIFECYCLE_STAGE_OPTIONS.map((option) => (
            <Select.Option key={option.value} value={option.value}>
              {option.label}
            </Select.Option>
          ))}
        </Select>
        <div className="col-start-4 flex items-center justify-end gap-2">
          <Tooltip content="搜索">
            <Button type="primary" icon={<IconSearch />} onClick={handleSearch} />
          </Tooltip>
          <Tooltip content="重置">
            <Button icon={<IconRefresh />} onClick={handleReset} />
          </Tooltip>
        </div>
      </div>

      {/* 3. 列表区：无卡片容器 */}
      <div>
        {/* Spin 必须带 block：Arco 的 .arco-spin 是 display:inline-block，会按内容宽度收缩 */}
        <Spin loading={loading} dot block>
          <Table
            rowKey="id"
            columns={columns}
            data={list}
            pagination={false}
            scroll={{ x: TABLE_SCROLL_X }}
            noDataElement={<span className="text-gray-400">暂无产品线，去 IPD 模块创建第一条产品线</span>}
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
    </div>
  );
}
