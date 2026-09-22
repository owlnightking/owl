export interface NotificationItem {
  id: number;
  userId: number | null;
  title: string;
  content: string;
  type: string;
  channel: string;
  status: string;
  sentAt: Date | null;
  createdAt: Date;
}

export interface NotificationCreateInput {
  userId?: number;
  title: string;
  content: string;
  type?: string;
  channel?: string;
}

export interface NotificationRepositoryPort {
  listByUser(
    userId: number,
    options?: { status?: string; page: number; pageSize: number }
  ): Promise<{ items: NotificationItem[]; total: number }>;
  countUnread(userId: number): Promise<number>;
  findById(id: number): Promise<NotificationItem | null>;
  create(input: NotificationCreateInput): Promise<NotificationItem>;
  markRead(id: number): Promise<void>;
  markAllRead(userId: number): Promise<void>;
}

export const NOTIFICATION_REPOSITORY = Symbol("NOTIFICATION_REPOSITORY");
export const NOTIFICATION_SERVICE = Symbol("NOTIFICATION_SERVICE");
