import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { CAMPAIGN_PLATFORM, CAMPAIGN_STATUS, CAMPAIGN_TYPE, KOL_COOP_STATUS } from "@owl/shared";
import { PRODUCT_LINE_SERVICE, SPU_SERVICE, type ProductLineService, type SpuService } from "../../ipd";
import {
  GTM_REPOSITORY,
  KOL_SERVICE,
  type CampaignCreateInput,
  type CampaignItem,
  type CampaignListOptions,
  type CampaignUpdateInput,
  type FeedbackCreateInput,
  type FeedbackItem,
  type FeedbackListOptions,
  type FeedbackUpdateInput,
  type GtmRepositoryPort,
  type KolCreateInput,
  type KolItem,
  type KolListOptions,
  type KolUpdateInput,
  type PresaleCreateInput,
  type PresaleItem,
  type PresaleListOptions,
  type PresaleUpdateInput,
} from "../domain/gtm.ports";

@Injectable()
export class KolService {
  constructor(@Inject(GTM_REPOSITORY) private readonly repo: GtmRepositoryPort) {}

  async list(options: KolListOptions): Promise<{ items: KolItem[]; total: number }> {
    this.assertOneOf(options.platform, Object.values(CAMPAIGN_PLATFORM), "平台");
    this.assertOneOf(options.coopStatus, Object.values(KOL_COOP_STATUS), "合作状态");
    return this.repo.listKols(options);
  }

  async findById(id: number): Promise<KolItem> {
    const item = await this.repo.findKolById(id);
    if (!item) throw new NotFoundException(`kol ${id} not found`);
    return item;
  }

  async create(input: KolCreateInput): Promise<KolItem> {
    this.assertOneOf(input.platform, Object.values(CAMPAIGN_PLATFORM), "平台");
    this.assertOneOf(input.coopStatus, Object.values(KOL_COOP_STATUS), "合作状态");
    if (input.totalSpentUsd !== undefined && input.totalSpentUsd < 0) {
      throw new BadRequestException("累计花费不能为负数（美元）");
    }
    return this.repo.createKol(input);
  }

  async update(id: number, input: KolUpdateInput): Promise<KolItem> {
    this.assertOneOf(input.platform, Object.values(CAMPAIGN_PLATFORM), "平台");
    this.assertOneOf(input.coopStatus, Object.values(KOL_COOP_STATUS), "合作状态");
    const item = await this.repo.updateKol(id, input);
    if (!item) throw new NotFoundException(`kol ${id} not found`);
    return item;
  }

  async remove(id: number): Promise<void> {
    const item = await this.repo.findKolById(id);
    if (!item) throw new NotFoundException(`kol ${id} not found`);
    await this.repo.removeKol(id);
  }

  private assertOneOf(value: string | undefined, allowed: string[], label: string): void {
    if (value === undefined) return;
    if (!allowed.includes(value)) throw new BadRequestException(`${label}无效，可选：${allowed.join(" / ")}`);
  }
}

@Injectable()
export class CampaignService {
  constructor(
    @Inject(GTM_REPOSITORY) private readonly repo: GtmRepositoryPort,
    @Inject(PRODUCT_LINE_SERVICE) private readonly productLineService: ProductLineService,
    @Inject(KOL_SERVICE) private readonly kolService: KolService
  ) {}

  async list(options: CampaignListOptions): Promise<{ items: CampaignItem[]; total: number }> {
    this.assertOneOf(options.type, Object.values(CAMPAIGN_TYPE), "campaign 类型");
    this.assertOneOf(options.platform, Object.values(CAMPAIGN_PLATFORM), "投放平台");
    this.assertOneOf(options.status, Object.values(CAMPAIGN_STATUS), "campaign 状态");
    return this.repo.listCampaigns(options);
  }

  async create(productLineId: number, input: CampaignCreateInput): Promise<CampaignItem> {
    await this.productLineService.findById(productLineId);
    this.assertOneOf(input.type, Object.values(CAMPAIGN_TYPE), "campaign 类型");
    this.assertOneOf(input.platform, Object.values(CAMPAIGN_PLATFORM), "投放平台");
    this.assertOneOf(input.status, Object.values(CAMPAIGN_STATUS), "campaign 状态");
    if (input.kolId !== undefined) await this.kolService.findById(input.kolId);
    this.assertUsd(input.budgetUsd, "预算");
    this.assertUsd(input.spentUsd, "已花费");
    return this.repo.createCampaign(productLineId, input);
  }

  async update(id: number, input: CampaignUpdateInput): Promise<CampaignItem> {
    this.assertOneOf(input.type, Object.values(CAMPAIGN_TYPE), "campaign 类型");
    this.assertOneOf(input.platform, Object.values(CAMPAIGN_PLATFORM), "投放平台");
    this.assertOneOf(input.status, Object.values(CAMPAIGN_STATUS), "campaign 状态");
    if (input.kolId !== undefined) await this.kolService.findById(input.kolId);
    this.assertUsd(input.budgetUsd, "预算");
    this.assertUsd(input.spentUsd, "已花费");
    const item = await this.repo.updateCampaign(id, input);
    if (!item) throw new NotFoundException(`campaign ${id} not found`);
    return item;
  }

  async remove(id: number): Promise<void> {
    const item = await this.repo.updateCampaign(id, {});
    if (!item) throw new NotFoundException(`campaign ${id} not found`);
    await this.repo.removeCampaign(id);
  }

  private assertUsd(value: number | undefined, label: string): void {
    if (value !== undefined && value < 0) throw new BadRequestException(`${label}不能为负数（美元）`);
  }

  private assertOneOf(value: string | undefined, allowed: string[], label: string): void {
    if (value === undefined) return;
    if (!allowed.includes(value)) throw new BadRequestException(`${label}无效，可选：${allowed.join(" / ")}`);
  }
}
@Injectable()
export class FeedbackService {
  constructor(
    @Inject(GTM_REPOSITORY) private readonly repo: GtmRepositoryPort,
    @Inject(PRODUCT_LINE_SERVICE) private readonly productLineService: ProductLineService
  ) {}

  async list(options: FeedbackListOptions): Promise<{ items: FeedbackItem[]; total: number }> {
    return this.repo.listFeedbacks(options);
  }

  async create(productLineId: number, input: FeedbackCreateInput): Promise<FeedbackItem> {
    await this.productLineService.findById(productLineId);
    return this.repo.createFeedback(productLineId, input);
  }

  async update(id: number, input: FeedbackUpdateInput): Promise<FeedbackItem> {
    const item = await this.repo.updateFeedback(id, input);
    if (!item) throw new NotFoundException(`feedback ${id} not found`);
    return item;
  }

  async remove(id: number): Promise<void> {
    const item = await this.repo.updateFeedback(id, {});
    if (!item) throw new NotFoundException(`feedback ${id} not found`);
    await this.repo.removeFeedback(id);
  }
}

@Injectable()
export class PresaleService {
  constructor(
    @Inject(GTM_REPOSITORY) private readonly repo: GtmRepositoryPort,
    @Inject(SPU_SERVICE) private readonly spuService: SpuService
  ) {}

  async list(options: PresaleListOptions): Promise<{ items: PresaleItem[]; total: number }> {
    return this.repo.listPresales(options);
  }

  async create(spuId: number, input: PresaleCreateInput): Promise<PresaleItem> {
    const spu = await this.spuService.findById(spuId);
    if (input.priceUsd !== undefined && input.priceUsd < 0) {
      throw new BadRequestException("预售价不能为负数（美元）");
    }
    if (input.quantity !== undefined && input.quantity < 0) {
      throw new BadRequestException("预售数量不能为负数");
    }
    return this.repo.createPresale(spuId, { ...input, productLineId: spu.productLineId });
  }

  async update(id: number, input: PresaleUpdateInput): Promise<PresaleItem> {
    if (input.priceUsd !== undefined && input.priceUsd < 0) {
      throw new BadRequestException("预售价不能为负数（美元）");
    }
    if (input.quantity !== undefined && input.quantity < 0) {
      throw new BadRequestException("预售数量不能为负数");
    }
    const item = await this.repo.updatePresale(id, input);
    if (!item) throw new NotFoundException(`presale ${id} not found`);
    return item;
  }

  async remove(id: number): Promise<void> {
    const item = await this.repo.updatePresale(id, {});
    if (!item) throw new NotFoundException(`presale ${id} not found`);
    await this.repo.removePresale(id);
  }
}
