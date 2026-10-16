import { Notification } from "@arco-design/web-react";

export function notifyError(error: unknown, fallback: string) {
  Notification.error({ title: "失败", content: error instanceof Error ? error.message : fallback });
}
