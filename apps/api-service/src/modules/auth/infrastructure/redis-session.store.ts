import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import type { SessionRecord, SessionStorePort } from "../domain/auth.ports";

@Injectable()
export class RedisSessionStore implements SessionStorePort {
  private readonly logger = new Logger(RedisSessionStore.name);
  private readonly client: Redis;
  private readonly keyPrefix: string;

  constructor(config: ConfigService) {
    this.keyPrefix = config.get<string>("REDIS_KEY_PREFIX") ?? "owl:session:";
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

  private key(jti: string): string {
    return this.keyPrefix + jti;
  }

  private ttl(session: SessionRecord): number {
    return Math.max(1, Math.floor((session.expiresAt - Date.now()) / 1000));
  }

  async save(session: SessionRecord): Promise<void> {
    await this.client.set(this.key(session.jti), JSON.stringify(session), "EX", this.ttl(session));
  }

  async find(jti: string): Promise<SessionRecord | null> {
    const raw = await this.client.get(this.key(jti));
    return raw ? (JSON.parse(raw) as SessionRecord) : null;
  }

  async revoke(jti: string): Promise<void> {
    await this.client.del(this.key(jti));
  }

  async revokeByUser(userId: string): Promise<void> {
    const keys = await this.client.keys(`${this.keyPrefix}*`);
    if (keys.length === 0) {
      return;
    }
    const pipeline = this.client.pipeline();
    for (const k of keys) {
      pipeline.get(k);
    }
    const results = await pipeline.exec();
    const toDelete: string[] = [];
    results?.forEach(([err, val], idx) => {
      if (!err && typeof val === "string") {
        try {
          const session = JSON.parse(val) as SessionRecord;
          if (session.userId === userId) {
            toDelete.push(keys[idx]);
          }
        } catch {
          this.logger.warn(`redis session json 解析失败: ${keys[idx]}`);
        }
      }
    });
    if (toDelete.length > 0) {
      await this.client.del(...toDelete);
    }
  }

  async extend(jti: string, expiresAt: number): Promise<void> {
    const session = await this.find(jti);
    if (!session) {
      return;
    }
    session.expiresAt = expiresAt;
    await this.save(session);
  }
}
