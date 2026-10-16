import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  DESIGN_TASK_STATUS,
  DESIGN_TASK_TYPE,
  INVEST_DECISION_RESULT,
  RESEARCH_TYPE,
  ROI_REVIEW_DECISION,
  ROI_REVIEW_PHASE,
} from "@owl/shared";
import { PRODUCT_LINE_SERVICE } from "../domain/product-line.ports";
import type { ProductLineService } from "./product-line.service";
import {
  IPD_STAGE_REPOSITORY,
  type DesignTaskCreateInput,
  type DesignTaskItem,
  type DesignTaskUpdateInput,
  type InvestDecisionInput,
  type InvestDecisionItem,
  type IpdStageRepositoryPort,
  type PrototypeReviewInput,
  type PrototypeReviewItem,
  type ResearchCreateInput,
  type ResearchItem,
  type ResearchUpdateInput,
  type RoiReviewCreateInput,
  type RoiReviewItem,
  type RoiReviewUpdateInput,
} from "../domain/ipd.ports";

@Injectable()
export class IpdStageService {
  constructor(
    @Inject(IPD_STAGE_REPOSITORY) private readonly repo: IpdStageRepositoryPort,
    @Inject(PRODUCT_LINE_SERVICE) private readonly productLineService: ProductLineService
  ) {}

  async listResearches(productLineId: number): Promise<ResearchItem[]> {
    await this.ensureLine(productLineId);
    return this.repo.listResearches(productLineId);
  }

  async createResearch(productLineId: number, input: ResearchCreateInput): Promise<ResearchItem> {
    await this.ensureLine(productLineId);
    this.assertOneOf(input.type, Object.values(RESEARCH_TYPE), "调研类型");
    return this.repo.createResearch(productLineId, input);
  }

  async updateResearch(id: number, input: ResearchUpdateInput): Promise<ResearchItem> {
    if (input.type !== undefined) this.assertOneOf(input.type, Object.values(RESEARCH_TYPE), "调研类型");
    const item = await this.repo.updateResearch(id, input);
    if (!item) throw new NotFoundException(`research ${id} not found`);
    return item;
  }

  async removeResearch(id: number): Promise<void> {
    const item = await this.repo.updateResearch(id, {});
    if (!item) throw new NotFoundException(`research ${id} not found`);
    await this.repo.removeResearch(id);
  }

  async listDesignTasks(productLineId: number): Promise<DesignTaskItem[]> {
    await this.ensureLine(productLineId);
    return this.repo.listDesignTasks(productLineId);
  }

  async createDesignTask(productLineId: number, input: DesignTaskCreateInput): Promise<DesignTaskItem> {
    await this.ensureLine(productLineId);
    this.assertOneOf(input.type, Object.values(DESIGN_TASK_TYPE), "设计类型");
    if (input.status !== undefined) this.assertOneOf(input.status, Object.values(DESIGN_TASK_STATUS), "任务状态");
    return this.repo.createDesignTask(productLineId, input);
  }

  async updateDesignTask(id: number, input: DesignTaskUpdateInput): Promise<DesignTaskItem> {
    if (input.type !== undefined) this.assertOneOf(input.type, Object.values(DESIGN_TASK_TYPE), "设计类型");
    if (input.status !== undefined) this.assertOneOf(input.status, Object.values(DESIGN_TASK_STATUS), "任务状态");
    const item = await this.repo.updateDesignTask(id, input);
    if (!item) throw new NotFoundException(`design task ${id} not found`);
    return item;
  }

  async removeDesignTask(id: number): Promise<void> {
    const item = await this.repo.updateDesignTask(id, {});
    if (!item) throw new NotFoundException(`design task ${id} not found`);
    await this.repo.removeDesignTask(id);
  }

  async getPrototype(productLineId: number): Promise<PrototypeReviewItem | null> {
    await this.ensureLine(productLineId);
    return this.repo.getPrototype(productLineId);
  }

  async upsertPrototype(productLineId: number, input: PrototypeReviewInput): Promise<PrototypeReviewItem> {
    await this.ensureLine(productLineId);
    // 推送 GTM 共建必须手办样完成且内部评审通过
    if (input.sharedWithGtm === true) {
      const current = await this.repo.getPrototype(productLineId);
      const sampleReady = input.sampleReady ?? current?.sampleReady ?? false;
      const reviewPassed = input.reviewPassed ?? current?.reviewPassed ?? false;
      if (!sampleReady || !reviewPassed) {
        throw new BadRequestException("推送 GTM 共建前必须完成手办样并通过内部评审");
      }
    }
    return this.repo.upsertPrototype(productLineId, input);
  }

  async getDecision(productLineId: number): Promise<InvestDecisionItem | null> {
    await this.ensureLine(productLineId);
    return this.repo.getDecision(productLineId);
  }

  async upsertDecision(productLineId: number, input: InvestDecisionInput): Promise<InvestDecisionItem> {
    await this.ensureLine(productLineId);
    if (input.result !== undefined) this.assertOneOf(input.result, Object.values(INVEST_DECISION_RESULT), "投决结果");
    if (input.targetPriceUsd !== undefined && input.targetPriceUsd < 0) {
      throw new BadRequestException("目标定价不能为负数");
    }
    if (input.unitCostUsd !== undefined && input.unitCostUsd < 0) {
      throw new BadRequestException("单位成本不能为负数");
    }
    const item = await this.repo.upsertDecision(productLineId, input);
    // 投决通过 → 生命周期自动进入预售期
    await this.productLineService.applyDecisionOutcome(productLineId, item.result);
    return item;
  }

  async listReviews(productLineId: number): Promise<RoiReviewItem[]> {
    await this.ensureLine(productLineId);
    return this.repo.listReviews(productLineId);
  }

  async createReview(productLineId: number, input: RoiReviewCreateInput): Promise<RoiReviewItem> {
    await this.ensureLine(productLineId);
    this.assertOneOf(input.phase, Object.values(ROI_REVIEW_PHASE), "复盘阶段");
    if (input.decision !== undefined) this.assertOneOf(input.decision, Object.values(ROI_REVIEW_DECISION), "复盘决策");
    const item = await this.repo.createReview(productLineId, input);
    // 复盘决策清货 → 生命周期切清货期
    await this.productLineService.applyReviewOutcome(productLineId, item.decision);
    return item;
  }

  async updateReview(id: number, input: RoiReviewUpdateInput): Promise<RoiReviewItem> {
    if (input.decision !== undefined) this.assertOneOf(input.decision, Object.values(ROI_REVIEW_DECISION), "复盘决策");
    const item = await this.repo.updateReview(id, input);
    if (!item) throw new NotFoundException(`roi review ${id} not found`);
    await this.productLineService.applyReviewOutcome(item.productLineId, item.decision);
    return item;
  }

  async removeReview(id: number): Promise<void> {
    const item = await this.repo.updateReview(id, {});
    if (!item) throw new NotFoundException(`roi review ${id} not found`);
    await this.repo.removeReview(id);
  }

  private assertOneOf(value: string | undefined, allowed: string[], label: string): void {
    if (value === undefined) return;
    if (!allowed.includes(value)) {
      throw new BadRequestException(`${label}无效，可选：${allowed.join(" / ")}`);
    }
  }

  private async ensureLine(productLineId: number) {
    return this.productLineService.findById(productLineId);
  }
}
