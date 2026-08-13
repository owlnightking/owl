import { CallHandler, ExecutionContext, Inject, Injectable, Logger, NestInterceptor } from "@nestjs/common";
import { Request } from "express";
import { Observable, tap } from "rxjs";
import { AUDIT_LOGGER, type AuditLoggerPort, type AuditRecord } from "../domain/audit-log.ports";

export interface AuditRequest extends Request {
  auth?: { userId?: string; unionId?: string };
}

export const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(@Inject(AUDIT_LOGGER) private readonly auditLogger: AuditLoggerPort) {}

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
      const action = `${req.method.toLowerCase()}:${route}`;
      const resource = req.route?.path?.split("/")[1] ?? req.originalUrl.split("/")[1] ?? "unknown";
      const resourceId = this.extractResourceId(req.originalUrl);
      const auth = req.auth;
      const record: AuditRecord = {
        userId: auth?.userId,
        unionId: auth?.unionId,
        action,
        resource,
        resourceId,
        detail: data ? { summary: this.summarize(data) } : undefined,
        ip: req.ip,
        requestId: (req.headers["x-request-id"] as string | undefined) ?? undefined,
        result,
      };
      await this.auditLogger.record(record);
    } catch (err) {
      this.logger.error(`audit persist failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  private extractResourceId(url: string): string | undefined {
    const segments = url.split("/").filter(Boolean);
    if (segments.length < 2) {
      return undefined;
    }
    const maybeId = segments[segments.length - 1];
    return maybeId && maybeId !== "roles" && maybeId !== "status" && maybeId !== "users" ? maybeId : undefined;
  }

  private summarize(data: unknown): string {
    if (data && typeof data === "object") {
      const obj = data as Record<string, unknown>;
      if (typeof obj.id === "string") {
        return String(obj.id);
      }
    }
    return typeof data === "string" ? data.slice(0, 200) : "";
  }
}
