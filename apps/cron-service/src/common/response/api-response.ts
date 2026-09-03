import type { ApiResponse } from "@owl/shared";

export function ok<T>(data: T, message = "success"): ApiResponse<T> {
  return { code: 0, data, message };
}

export function fail<T = null>(code: number, message: string, data?: T): ApiResponse<T | null> {
  return { code, data: data ?? null, message };
}
