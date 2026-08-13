import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import type { OAuthState, OAuthStateStorePort } from "../domain/auth.ports";

export const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

@Injectable()
export class RedisOAuthStateStore implements OAuthStateStorePort {
  private readonly logger = new Logger(RedisOAuthStateStore.name);
  private readonly client: Redis;
  private readonly keyPrefix: string;

  constructor(config: ConfigService) {
    this.keyPrefix = (config.get<string>("REDIS_KEY_PREFIX") ?? "owl:") + "oauth-state:";
    this.client = new Redis({
      host: config.get<string>("REDIS_HOST") ?? "localhost",
      port: Number(config.get<string>("REDIS_PORT") ?? 6379),
      password: config.get<string>("REDIS_PASSWORD") ?? undefined,
      lazyConnect: true,
      maxRetriesPerRequest: 2,
      retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 1000)),
    });
    this.client.on("error", (err) => this.logger.error(`redis error: ${err.message}`));
    void this.client.connect().catch((err) => this.logger.error(`redis connect failed: ${err.message}`));
  }

  private key(state: string): string {
    return this.keyPrefix + state;
  }

  async save(state: OAuthState): Promise<void> {
    await this.client.set(this.key(state.state), JSON.stringify(state), "PX", OAUTH_STATE_TTL_MS);
  }

  async findAndConsume(state: string): Promise<OAuthState | null> {
    const raw = await this.client.get(this.key(state));
    if (!raw) {
      return null;
    }
    await this.client.del(this.key(state));
    try {
      return JSON.parse(raw) as OAuthState;
    } catch {
      this.logger.warn(`oauth state json 解析失败: ${state}`);
      return null;
    }
  }
}
