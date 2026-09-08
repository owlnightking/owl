import { ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  RECOGNITION_REPOSITORY,
  type RecognitionCreateInput,
  type RecognitionItem,
  type RecognitionListQuery,
  type RecognitionRepositoryPort,
} from "../domain/recognition.ports";
import { COIN_REPOSITORY, type CoinRepositoryPort } from "../domain/coin.ports";
import { STAMINA_REPOSITORY, type StaminaRepositoryPort } from "../domain/stamina.ports";
import { BADGE_REPOSITORY, type BadgeRepositoryPort } from "../domain/badge.ports";
import { NOTIFICATION_SERVICE, type NotificationRepositoryPort } from "../../notification/index";

const LIKE_STAMINA_COST = 1;

@Injectable()
export class RecognitionUseCase {
  constructor(
    @Inject(RECOGNITION_REPOSITORY) private readonly recognitionRepo: RecognitionRepositoryPort,
    @Inject(COIN_REPOSITORY) private readonly coinRepo: CoinRepositoryPort,
    @Inject(STAMINA_REPOSITORY) private readonly staminaRepo: StaminaRepositoryPort,
    @Inject(BADGE_REPOSITORY) private readonly badgeRepo: BadgeRepositoryPort,
    @Inject(NOTIFICATION_SERVICE) private readonly notificationRepo: NotificationRepositoryPort
  ) {}

  async create(senderId: string, input: RecognitionCreateInput): Promise<RecognitionItem> {
    if (senderId === input.receiverId) throw new ForbiddenException("cannot recognize yourself");
    return this.recognitionRepo.create(senderId, input);
  }

  async approve(id: string, approverId: string): Promise<void> {
    const item = await this.recognitionRepo.findById(id);
    if (!item) throw new NotFoundException(`recognition ${id} not found`);
    if (item.status !== "pending") throw new ForbiddenException("already processed");

    await this.recognitionRepo.approve(id, approverId);

    if (item.badgeId) {
      const badge = await this.badgeRepo.findById(item.badgeId);
      if (badge && badge.coinReward > 0) {
        await this.coinRepo.addBalance(item.receiverId, badge.coinReward, "recognition", id, `认可奖励: ${badge.name}`);
      }
    }

    await this.notificationRepo.create({
      userId: item.senderId,
      title: "认可已通过",
      content: `你对 ${item.receiverName ?? item.receiverId} 的认可已通过审批`,
      type: "recognition",
    });
    await this.notificationRepo.create({
      userId: item.receiverId,
      title: "收到认可",
      content: `${item.senderName ?? item.senderId} 的认可已通过，快去看看吧`,
      type: "recognition",
    });
  }

  async reject(id: string, approverId: string, reason?: string): Promise<void> {
    const item = await this.recognitionRepo.findById(id);
    if (!item) throw new NotFoundException(`recognition ${id} not found`);
    if (item.status !== "pending") throw new ForbiddenException("already processed");
    await this.recognitionRepo.reject(id, approverId, reason);

    await this.notificationRepo.create({
      userId: item.senderId,
      title: "认可已驳回",
      content: `你对 ${item.receiverName ?? item.receiverId} 的认可被驳回${reason ? `：${reason}` : ""}`,
      type: "recognition",
    });
  }

  async togglePin(id: string): Promise<void> {
    await this.recognitionRepo.togglePin(id);
  }

  async toggleLike(id: string, userId: string): Promise<boolean> {
    const item = await this.recognitionRepo.findById(id);
    if (!item) throw new NotFoundException(`recognition ${id} not found`);
    if (item.status !== "approved") throw new ForbiddenException("can only like approved recognitions");

    const alreadyLiked = await this.recognitionRepo.hasLiked(id, userId);
    if (!alreadyLiked) {
      const deducted = await this.staminaRepo.deduct(userId, LIKE_STAMINA_COST);
      if (!deducted) throw new ForbiddenException("insufficient stamina");
    }

    return this.recognitionRepo.toggleLike(id, userId);
  }

  async listFeed(
    page: number,
    pageSize: number,
    userId?: string
  ): Promise<{ items: RecognitionItem[]; total: number }> {
    return this.recognitionRepo.listFeed(page, pageSize, userId);
  }

  async list(query: RecognitionListQuery, userId?: string): Promise<{ items: RecognitionItem[]; total: number }> {
    return this.recognitionRepo.list(query, userId);
  }

  async countPending(): Promise<number> {
    return this.recognitionRepo.countPending();
  }
}
