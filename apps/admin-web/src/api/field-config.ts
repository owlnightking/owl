import { get, post, put, del } from "./client";

export interface FieldConfigItem {
  id: number;
  category: string;
  module: string;
  label: string;
  options: unknown;
  value: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FieldConfigPageData {
  list: FieldConfigItem[];
  pageNum: number;
  pageSize: number;
  total: number;
}

/** 字段配置分页列表 */
export async function fetchFieldConfigs(params: {
  category: string;
  page: number;
  pageSize: number;
  keyword?: string;
}): Promise<FieldConfigPageData> {
  return get<FieldConfigPageData>("/field-config", { ...params });
}

export async function fetchFieldConfig(id: number): Promise<FieldConfigItem> {
  return get<FieldConfigItem>(`/field-config/${id}`);
}

export async function createFieldConfig(data: {
  category: string;
  module: string;
  label: string;
  options?: unknown;
  value?: string;
  description?: string;
}): Promise<FieldConfigItem> {
  return post<FieldConfigItem>("/field-config", data);
}

export async function updateFieldConfig(
  id: number,
  data: {
    label: string;
    options?: unknown;
    value?: string;
    description?: string;
  }
): Promise<FieldConfigItem> {
  return put<FieldConfigItem>(`/field-config/${id}`, data);
}

export async function deleteFieldConfig(id: number): Promise<void> {
  await del(`/field-config/${id}`);
}
