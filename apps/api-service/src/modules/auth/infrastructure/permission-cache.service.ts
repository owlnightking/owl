import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

/** 权限缓存 TTL（秒）：角色/用户组变更后最多 10 秒生效 */
const PERMISSION_CACHE_TTL_SECONDS = 10;

/**
 * 用户有效权限缓存。
 *
 * 权限计算是「用户组 → 角色 → 权限」三段关联，接口与菜单校验都依赖它，因此按 userId 缓存。
 * 不维护精确失效：角色/组成员变更后最迟一个 TTL 周期生效，避免跨模块的失效广播复杂度。
 */
@Injectable()
export class PermissionCacheService {
  private readonly logger = new Logger(PermissionCacheService.name);
  private readonly client: Redis;
  private readonly keyPrefix = "owl:permission:";
  private available = true;

  constructor(config: ConfigService) {
    this.client = new Redis({
      host: config.get<string>("REDIS_HOST") ?? "localhost",
      port: Number(config.get<string>("REDIS_PORT") ?? 6379),
      password: config.get<string>("REDIS_PASSWORD") ?? undefined,
      lazyConnect: true,
      maxRetriesPerRequest: 2,
      retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 1000)),
    });
    this.client.on("error", (err) => {
      this.available = false;
      this.logger.warn(`redis unavailable, permission cache disabled: ${err.message}`);
    });
    void this.client.connect().catch((err) => {
      this.available = false;
      this.logger.warn(`redis connect failed, permission cache disabled: ${err.message}`);
    });
  }

  private key(userId: number): string {
    return `${this.keyPrefix}${userId}`;
  }

  async get(userId: number): Promise<string[] | null> {
    if (!this.available) return null;
    try {
      const raw = await this.client.get(this.key(userId));
      return raw ? (JSON.parse(raw) as string[]) : null;
    } catch (error) {
      this.logger.warn(`permission cache read failed: ${(error as Error).message}`);
      return null;
    }
  }

  async set(userId: number, codes: string[]): Promise<void> {
    if (!this.available) return;
    try {
      await this.client.set(this.key(userId), JSON.stringify(codes), "EX", PERMISSION_CACHE_TTL_SECONDS);
    } catch (error) {
      this.logger.warn(`permission cache write failed: ${(error as Error).message}`);
    }
  }

  async clear(userId: number): Promise<void> {
    if (!this.available) return;
    try {
      await this.client.del(this.key(userId));
    } catch (error) {
      this.logger.warn(`permission cache clear failed: ${(error as Error).message}`);
    }
  }
}
