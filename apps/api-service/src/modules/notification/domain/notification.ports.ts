export interface NotificationItem {
  id: string;
  userId: string | null;
  title: string;
  content: string;
  type: string;
  channel: string;
  status: string;
  sentAt: Date | null;
  createdAt: Date;
}

export interface NotificationCreateInput {
  userId?: string;
  title: string;
  content: string;
  type?: string;
  channel?: string;
}

export interface NotificationRepositoryPort {
  listByUser(
    userId: string,
    options?: { status?: string; page: number; pageSize: number }
  ): Promise<{ items: NotificationItem[]; total: number }>;
  countUnread(userId: string): Promise<number>;
  findById(id: string): Promise<NotificationItem | null>;
  create(input: NotificationCreateInput): Promise<NotificationItem>;
  markRead(id: string): Promise<void>;
  markAllRead(userId: string): Promise<void>;
}

export const NOTIFICATION_REPOSITORY = Symbol("NOTIFICATION_REPOSITORY");
export const NOTIFICATION_SERVICE = Symbol("NOTIFICATION_SERVICE");
