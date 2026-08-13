import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { ApiErrorCode } from "@owl/shared";
import { fail } from "./api-response";

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const requestId = request.headers?.["x-request-id"] ?? request.id ?? "";

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
      this.logger.error(`[${requestId}] ${request.method} ${request.url}: ${exception.stack ?? exception.message}`);
    }

    if (status >= 500) {
      this.logger.error(`[${requestId}] unhandled: ${request.method} ${request.url}`);
    }

    response.status(status).json(fail(code, message));
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
