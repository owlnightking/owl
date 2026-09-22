import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  Optional,
} from "@nestjs/common";
import { ApiErrorCode } from "@owl/shared";
import { fail } from "./api-response";
import { SYSTEM_LOG_RECORDER, type SystemLogRecorderPort } from "../observability/system-log.ports";

const SERVICE_NAME = "api-service";

interface RequestWithAuth {
  method?: string;
  url?: string;
  headers?: Record<string, unknown>;
  id?: string;
  auth?: { userId?: number };
}

@Injectable()
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  constructor(@Optional() @Inject(SYSTEM_LOG_RECORDER) private readonly systemLog?: SystemLogRecorderPort) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest<RequestWithAuth>();
    const requestId = (request.headers?.["x-request-id"] as string | undefined) ?? request.id ?? "";

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code: number = ApiErrorCode.INTERNAL_ERROR;
    let message = "internal server error";

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === "string") {
        message = res;
      } else if (res && typeof res === "object") {
        const body = res as { message?: string | string[]; error?: string };
        message = Array.isArray(body.message) ? body.message.join("; ") : (body.message ?? body.error ?? "error");
      }
      code = mapHttpStatusToCode(status);
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const userId = request.auth?.userId;
    const level = status >= HttpStatus.INTERNAL_SERVER_ERROR ? "error" : "warn";
    const logContext = `[${requestId}] ${request.method} ${request.url} status=${status} code=${code}${userId !== undefined ? ` userId=${userId}` : ""}`;
    if (level === "error") {
      this.logger.error(`${logContext} ${message}`, exception instanceof Error ? exception.stack : undefined);
    } else {
      this.logger.warn(`${logContext} ${message}`);
    }

    void this.persistLog({
      level,
      message,
      stack: exception instanceof Error ? exception.stack : undefined,
      requestId,
      method: request.method,
      url: request.url,
      status,
      code,
      userId,
    });

    response.status(status).json(fail(code, message));
  }

  private async persistLog(entry: {
    level: "error" | "warn";
    message: string;
    stack?: string;
    requestId: string;
    method?: string;
    url?: string;
    status: number;
    code: number;
    userId?: number;
  }): Promise<void> {
    if (!this.systemLog) return;
    try {
      await this.systemLog.record({ service: SERVICE_NAME, ...entry });
    } catch {
      // 持久化失败不影响响应，异常过滤器已在上方输出日志
    }
  }
}

function mapHttpStatusToCode(status: number): number {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return ApiErrorCode.BAD_REQUEST;
    case HttpStatus.UNAUTHORIZED:
      return ApiErrorCode.UNAUTHORIZED;
    case HttpStatus.FORBIDDEN:
      return ApiErrorCode.FORBIDDEN;
    case HttpStatus.NOT_FOUND:
      return ApiErrorCode.NOT_FOUND;
    case HttpStatus.CONFLICT:
      return ApiErrorCode.CONFLICT;
    default:
      return ApiErrorCode.INTERNAL_ERROR;
  }
}
