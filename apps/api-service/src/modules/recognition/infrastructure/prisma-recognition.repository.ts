import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CLIENT } from "@owl/database/provider";
import type { PrismaClient } from "@owl/database";
import type {
  RecognitionCreateInput,
  RecognitionItem,
  RecognitionListQuery,
  RecognitionRepositoryPort,
} from "../domain/recognition.ports";

@Injectable()
export class PrismaRecognitionRepository implements RecognitionRepositoryPort {
  constructor(@Inject(DATABASE_CLIENT) private readonly prisma: PrismaClient) {}

  private async toItem(raw: {
    id: string;
    senderId: string;
    receiverId: string;
    badgeId: string | null;
    message: string;
    status: string;
    pinned: boolean;
    approverId: string | null;
    approvedAt: Date | null;
    rejectReason: string | null;
    createdAt: Date;
    sender?: { name: string; avatar72?: string | null } | null;
    receiver?: { name: string; avatar72?: string | null } | null;
    badge?: { name: string; icon?: string | null } | null;
    _count?: { likes: number };
  }): Promise<RecognitionItem> {
    return {
      id: raw.id,
      senderId: raw.senderId,
      senderName: raw.sender?.name,
      senderAvatar: raw.sender?.avatar72 ?? undefined,
      receiverId: raw.receiverId,
      receiverName: raw.receiver?.name,
      receiverAvatar: raw.receiver?.avatar72 ?? undefined,
      badgeId: raw.badgeId,
      badgeName: raw.badge?.name,
      badgeIcon: raw.badge?.icon ?? undefined,
      message: raw.message,
      status: raw.status as RecognitionItem["status"],
      pinned: raw.pinned,
      approverId: raw.approverId,
      approvedAt: raw.approvedAt,
      rejectReason: raw.rejectReason,
      likeCount: raw._count?.likes ?? 0,
      likedByMe: false,
      createdAt: raw.createdAt,
    };
  }

  async findById(id: string): Promise<RecognitionItem | null> {
    const row = await this.prisma.recognition.findUnique({
      where: { id },
      include: {
        sender: { select: { name: true, avatar72: true } },
        receiver: { select: { name: true, avatar72: true } },
        badge: { select: { name: true, icon: true } },
        _count: { select: { likes: true } },
      },
    });
    return row ? this.toItem(row) : null;
  }

  async list(query: RecognitionListQuery, userId?: string): Promise<{ items: RecognitionItem[]; total: number }> {
    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.receiverId) where.receiverId = query.receiverId;
    if (query.senderId) where.senderId = query.senderId;

    const [rows, total] = await Promise.all([
      this.prisma.recognition.findMany({
        where,
        orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: {
          sender: { select: { name: true, avatar72: true } },
          receiver: { select: { name: true, avatar72: true } },
          badge: { select: { name: true, icon: true } },
          _count: { select: { likes: true } },
        },
      }),
      this.prisma.recognition.count({ where }),
    ]);

    let likedIds = new Set<string>();
    if (userId) {
      const ids = rows.map((r) => r.id);
      if (ids.length > 0) {
        const likes = await this.prisma.recognitionLike.findMany({
          where: { userId, recognitionId: { in: ids } },
          select: { recognitionId: true },
        });
        likedIds = new Set(likes.map((l) => l.recognitionId));
      }
    }

    const items = await Promise.all(
      rows.map(async (r) => {
        const item = await this.toItem(r);
        item.likedByMe = likedIds.has(r.id);
        return item;
      })
    );
    return { items, total };
  }

  async listFeed(
    page: number,
    pageSize: number,
    userId?: string
  ): Promise<{ items: RecognitionItem[]; total: number }> {
    return this.list({ status: "approved", page, pageSize }, userId);
  }

  async create(senderId: string, input: RecognitionCreateInput): Promise<RecognitionItem> {
    const row = await this.prisma.recognition.create({
      data: {
        senderId,
        receiverId: input.receiverId,
        badgeId: input.badgeId,
        message: input.message,
      },
      include: {
        sender: { select: { name: true, avatar72: true } },
        receiver: { select: { name: true, avatar72: true } },
        badge: { select: { name: true, icon: true } },
        _count: { select: { likes: true } },
      },
    });
    return this.toItem(row);
  }

  async approve(id: string, approverId: string): Promise<void> {
    await this.prisma.recognition.update({
      where: { id },
      data: { status: "approved", approverId, approvedAt: new Date() },
    });
  }

  async reject(id: string, approverId: string, reason?: string): Promise<void> {
    await this.prisma.recognition.update({
      where: { id },
      data: { status: "rejected", approverId, rejectReason: reason },
    });
  }

  async togglePin(id: string): Promise<void> {
    const item = await this.prisma.recognition.findUnique({ where: { id }, select: { pinned: true } });
    if (item) {
      await this.prisma.recognition.update({ where: { id }, data: { pinned: !item.pinned } });
    }
  }

  async toggleLike(id: string, userId: string): Promise<boolean> {
    const existing = await this.prisma.recognitionLike.findUnique({
      where: { recognitionId_userId: { recognitionId: id, userId } },
    });
    if (existing) {
      await this.prisma.recognitionLike.delete({ where: { id: existing.id } });
      return false;
    }
    await this.prisma.recognitionLike.create({ data: { recognitionId: id, userId } });
    return true;
  }

  async hasLiked(id: string, userId: string): Promise<boolean> {
    const like = await this.prisma.recognitionLike.findUnique({
      where: { recognitionId_userId: { recognitionId: id, userId } },
    });
    return !!like;
  }

  async countPending(): Promise<number> {
    return this.prisma.recognition.count({ where: { status: "pending" } });
  }
}
