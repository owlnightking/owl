import { get } from "./client";

export interface FieldConfigItem {
  id: string;
  category: string;
  module: string;
  label: string;
  options: unknown;
  value: string | null;
  description: string | null;
}

export async function fetchFieldConfigs(category: string): Promise<FieldConfigItem[]> {
  return get<FieldConfigItem[]>(`/field-config/${category}`);
}
