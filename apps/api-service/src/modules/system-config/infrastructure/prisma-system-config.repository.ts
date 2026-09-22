import { Inject, Injectable, Logger } from "@nestjs/common";
import { DATABASE_CLIENT } from "@owl/database/provider";
import type { PrismaClient, Prisma } from "@owl/database";
import Redis from "ioredis";
import { ConfigService } from "@nestjs/config";
import type { SystemConfigItem, SystemConfigRepositoryPort } from "../domain/system-config.ports";

const CACHE_TTL_SECONDS = 300;
const CACHE_PREFIX = "owl:syscfg:";

@Injectable()
export class PrismaSystemConfigRepository implements SystemConfigRepositoryPort {
  private readonly logger = new Logger(PrismaSystemConfigRepository.name);
  private readonly redis: Redis;

  constructor(
    @Inject(DATABASE_CLIENT) private readonly prisma: PrismaClient,
    config: ConfigService
  ) {
    this.redis = new Redis({
      host: config.get<string>("REDIS_HOST") ?? "localhost",
      port: Number(config.get<string>("REDIS_PORT") ?? 6379),
      password: config.get<string>("REDIS_PASSWORD") ?? undefined,
      lazyConnect: true,
      maxRetriesPerRequest: 2,
      retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 1000)),
    });
    this.redis.on("error", (err) => this.logger.error(`redis error: ${err.message}`));
  }

  private cacheKey(key: string): string {
    return `${CACHE_PREFIX}${key}`;
  }

  private toItem(row: {
    id: number;
    key: string;
    value: Prisma.JsonValue;
    description: string | null;
    updatedAt: Date;
    updatedBy: number | null;
  }): SystemConfigItem {
    return {
      id: row.id,
      key: row.key,
      value: row.value,
      description: row.description,
      updatedAt: row.updatedAt,
      updatedBy: row.updatedBy,
    };
  }

  private async cacheItem(item: SystemConfigItem): Promise<void> {
    try {
      await this.redis.setex(
        this.cacheKey(item.key),
        CACHE_TTL_SECONDS,
        JSON.stringify({ ...item, value: JSON.stringify(item.value) })
      );
    } catch (err) {
      this.logger.warn(`redis cache set failed: ${(err as Error).message}`);
    }
  }

  private async evict(key: string): Promise<void> {
    try {
      await this.redis.del(this.cacheKey(key));
    } catch (err) {
      this.logger.warn(`redis cache del failed: ${(err as Error).message}`);
    }
  }

  async findById(id: number): Promise<SystemConfigItem | null> {
    const row = await this.prisma.systemConfig.findUnique({
      where: { id, deletedAt: null },
    });
    if (!row) return null;

    const item = this.toItem(row);
    await this.cacheItem(item);
    return item;
  }

  async findByKey(key: string): Promise<SystemConfigItem | null> {
    const cached = await this.redis.get(this.cacheKey(key));
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as SystemConfigItem;
        parsed.value = JSON.parse(parsed.value as string);
        return parsed;
      } catch {
        await this.redis.del(this.cacheKey(key));
      }
    }

    const row = await this.prisma.systemConfig.findUnique({
      where: { key, deletedAt: null },
    });
    if (!row) return null;

    const item = this.toItem(row);
    await this.cacheItem(item);
    return item;
  }

  async upsert(key: string, value: unknown, updatedBy?: number, description?: string): Promise<SystemConfigItem> {
    const row = await this.prisma.systemConfig.upsert({
      where: { key },
      create: { key, value: value as Prisma.InputJsonValue, updatedBy, description },
      update: {
        value: value as Prisma.InputJsonValue,
        deletedAt: null,
        ...(updatedBy !== undefined ? { updatedBy } : {}),
        ...(description !== undefined ? { description } : {}),
      },
    });

    await this.evict(row.key);
    return this.toItem(row);
  }

  async updateById(id: number, value: unknown, updatedBy?: number, description?: string): Promise<SystemConfigItem> {
    const row = await this.prisma.systemConfig.update({
      where: { id, deletedAt: null },
      data: {
        value: value as Prisma.InputJsonValue,
        ...(updatedBy !== undefined ? { updatedBy } : {}),
        ...(description !== undefined ? { description } : {}),
      },
    });

    await this.evict(row.key);
    return this.toItem(row);
  }

  async deleteById(id: number): Promise<void> {
    const row = await this.prisma.systemConfig.update({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    await this.evict(row.key);
  }
}
