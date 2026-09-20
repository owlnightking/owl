import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import IP2Region from "ip2region";
import { join } from "path";
import type { IpRegionPort } from "../domain/audit-log.ports";
import { LOCAL_IP_ADDRESSES, IPV4_MAPPED_PREFIX } from "../domain/audit-log.constants";

@Injectable()
export class IpRegionService implements IpRegionPort, OnModuleInit {
  private readonly logger = new Logger(IpRegionService.name);
  private searcher!: IP2Region;

  onModuleInit() {
    try {
      const dbPath = join(__dirname, "../../../../src/assets/ip2region.xdb");
      this.searcher = new IP2Region({ ipv4db: dbPath });
      this.logger.log("ip2region loaded");
    } catch (err) {
      this.logger.error(`ip2region load failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  lookup(ip: string): string | undefined {
    if (!this.searcher || !ip) return undefined;
    const cleaned = this.normalizeIp(ip);
    if (!cleaned) return undefined;
    try {
      const result = this.searcher.search(cleaned);
      if (!result) return undefined;
      const { country, province, city } = result;
      const parts = [country, province, city].filter((p) => p && p !== "0");
      return parts.length > 0 ? parts.join("") : undefined;
    } catch {
      return undefined;
    }
  }

  private normalizeIp(ip: string): string | undefined {
    if (!ip) return undefined;
    if (ip.startsWith(IPV4_MAPPED_PREFIX)) {
      return ip.slice(IPV4_MAPPED_PREFIX.length);
    }
    if (LOCAL_IP_ADDRESSES.includes(ip as (typeof LOCAL_IP_ADDRESSES)[number])) {
      return undefined;
    }
    return ip;
  }
}
