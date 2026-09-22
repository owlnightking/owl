export interface SystemConfigItem {
  id: number;
  key: string;
  value: unknown;
  description: string | null;
  updatedAt: Date;
  updatedBy: number | null;
}

export interface SystemConfigRepositoryPort {
  findById(id: number): Promise<SystemConfigItem | null>;
  findByKey(key: string): Promise<SystemConfigItem | null>;
  upsert(key: string, value: unknown, updatedBy?: number, description?: string): Promise<SystemConfigItem>;
  updateById(id: number, value: unknown, updatedBy?: number, description?: string): Promise<SystemConfigItem>;
  deleteById(id: number): Promise<void>;
}

export const SYSTEM_CONFIG_REPOSITORY = Symbol("SYSTEM_CONFIG_REPOSITORY");
export const SYSTEM_CONFIG_SERVICE = Symbol("SYSTEM_CONFIG_SERVICE");
