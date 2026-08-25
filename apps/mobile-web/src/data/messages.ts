export interface MessageItem {
  id: string;
  type: "system" | "approval";
  title: string;
  content: string;
  time: string;
  isRead: boolean;
}

export const mockMessages: MessageItem[] = [
  {
    id: "1",
    type: "system",
    title: "系统通知",
    content: "您的认可币余额已更新，当前余额1280",
    time: "10分钟前",
    isRead: false,
  },
  {
    id: "2",
    type: "approval",
    title: "审批待办",
    content: "张三 发起了「优秀员工」认可审批，请尽快处理",
    time: "1小时前",
    isRead: false,
  },
  {
    id: "3",
    type: "system",
    title: "等级提升",
    content: "恭喜！您的等级已提升至 Lv.3",
    time: "昨天",
    isRead: true,
  },
  {
    id: "4",
    type: "approval",
    title: "审批通过",
    content: "您发起的「团队协作之星」认可已审批通过",
    time: "2天前",
    isRead: true,
  },
  {
    id: "5",
    type: "system",
    title: "体力重置",
    content: "每月体力已重置为500，快去点赞吧",
    time: "3天前",
    isRead: true,
  },
];
