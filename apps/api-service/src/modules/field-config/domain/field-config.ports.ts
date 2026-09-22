export interface FieldConfigItem {
  id: number;
  category: string;
  module: string;
  label: string;
  options: unknown;
  value: string | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FieldConfigUpsertInput {
  category: string;
  module: string;
  label: string;
  options?: unknown;
  value?: string;
  description?: string;
}

export interface FieldConfigUpdateInput {
  label: string;
  options?: unknown;
  value?: string;
  description?: string;
}

export interface FieldConfigQuery {
  category: string;
  page: number;
  pageSize: number;
  keyword?: string;
}

export interface FieldConfigRepositoryPort {
  list(query: FieldConfigQuery): Promise<{ items: FieldConfigItem[]; total: number }>;
  findById(id: number): Promise<FieldConfigItem | null>;
  findByCategory(category: string): Promise<FieldConfigItem[]>;
  findByCategoryAndModule(category: string, module: string): Promise<FieldConfigItem | null>;
  upsert(data: FieldConfigUpsertInput): Promise<FieldConfigItem>;
  updateById(id: number, data: FieldConfigUpdateInput): Promise<FieldConfigItem>;
  deleteById(id: number): Promise<void>;
}

export interface FieldConfigServicePort {
  list(query: FieldConfigQuery): Promise<{ items: FieldConfigItem[]; total: number }>;
  /** 下拉/选项用的全量列表（不分页） */
  listOptions(category: string): Promise<FieldConfigItem[]>;
  getById(id: number): Promise<FieldConfigItem>;
  upsert(data: FieldConfigUpsertInput): Promise<FieldConfigItem>;
  updateById(id: number, data: FieldConfigUpdateInput): Promise<FieldConfigItem>;
  deleteById(id: number): Promise<void>;
}

export const FIELD_CONFIG_REPOSITORY = Symbol("FIELD_CONFIG_REPOSITORY");
export const FIELD_CONFIG_SERVICE = Symbol("FIELD_CONFIG_SERVICE");
