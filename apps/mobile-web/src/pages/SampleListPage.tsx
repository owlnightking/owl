/**
 * mobile 端列表页样板 —— 新增移动端列表页请以本文件为模板（规范见 docs/frontend-rules.md 第五、九节）。
 *
 * 运行位置：/sample-list。本页是**设计样张**，内置示例数据，打开即可看到标准形态，不依赖任何后端接口。
 *
 * 换成真实页面时只需替换取数与删除两处（文件底部标注了 DEMO 的两个函数）：
 * NavBar、搜索防抖、卡片列表、加载更多、空状态的结构都不用动。
 *
 * 结构：
 *   NavBar（标题 + 右侧 icon 操作）
 *   SearchBar 筛选（输入即时更新，防抖后才发起请求）
 *   卡片列表（标题截断 + 状态 Tag + 时间 + 右侧 icon 操作）
 *   加载更多（移动端用「加载更多」而非分页器）
 *
 * 形态约束：
 *   - 加载中显示骨架屏；追加加载时只禁用按钮，不整页骨架屏
 *   - 尺寸取自 tailwind/mobile.cjs 的 rem 刻度（html font-size 50px），不要写死 px
 *   - 反馈统一用 Toast；删除这类破坏性操作先走 Dialog.confirm
 *   - 破坏性操作用 text-red-500，常规操作 text-gray-400
 */
import { useCallback, useEffect, useState } from "react";
import { Dialog, NavBar, SearchBar, Skeleton, Tag, Toast } from "@arco-design/mobile-react";
import { IconAdd, IconDelete, IconEdit } from "@arco-design/mobile-react/esm/icon";

interface SampleItem {
  id: number;
  name: string;
  status: "enabled" | "disabled";
  createdAt: string;
}

interface SampleItemPage {
  list: SampleItem[];
  pageNum: number;
  pageSize: number;
  total: number;
}

const PAGE_SIZE = 20;
const DEMO_TOTAL = 46;
const DEMO_DELAY_MS = 400;
const SEARCH_DEBOUNCE_MS = 300;

const STATUS_TEXT: Record<SampleItem["status"], string> = { enabled: "启用", disabled: "禁用" };

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[0, 1, 2].map((key) => (
        <div key={key} className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <Skeleton title paragraph={{ rows: 2 }} />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- DEMO 数据源
// 真实页面：删掉本段，改用 apps/mobile-web/src/api/client 的 get / del。
const DEMO_ITEMS: SampleItem[] = Array.from({ length: DEMO_TOTAL }, (_, index) => ({
  id: index + 1,
  name: `示例资源 ${String(index + 1).padStart(2, "0")} · 一个刻意写得很长的名称用来演示截断`,
  status: index % 3 === 0 ? "disabled" : "enabled",
  createdAt: `2026-09-${String((index % 28) + 1).padStart(2, "0")} 10:24:00`,
}));

async function fetchPage(page: number, keyword: string): Promise<SampleItemPage> {
  const filtered = keyword ? DEMO_ITEMS.filter((item) => item.name.includes(keyword)) : DEMO_ITEMS;
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
  const [inputValue, setInputValue] = useState("");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [appending, setAppending] = useState(false);

  const load = useCallback(async (targetPage: number, search: string, append: boolean) => {
    if (append) {
      setAppending(true);
    } else {
      setLoading(true);
    }
    try {
      const result = await fetchPage(targetPage, search);
      setData((prev) => (append ? [...prev, ...result.list] : result.list));
      setTotal(result.total);
      setPage(targetPage);
    } catch {
      Toast.info("加载失败");
    } finally {
      setAppending(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setKeyword(inputValue);
      void load(1, inputValue, false);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [inputValue, load]);

  const handleDelete = (item: SampleItem) => {
    Dialog.confirm({
      title: "删除确认",
      children: `确定删除「${item.name}」？`,
      onOk: async () => {
        try {
          removeItem(item.id);
          Toast.success("删除成功");
          void load(1, keyword, false);
        } catch {
          Toast.info("删除失败");
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-gray-100">
        <NavBar title="示例列表" />
        <div className="px-3 pt-4 pb-20">
          <ListSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gray-100">
      <NavBar
        title="示例列表"
        rightContent={
          <button className="p-1 text-gray-600" onClick={() => Toast.info("新增（示例）")}>
            <IconAdd useCurrentColor />
          </button>
        }
      />
      <div className="px-3 pt-4 pb-20">
        <SearchBar value={inputValue} placeholder="搜索名称" onChange={(_event, value) => setInputValue(value)} />

        <div className="mt-3">
          {data.length === 0 && <div className="py-8 text-center text-sm text-gray-400">暂无数据</div>}

          {data.map((item) => (
            <div key={item.id} className="mb-3 rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between p-3">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-medium text-gray-800">{item.name}</h3>
                  <div className="mt-1 flex items-center gap-2">
                    <Tag color={item.status === "enabled" ? "green" : "red"} size="small">
                      {STATUS_TEXT[item.status]}
                    </Tag>
                    <span className="text-xs text-gray-400">{item.createdAt}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2 pl-2">
                  <button className="p-1 text-gray-400" onClick={() => Toast.info("编辑（示例）")}>
                    <IconEdit useCurrentColor />
                  </button>
                  <button className="p-1 text-red-500" onClick={() => handleDelete(item)}>
                    <IconDelete useCurrentColor />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {data.length > 0 && data.length < total && (
            <button
              className="w-full rounded-lg bg-white py-2 text-sm text-gray-500 shadow-sm"
              disabled={appending}
              onClick={() => void load(page + 1, keyword, true)}
            >
              {appending ? "加载中..." : "加载更多"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
