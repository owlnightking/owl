import { Notification } from "@arco-design/web-react";

export const PLATFORM_OPTIONS = [
  { value: "tiktok", label: "TikTok" },
  { value: "instagram", label: "Instagram" },
  { value: "twitter", label: "Twitter" },
  { value: "youtube", label: "YouTube" },
  { value: "facebook", label: "Facebook" },
  { value: "other", label: "其他" },
];

export const FEEDBACK_TYPE_OPTIONS = [
  { value: "expectation", label: "需求期待" },
  { value: "improvement", label: "改进建议" },
  { value: "status_follow", label: "进度追问" },
  { value: "other", label: "其他" },
];

export function notifyError(error: unknown, fallback: string) {
  Notification.error({ title: "失败", content: error instanceof Error ? error.message : fallback });
}
