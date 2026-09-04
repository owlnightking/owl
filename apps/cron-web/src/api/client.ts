import axios, { type AxiosResponse, type AxiosError } from "axios";
import { Notification } from "@arco-design/web-react";

export interface ApiResponse<T = unknown> {
  code: number;
  data: T;
  message: string;
}

export const http = axios.create({
  baseURL: "/api",
  withCredentials: true,
  timeout: 15000,
});

export const cronHttp = axios.create({
  baseURL: "/cron",
  withCredentials: true,
  timeout: 15000,
});

const responseInterceptor = (response: AxiosResponse<ApiResponse>) => {
  const body = response.data;
  if (body && typeof body.code === "number" && body.code !== 0) {
    return Promise.reject(new Error(body.message ?? "request failed"));
  }
  return response;
};

const errorInterceptor = (error: AxiosError<{ message?: string }>) => {
  const status = error.response?.status;
  const url: string = error.config?.url ?? "";
  const isMeRequest = url.endsWith("/auth/me") || url.includes("/auth/refresh");
  if (status === 401 && !isMeRequest) {
    const redirect = encodeURIComponent(window.location.pathname);
    window.location.href = `/api/auth/feishu/login?redirect=${redirect}`;
  }
  if (status === 403) {
    Notification.error({
      title: "无权限",
      content: "您没有执行此操作的权限，请联系管理员",
      duration: 5000,
    });
    return Promise.reject(new Error("permission denied"));
  }
  const message = error.response?.data?.message ?? error.message ?? "network error";
  return Promise.reject(new Error(message));
};

http.interceptors.response.use(responseInterceptor, errorInterceptor);
cronHttp.interceptors.response.use(responseInterceptor, errorInterceptor);

export async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const res = await http.get<ApiResponse<T>>(url, { params });
  return res.data.data;
}

export async function post<T>(url: string, body?: unknown): Promise<T> {
  const res = await http.post<ApiResponse<T>>(url, body);
  return res.data.data;
}

export async function put<T>(url: string, body?: unknown): Promise<T> {
  const res = await http.put<ApiResponse<T>>(url, body);
  return res.data.data;
}

export async function del<T>(url: string): Promise<T> {
  const res = await http.delete<ApiResponse<T>>(url);
  return res.data.data;
}
