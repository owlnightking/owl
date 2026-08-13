export type ApiCode = number;

export interface ApiResponse<T = unknown> {
  code: number;
  data: T;
  message: string;
}

export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PageQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  orderBy?: string;
  order?: "asc" | "desc";
}

export interface ErrorResponse {
  code: number;
  message: string;
  requestId: string;
}

export const ApiErrorCode = {
  OK: 0,
  BAD_REQUEST: 40000,
  UNAUTHORIZED: 40100,
  SESSION_EXPIRED: 40101,
  FORBIDDEN: 40300,
  PERMISSION_DENIED: 40301,
  NOT_FOUND: 40400,
  CONFLICT: 40900,
  INTERNAL_ERROR: 50000,
} as const;

export type ApiErrorCodeValue = (typeof ApiErrorCode)[keyof typeof ApiErrorCode];
