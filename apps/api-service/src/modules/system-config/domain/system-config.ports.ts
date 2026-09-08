export interface SystemConfigItem {
  key: string;
  value: unknown;
  description: string | null;
  updatedAt: Date;
  updatedBy: string | null;
}

export interface SystemConfigRepositoryPort {
  findByKey(key: string): Promise<SystemConfigItem | null>;
  upsert(key: string, value: unknown, updatedBy?: string, description?: string): Promise<SystemConfigItem>;
  delete(key: string): Promise<void>;
}

export const SYSTEM_CONFIG_REPOSITORY = Symbol("SYSTEM_CONFIG_REPOSITORY");
export const SYSTEM_CONFIG_SERVICE = Symbol("SYSTEM_CONFIG_SERVICE");
