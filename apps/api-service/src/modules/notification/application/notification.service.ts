import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  NOTIFICATION_REPOSITORY,
  type NotificationCreateInput,
  type NotificationItem,
  type NotificationRepositoryPort,
} from "../domain/notification.ports";

@Injectable()
export class NotificationService {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly repo: NotificationRepositoryPort
  ) {}

  async listByUser(
    userId: number,
    options?: { status?: string; page: number; pageSize: number }
  ): Promise<{ items: NotificationItem[]; total: number }> {
    return this.repo.listByUser(userId, options);
  }

  async countUnread(userId: number): Promise<number> {
    return this.repo.countUnread(userId);
  }

  async create(input: NotificationCreateInput): Promise<NotificationItem> {
    return this.repo.create(input);
  }

  async markRead(id: number): Promise<void> {
    const item = await this.repo.findById(id);
    if (!item) throw new NotFoundException(`notification ${id} not found`);
    await this.repo.markRead(id);
  }

  async markAllRead(userId: number): Promise<void> {
    await this.repo.markAllRead(userId);
  }
}
