import { ApiErrorCode, type ApiResponse, type PageResult } from "@owl/shared";

export function ok<T>(data: T, message = "success"): ApiResponse<T> {
  return { code: ApiErrorCode.OK, data, message };
}

export function page<T>(list: T[], pageNum: number, pageSize: number, total: number): ApiResponse<PageResult<T>> {
  return ok({ list, pageNum, pageSize, total });
}

export function fail<T = null>(code: number, message: string, data?: T): ApiResponse<T | null> {
  return { code, data: data ?? null, message };
}
