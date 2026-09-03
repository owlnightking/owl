import { get, put, del } from "./client";

export interface FieldConfigItem {
  id: string;
  category: string;
  module: string;
  label: string;
  options: unknown;
  value: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function fetchFieldConfigs(category: string): Promise<FieldConfigItem[]> {
  return get<FieldConfigItem[]>(`/field-config/${category}`);
}

export async function fetchFieldConfig(category: string, module: string): Promise<FieldConfigItem> {
  return get<FieldConfigItem>(`/field-config/${category}/${module}`);
}

export async function upsertFieldConfig(
  category: string,
  module: string,
  data: {
    label: string;
    options?: unknown;
    value?: string;
    description?: string;
  }
): Promise<FieldConfigItem> {
  return put<FieldConfigItem>(`/field-config/${category}/${module}`, data);
}

export async function deleteFieldConfig(category: string, module: string): Promise<void> {
  await del(`/field-config/${category}/${module}`);
}
