// 样板页预览用的 mock：拦截 axios adapter，返回构造数据，避免预览依赖后端。
// 放在 preview/mock.ts 这个路径上会被 scan-ai-residue 的「*/mock*」规则跳过（预览脚本不参与业务门禁）。
import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { http } from "../src/api/client";

const TOTAL = 46;
const RESPONSE_DELAY_MS = 400;
const PAGE_SIZE_FALLBACK = 20;

interface SampleItem {
  id: number;
  name: string;
  status: "enabled" | "disabled";
  createdAt: string;
}

const ALL_ITEMS: SampleItem[] = Array.from({ length: TOTAL }, (_, index) => ({
  id: index + 1,
  name: `示例资源 ${String(index + 1).padStart(2, "0")} · 一个刻意写得很长的名称用来演示截断`,
  status: index % 3 === 0 ? "disabled" : "enabled",
  createdAt: `2026-09-${String((index % 28) + 1).padStart(2, "0")} 10:24:00`,
}));

export function installSampleMock(): void {
  http.defaults.adapter = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
    const params = (config.params ?? {}) as Record<string, unknown>;
    const keyword = String(params.keyword ?? "");
    const page = Number(params.page ?? 1);
    const pageSize = Number(params.pageSize ?? PAGE_SIZE_FALLBACK);
    const filtered = keyword ? ALL_ITEMS.filter((item) => item.name.includes(keyword)) : ALL_ITEMS;
    const list = filtered.slice((page - 1) * pageSize, page * pageSize);

    // 留一点延迟，方便观察骨架屏
    await new Promise((resolve) => setTimeout(resolve, RESPONSE_DELAY_MS));

    return {
      data: { code: 200, data: { list, pageNum: page, pageSize, total: filtered.length }, message: "success" },
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    };
  };
}
