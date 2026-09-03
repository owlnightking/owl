export interface FieldConfigItem {
  id: string;
  category: string;
  module: string;
  label: string;
  options: unknown;
  value: string | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FieldConfigRepositoryPort {
  findByCategory(category: string): Promise<FieldConfigItem[]>;
  findByCategoryAndModule(category: string, module: string): Promise<FieldConfigItem | null>;
  upsert(data: {
    category: string;
    module: string;
    label: string;
    options?: unknown;
    value?: string;
    description?: string;
  }): Promise<FieldConfigItem>;
  deleteByKey(category: string, module: string): Promise<void>;
}

export interface FieldConfigService {
  listByCategory(category: string): Promise<FieldConfigItem[]>;
  getByCategoryAndModule(category: string, module: string): Promise<FieldConfigItem | null>;
  upsert(data: {
    category: string;
    module: string;
    label: string;
    options?: unknown;
    value?: string;
    description?: string;
  }): Promise<FieldConfigItem>;
  deleteByKey(category: string, module: string): Promise<void>;
}

export const FIELD_CONFIG_REPOSITORY = Symbol("FIELD_CONFIG_REPOSITORY");
export const FIELD_CONFIG_SERVICE = Symbol("FIELD_CONFIG_SERVICE");
