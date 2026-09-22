import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CLIENT } from "@owl/database/provider";
import type { PrismaClient } from "@owl/database";
import type {
  NotificationCreateInput,
  NotificationItem,
  NotificationRepositoryPort,
} from "../domain/notification.ports";

@Injectable()
export class PrismaNotificationRepository implements NotificationRepositoryPort {
  constructor(@Inject(DATABASE_CLIENT) private readonly prisma: PrismaClient) {}

  private toItem(raw: {
    id: number;
    userId: number | null;
    title: string;
    content: string;
    type: string;
    channel: string;
    status: string;
    sentAt: Date | null;
    createdAt: Date;
  }): NotificationItem {
    return {
      id: raw.id,
      userId: raw.userId,
      title: raw.title,
      content: raw.content,
      type: raw.type,
      channel: raw.channel,
      status: raw.status,
      sentAt: raw.sentAt,
      createdAt: raw.createdAt,
    };
  }

  async listByUser(
    userId: number,
    options?: { status?: string; page: number; pageSize: number }
  ): Promise<{ items: NotificationItem[]; total: number }> {
    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 20;
    const where = { userId, deletedAt: null, ...(options?.status ? { status: options.status } : {}) };

    const [rows, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { items: rows.map(this.toItem), total };
  }

  async countUnread(userId: number): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, status: "unread", deletedAt: null },
    });
  }

  async findById(id: number): Promise<NotificationItem | null> {
    const row = await this.prisma.notification.findUnique({ where: { id, deletedAt: null } });
    return row ? this.toItem(row) : null;
  }

  async create(input: NotificationCreateInput): Promise<NotificationItem> {
    const row = await this.prisma.notification.create({
      data: {
        userId: input.userId,
        title: input.title,
        content: input.content,
        type: input.type ?? "system",
        channel: input.channel ?? "webhook",
        status: "unread",
        sentAt: new Date(),
      },
    });
    return this.toItem(row);
  }

  async markRead(id: number): Promise<void> {
    await this.prisma.notification.update({
      where: { id, deletedAt: null },
      data: { status: "read" },
    });
  }

  async markAllRead(userId: number): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, status: "unread", deletedAt: null },
      data: { status: "read" },
    });
  }
}
