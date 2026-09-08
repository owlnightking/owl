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
      where: { key },
    });
    if (!row) return null;

    const item: SystemConfigItem = {
      key: row.key,
      value: row.value,
      description: row.description,
      updatedAt: row.updatedAt,
      updatedBy: row.updatedBy,
    };

    try {
      await this.redis.setex(
        this.cacheKey(key),
        CACHE_TTL_SECONDS,
        JSON.stringify({ ...item, value: JSON.stringify(item.value) })
      );
    } catch (err) {
      this.logger.warn(`redis cache set failed: ${(err as Error).message}`);
    }

    return item;
  }

  async upsert(key: string, value: unknown, updatedBy?: string, description?: string): Promise<SystemConfigItem> {
    const row = await this.prisma.systemConfig.upsert({
      where: { key },
      create: { key, value: value as Prisma.InputJsonValue, updatedBy, description },
      update: {
        value: value as Prisma.InputJsonValue,
        ...(updatedBy ? { updatedBy } : {}),
        ...(description !== undefined ? { description } : {}),
      },
    });

    try {
      await this.redis.del(this.cacheKey(key));
    } catch (err) {
      this.logger.warn(`redis cache del failed: ${(err as Error).message}`);
    }

    return {
      key: row.key,
      value: row.value,
      description: row.description,
      updatedAt: row.updatedAt,
      updatedBy: row.updatedBy,
    };
  }

  async delete(key: string): Promise<void> {
    await this.prisma.systemConfig.delete({ where: { key } });
    try {
      await this.redis.del(this.cacheKey(key));
    } catch (err) {
      this.logger.warn(`redis cache del failed: ${(err as Error).message}`);
    }
  }
}
