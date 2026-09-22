import { get } from "./client";

export interface FieldConfigItem {
  id: number;
  category: string;
  module: string;
  label: string;
  options: unknown;
  value: string | null;
  description: string | null;
}

/** 字段配置选项（不分页）：cron 的任务表单用它渲染动态字段 */
export async function fetchFieldConfigs(category: string): Promise<FieldConfigItem[]> {
  return get<FieldConfigItem[]>("/field-config/options", { category });
}
