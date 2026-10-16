import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CLIENT } from "@owl/database/provider";
import type { PrismaClient } from "@owl/database";
import type {
  DesignTaskCreateInput,
  DesignTaskItem,
  DesignTaskUpdateInput,
  InvestDecisionInput,
  InvestDecisionItem,
  IpdStageRepositoryPort,
  PrototypeReviewInput,
  PrototypeReviewItem,
  ResearchCreateInput,
  ResearchItem,
  ResearchUpdateInput,
  RoiReviewCreateInput,
  RoiReviewItem,
  RoiReviewUpdateInput,
} from "../domain/ipd.ports";

@Injectable()
export class PrismaIpdStageRepository implements IpdStageRepositoryPort {
  constructor(@Inject(DATABASE_CLIENT) private readonly prisma: PrismaClient) {}

  async listResearches(productLineId: number): Promise<ResearchItem[]> {
    const rows = await this.prisma.ipdResearch.findMany({
      where: { productLineId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((row) => ({
      id: row.id,
      productLineId: row.productLineId,
      type: row.type,
      title: row.title,
      content: row.content,
      sourceRef: row.sourceRef,
      createdAt: row.createdAt,
    }));
  }

  async createResearch(productLineId: number, input: ResearchCreateInput): Promise<ResearchItem> {
    const row = await this.prisma.ipdResearch.create({ data: { ...input, productLineId } });
    return {
      id: row.id,
      productLineId: row.productLineId,
      type: row.type,
      title: row.title,
      content: row.content,
      sourceRef: row.sourceRef,
      createdAt: row.createdAt,
    };
  }

  async updateResearch(id: number, input: ResearchUpdateInput): Promise<ResearchItem | null> {
    const row = await this.prisma.ipdResearch.update({ where: { id, deletedAt: null }, data: input }).catch(() => null);
    if (!row) return null;
    return {
      id: row.id,
      productLineId: row.productLineId,
      type: row.type,
      title: row.title,
      content: row.content,
      sourceRef: row.sourceRef,
      createdAt: row.createdAt,
    };
  }

  async removeResearch(id: number): Promise<void> {
    await this.prisma.ipdResearch.update({ where: { id, deletedAt: null }, data: { deletedAt: new Date() } });
  }

  async listDesignTasks(productLineId: number): Promise<DesignTaskItem[]> {
    const rows = await this.prisma.designTask.findMany({
      where: { productLineId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((row) => ({
      id: row.id,
      productLineId: row.productLineId,
      type: row.type,
      title: row.title,
      status: row.status,
      feasible: row.feasible,
      notes: row.notes,
      createdAt: row.createdAt,
    }));
  }

  async createDesignTask(productLineId: number, input: DesignTaskCreateInput): Promise<DesignTaskItem> {
    const row = await this.prisma.designTask.create({ data: { ...input, productLineId } });
    return {
      id: row.id,
      productLineId: row.productLineId,
      type: row.type,
      title: row.title,
      status: row.status,
      feasible: row.feasible,
      notes: row.notes,
      createdAt: row.createdAt,
    };
  }

  async updateDesignTask(id: number, input: DesignTaskUpdateInput): Promise<DesignTaskItem | null> {
    const row = await this.prisma.designTask.update({ where: { id, deletedAt: null }, data: input }).catch(() => null);
    if (!row) return null;
    return {
      id: row.id,
      productLineId: row.productLineId,
      type: row.type,
      title: row.title,
      status: row.status,
      feasible: row.feasible,
      notes: row.notes,
      createdAt: row.createdAt,
    };
  }

  async removeDesignTask(id: number): Promise<void> {
    await this.prisma.designTask.update({ where: { id, deletedAt: null }, data: { deletedAt: new Date() } });
  }

  async getPrototype(productLineId: number): Promise<PrototypeReviewItem | null> {
    const row = await this.prisma.prototypeReview.findFirst({
      where: { productLineId, deletedAt: null },
    });
    if (!row) return null;
    return {
      id: row.id,
      productLineId: row.productLineId,
      sampleReady: row.sampleReady,
      reviewPassed: row.reviewPassed,
      reviewNotes: row.reviewNotes,
      sharedWithGtm: row.sharedWithGtm,
      sharedAt: row.sharedAt,
      updatedAt: row.updatedAt,
    };
  }

  async upsertPrototype(productLineId: number, input: PrototypeReviewInput): Promise<PrototypeReviewItem> {
    const now = new Date();
    const shouldStampShare = input.sharedWithGtm === true;
    const row = await this.prisma.prototypeReview.upsert({
      where: { productLineId },
      create: {
        productLineId,
        sampleReady: input.sampleReady ?? false,
        reviewPassed: input.reviewPassed ?? false,
        reviewNotes: input.reviewNotes,
        sharedWithGtm: input.sharedWithGtm ?? false,
        sharedAt: shouldStampShare ? now : null,
      },
      update: {
        ...(input.sampleReady !== undefined ? { sampleReady: input.sampleReady } : {}),
        ...(input.reviewPassed !== undefined ? { reviewPassed: input.reviewPassed } : {}),
        ...(input.reviewNotes !== undefined ? { reviewNotes: input.reviewNotes } : {}),
        ...(input.sharedWithGtm !== undefined ? { sharedWithGtm: input.sharedWithGtm } : {}),
        ...(shouldStampShare ? { sharedAt: now } : {}),
      },
    });
    return {
      id: row.id,
      productLineId: row.productLineId,
      sampleReady: row.sampleReady,
      reviewPassed: row.reviewPassed,
      reviewNotes: row.reviewNotes,
      sharedWithGtm: row.sharedWithGtm,
      sharedAt: row.sharedAt,
      updatedAt: row.updatedAt,
    };
  }

  async getDecision(productLineId: number): Promise<InvestDecisionItem | null> {
    const row = await this.prisma.investDecision.findFirst({ where: { productLineId, deletedAt: null } });
    if (!row) return null;
    return this.toDecision(row);
  }

  async upsertDecision(productLineId: number, input: InvestDecisionInput): Promise<InvestDecisionItem> {
    const current = await this.prisma.investDecision.findFirst({ where: { productLineId, deletedAt: null } });
    const result = input.result ?? current?.result ?? "pending";
    const decidedAt = result !== "pending" ? (current?.decidedAt ?? new Date()) : (current?.decidedAt ?? null);
    const data = {
      ...(input.gtmFeedbackSummary !== undefined ? { gtmFeedbackSummary: input.gtmFeedbackSummary } : {}),
      ...(input.iscSummary !== undefined ? { iscSummary: input.iscSummary } : {}),
      ...(input.targetPriceUsd !== undefined ? { targetPriceUsd: input.targetPriceUsd } : {}),
      ...(input.unitCostUsd !== undefined ? { unitCostUsd: input.unitCostUsd } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      result,
      decidedAt,
    };
    const row = current
      ? await this.prisma.investDecision.update({ where: { id: current.id }, data })
      : await this.prisma.investDecision.create({ data: { ...data, productLineId } });
    return this.toDecision(row);
  }

  private toDecision(row: {
    id: number;
    productLineId: number;
    gtmFeedbackSummary: string | null;
    iscSummary: string | null;
    targetPriceUsd: unknown;
    unitCostUsd: unknown;
    result: string;
    decidedAt: Date | null;
    notes: string | null;
    updatedAt: Date;
  }): InvestDecisionItem {
    return {
      id: row.id,
      productLineId: row.productLineId,
      gtmFeedbackSummary: row.gtmFeedbackSummary,
      iscSummary: row.iscSummary,
      targetPriceUsd: row.targetPriceUsd === null ? null : Number(row.targetPriceUsd),
      unitCostUsd: row.unitCostUsd === null ? null : Number(row.unitCostUsd),
      result: row.result,
      decidedAt: row.decidedAt,
      notes: row.notes,
      updatedAt: row.updatedAt,
    };
  }

  async listReviews(productLineId: number): Promise<RoiReviewItem[]> {
    const rows = await this.prisma.roiReview.findMany({
      where: { productLineId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((row) => this.toReview(row));
  }

  async createReview(productLineId: number, input: RoiReviewCreateInput): Promise<RoiReviewItem> {
    const row = await this.prisma.roiReview.create({ data: { ...input, productLineId } });
    return this.toReview(row);
  }

  async updateReview(id: number, input: RoiReviewUpdateInput): Promise<RoiReviewItem | null> {
    const row = await this.prisma.roiReview.update({ where: { id, deletedAt: null }, data: input }).catch(() => null);
    return row ? this.toReview(row) : null;
  }

  async removeReview(id: number): Promise<void> {
    await this.prisma.roiReview.update({ where: { id, deletedAt: null }, data: { deletedAt: new Date() } });
  }

  private toReview(row: {
    id: number;
    productLineId: number;
    phase: string;
    salesUsd: unknown;
    adCostUsd: unknown;
    productCostUsd: unknown;
    fulfillmentCostUsd: unknown;
    refundUsd: unknown;
    afterSaleCostUsd: unknown;
    roi: unknown;
    decision: string | null;
    notes: string | null;
    createdAt: Date;
  }): RoiReviewItem {
    return {
      id: row.id,
      productLineId: row.productLineId,
      phase: row.phase,
      salesUsd: Number(row.salesUsd),
      adCostUsd: Number(row.adCostUsd),
      productCostUsd: Number(row.productCostUsd),
      fulfillmentCostUsd: Number(row.fulfillmentCostUsd),
      refundUsd: Number(row.refundUsd),
      afterSaleCostUsd: Number(row.afterSaleCostUsd),
      roi: row.roi === null ? null : Number(row.roi),
      decision: row.decision,
      notes: row.notes,
      createdAt: row.createdAt,
    };
  }
}
