import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CLIENT } from "@owl/database/provider";
import type { PrismaClient } from "@owl/database";
import type {
  CampaignCreateInput,
  CampaignItem,
  CampaignListOptions,
  CampaignUpdateInput,
  FeedbackCreateInput,
  FeedbackItem,
  FeedbackListOptions,
  FeedbackUpdateInput,
  GtmRepositoryPort,
  KolCreateInput,
  KolItem,
  KolListOptions,
  KolUpdateInput,
  PresaleCreateInput,
  PresaleItem,
  PresaleListOptions,
  PresaleUpdateInput,
} from "../domain/gtm.ports";

@Injectable()
export class PrismaGtmRepository implements GtmRepositoryPort {
  constructor(@Inject(DATABASE_CLIENT) private readonly prisma: PrismaClient) {}

  async listCampaigns(options: CampaignListOptions): Promise<{ items: CampaignItem[]; total: number }> {
    const where = baseWhere();
    if (options.productLineId !== undefined) where.productLineId = options.productLineId;
    if (options.type) where.type = options.type;
    if (options.platform) where.platform = options.platform;
    if (options.status) where.status = options.status;

    const [rows, total] = await Promise.all([
      this.prisma.gtmCampaign.findMany({
        where,
        include: { kol: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        skip: (options.page - 1) * options.pageSize,
        take: options.pageSize,
      }),
      this.prisma.gtmCampaign.count({ where }),
    ]);
    return { items: rows.map((row) => this.toCampaign(row)), total };
  }

  private toCampaign(row: {
    id: number;
    productLineId: number;
    name: string;
    type: string;
    platform: string;
    status: string;
    kolId: number | null;
    kol?: { name: string } | null;
    budgetUsd: unknown;
    spentUsd: unknown;
    feedbackNotes: string | null;
    startDate: Date | null;
    endDate: Date | null;
    notes: string | null;
    createdAt: Date;
  }): CampaignItem {
    return {
      id: row.id,
      productLineId: row.productLineId,
      name: row.name,
      type: row.type,
      platform: row.platform,
      status: row.status,
      kolId: row.kolId,
      kolName: row.kol?.name ?? null,
      budgetUsd: Number(row.budgetUsd),
      spentUsd: Number(row.spentUsd),
      feedbackNotes: row.feedbackNotes,
      startDate: row.startDate,
      endDate: row.endDate,
      notes: row.notes,
      createdAt: row.createdAt,
    };
  }

  async createCampaign(productLineId: number, input: CampaignCreateInput): Promise<CampaignItem> {
    const row = await this.prisma.gtmCampaign.create({
      data: { ...input, productLineId },
      include: { kol: { select: { name: true } } },
    });
    return this.toCampaign(row);
  }

  async updateCampaign(id: number, input: CampaignUpdateInput): Promise<CampaignItem | null> {
    const row = await this.prisma.gtmCampaign
      .update({ where: { id, deletedAt: null }, data: input, include: { kol: { select: { name: true } } } })
      .catch(() => null);
    return row ? this.toCampaign(row) : null;
  }

  async removeCampaign(id: number): Promise<void> {
    await this.prisma.gtmCampaign.update({ where: { id, deletedAt: null }, data: { deletedAt: new Date() } });
  }

  async listKols(options: KolListOptions): Promise<{ items: KolItem[]; total: number }> {
    const where = baseWhere();
    if (options.keyword) {
      where.OR = [
        { name: { contains: options.keyword, mode: "insensitive" } },
        { handle: { contains: options.keyword, mode: "insensitive" } },
      ];
    }
    if (options.platform) where.platform = options.platform;
    if (options.coopStatus) where.coopStatus = options.coopStatus;

    const [rows, total] = await Promise.all([
      this.prisma.kol.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (options.page - 1) * options.pageSize,
        take: options.pageSize,
      }),
      this.prisma.kol.count({ where }),
    ]);
    return { items: rows.map((row) => this.toKol(row)), total };
  }

  private toKol(row: {
    id: number;
    name: string;
    platform: string;
    handle: string | null;
    followers: number;
    coopStatus: string;
    contactInfo: string | null;
    totalSpentUsd: unknown;
    cooperationNotes: string | null;
    createdAt: Date;
  }): KolItem {
    return {
      id: row.id,
      name: row.name,
      platform: row.platform,
      handle: row.handle,
      followers: row.followers,
      coopStatus: row.coopStatus,
      contactInfo: row.contactInfo,
      totalSpentUsd: Number(row.totalSpentUsd),
      cooperationNotes: row.cooperationNotes,
      createdAt: row.createdAt,
    };
  }

  async findKolById(id: number): Promise<KolItem | null> {
    const row = await this.prisma.kol.findFirst({ where: { id, deletedAt: null } });
    return row ? this.toKol(row) : null;
  }

  async createKol(input: KolCreateInput): Promise<KolItem> {
    const row = await this.prisma.kol.create({ data: input });
    return this.toKol(row);
  }

  async updateKol(id: number, input: KolUpdateInput): Promise<KolItem | null> {
    const row = await this.prisma.kol.update({ where: { id, deletedAt: null }, data: input }).catch(() => null);
    return row ? this.toKol(row) : null;
  }

  async removeKol(id: number): Promise<void> {
    await this.prisma.kol.update({ where: { id, deletedAt: null }, data: { deletedAt: new Date() } });
  }

  async listFeedbacks(options: FeedbackListOptions): Promise<{ items: FeedbackItem[]; total: number }> {
    const where = baseWhere();
    if (options.productLineId !== undefined) where.productLineId = options.productLineId;
    if (options.type) where.type = options.type;

    const [rows, total] = await Promise.all([
      this.prisma.communityFeedback.findMany({
        where,
        orderBy: { collectedAt: "desc" },
        skip: (options.page - 1) * options.pageSize,
        take: options.pageSize,
      }),
      this.prisma.communityFeedback.count({ where }),
    ]);
    return {
      items: rows.map((row) => ({
        id: row.id,
        productLineId: row.productLineId,
        type: row.type,
        content: row.content,
        source: row.source,
        collectedAt: row.collectedAt,
        createdAt: row.createdAt,
      })),
      total,
    };
  }

  async createFeedback(productLineId: number, input: FeedbackCreateInput): Promise<FeedbackItem> {
    const row = await this.prisma.communityFeedback.create({ data: { ...input, productLineId } });
    return {
      id: row.id,
      productLineId: row.productLineId,
      type: row.type,
      content: row.content,
      source: row.source,
      collectedAt: row.collectedAt,
      createdAt: row.createdAt,
    };
  }

  async updateFeedback(id: number, input: FeedbackUpdateInput): Promise<FeedbackItem | null> {
    const row = await this.prisma.communityFeedback
      .update({ where: { id, deletedAt: null }, data: input })
      .catch(() => null);
    if (!row) return null;
    return {
      id: row.id,
      productLineId: row.productLineId,
      type: row.type,
      content: row.content,
      source: row.source,
      collectedAt: row.collectedAt,
      createdAt: row.createdAt,
    };
  }

  async removeFeedback(id: number): Promise<void> {
    await this.prisma.communityFeedback.update({ where: { id, deletedAt: null }, data: { deletedAt: new Date() } });
  }

  async listPresales(options: PresaleListOptions): Promise<{ items: PresaleItem[]; total: number }> {
    const where = baseWhere();
    if (options.productLineId !== undefined) where.productLineId = options.productLineId;
    if (options.spuId !== undefined) where.spuId = options.spuId;

    const [rows, total] = await Promise.all([
      this.prisma.presaleBatch.findMany({
        where,
        include: { spu: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        skip: (options.page - 1) * options.pageSize,
        take: options.pageSize,
      }),
      this.prisma.presaleBatch.count({ where }),
    ]);
    return { items: rows.map((row) => this.toPresale(row)), total };
  }

  private toPresale(row: {
    id: number;
    spuId: number;
    productLineId: number;
    spu?: { name: string } | null;
    name: string;
    limited: boolean;
    quantity: number;
    priceUsd: unknown;
    startAt: Date | null;
    endAt: Date | null;
    notes: string | null;
    createdAt: Date;
  }): PresaleItem {
    return {
      id: row.id,
      spuId: row.spuId,
      productLineId: row.productLineId,
      spuName: row.spu?.name ?? "",
      name: row.name,
      limited: row.limited,
      quantity: row.quantity,
      priceUsd: Number(row.priceUsd),
      startAt: row.startAt,
      endAt: row.endAt,
      notes: row.notes,
      createdAt: row.createdAt,
    };
  }

  async createPresale(spuId: number, input: PresaleCreateInput & { productLineId: number }): Promise<PresaleItem> {
    const { productLineId, ...rest } = input;
    const row = await this.prisma.presaleBatch.create({
      data: { ...rest, spuId, productLineId },
      include: { spu: { select: { name: true } } },
    });
    return this.toPresale(row);
  }

  async updatePresale(id: number, input: PresaleUpdateInput): Promise<PresaleItem | null> {
    const row = await this.prisma.presaleBatch
      .update({ where: { id, deletedAt: null }, data: input, include: { spu: { select: { name: true } } } })
      .catch(() => null);
    return row ? this.toPresale(row) : null;
  }

  async removePresale(id: number): Promise<void> {
    await this.prisma.presaleBatch.update({ where: { id, deletedAt: null }, data: { deletedAt: new Date() } });
  }
}

const baseWhere = (): Record<string, unknown> => ({ deletedAt: null });
