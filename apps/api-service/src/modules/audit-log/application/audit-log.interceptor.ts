import { CallHandler, ExecutionContext, Inject, Injectable, Logger, NestInterceptor } from "@nestjs/common";
import { Request } from "express";
import { Observable, tap } from "rxjs";
import {
  AUDIT_LOGGER,
  IP_REGION,
  type AuditLoggerPort,
  type AuditRecord,
  type IpRegionPort,
} from "../domain/audit-log.ports";
import { LOCAL_IP_ADDRESSES, IPV4_MAPPED_PREFIX } from "../domain/audit-log.constants";

export interface AuditRequest extends Request {
  auth?: { userId?: string; unionId?: string };
}

export const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const METHOD_ACTION_MAP: Record<string, string> = {
  POST: "create",
  PUT: "update",
  PATCH: "patch",
  DELETE: "delete",
};

const ROUTE_FIRST_LEVEL: Record<string, string> = {
  recognition: "认可中心",
  users: "用户管理",
  roles: "角色管理",
  permissions: "权限管理",
  departments: "部门管理",
  files: "文件管理",
  notifications: "通知管理",
  "audit-logs": "审计日志",
  "system-config": "系统配置",
  "md-docs": "文档中心/文档列表",
  "field-config": "字段配置",
};

const ROUTE_SECOND_LEVEL: Record<string, string> = {
  badges: "徽章管理",
  products: "商品管理",
  exchange: "兑换管理",
};

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(
    @Inject(AUDIT_LOGGER) private readonly auditLogger: AuditLoggerPort,
    @Inject(IP_REGION) private readonly ipRegionService: IpRegionPort
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<AuditRequest>();
    if (!WRITE_METHODS.has(req.method)) {
      return next.handle();
    }
    const path = req.originalUrl ?? req.url ?? "";
    if (path.startsWith("/api/auth/")) {
      return next.handle();
    }
    const start = Date.now();
    return next.handle().pipe(
      tap({
        next: (data) => {
          this.logger.log(`audit: ${req.method} ${req.originalUrl} (${Date.now() - start}ms)`);
          void this.writeRecord(req, "success", data);
        },
        error: (err: unknown) => {
          this.logger.warn(
            `audit failed: ${req.method} ${req.originalUrl}: ${err instanceof Error ? err.message : String(err)}`
          );
          void this.writeRecord(req, "failed");
        },
      })
    );
  }

  private async writeRecord(req: AuditRequest, result: "success" | "failed", data?: unknown): Promise<void> {
    try {
      const route = req.route?.path ?? req.originalUrl;
      const action = METHOD_ACTION_MAP[req.method] ?? req.method.toLowerCase();
      const resource = req.route?.path?.split("/")[1] ?? req.originalUrl.split("/")[1] ?? "unknown";
      const resourceId = this.extractResourceId(req.originalUrl);
      const auth = req.auth;
      const ip = this.extractClientIp(req);
      const system = (req.headers["x-audit-system"] as string | undefined) ?? undefined;
      const module = this.resolveModule(route);

      const record: AuditRecord = {
        userId: auth?.userId,
        unionId: auth?.unionId,
        action,
        resource,
        resourceId,
        detail: data ? { summary: this.summarize(data) } : undefined,
        ip,
        ipRegion: ip ? this.ipRegionService.lookup(ip) : undefined,
        requestId: (req.headers["x-request-id"] as string | undefined) ?? undefined,
        result,
        system,
        module,
      };
      await this.auditLogger.record(record);
    } catch (err) {
      this.logger.error(`audit persist failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  private resolveModule(route: string): string | undefined {
    const cleaned = route.replace(/^\/api\//, "").split("?")[0];
    const segments = cleaned.split("/");
    const first = segments[0];
    const firstLabel = ROUTE_FIRST_LEVEL[first];
    if (!firstLabel) return first;
    const second = segments[1];
    const secondLabel = second ? ROUTE_SECOND_LEVEL[second] : undefined;
    return secondLabel ? `${firstLabel}/${secondLabel}` : firstLabel;
  }

  private extractClientIp(req: AuditRequest): string | undefined {
    const forwarded = req.headers["x-forwarded-for"];
    if (forwarded) {
      const first = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(",")[0]?.trim();
      if (first) return this.normalizeIp(first);
    }
    return this.normalizeIp(req.ip);
  }

  private normalizeIp(ip: string | undefined): string | undefined {
    if (!ip) return undefined;
    if (ip.startsWith(IPV4_MAPPED_PREFIX)) {
      return ip.slice(IPV4_MAPPED_PREFIX.length);
    }
    if (LOCAL_IP_ADDRESSES.includes(ip as (typeof LOCAL_IP_ADDRESSES)[number])) return undefined;
    return ip;
  }

  private extractResourceId(url: string): string | undefined {
    const segments = url.split("/").filter(Boolean);
    if (segments.length < 2) return undefined;
    const maybeId = segments[segments.length - 1];
    return maybeId && maybeId !== "roles" && maybeId !== "status" && maybeId !== "users" ? maybeId : undefined;
  }

  private summarize(data: unknown): string {
    if (data && typeof data === "object") {
      const obj = data as Record<string, unknown>;
      if (typeof obj.id === "string") return String(obj.id);
    }
    return typeof data === "string" ? data.slice(0, 200) : "";
  }
}
