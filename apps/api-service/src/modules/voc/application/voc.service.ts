import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { VOC_CATEGORY, VOC_SOURCE, VOC_STATUS } from "@owl/shared";
import { PRODUCT_LINE_SERVICE, SPU_SERVICE, type ProductLineService, type SpuService } from "../../ipd";
import {
  VOC_REPOSITORY,
  type VocRepositoryPort,
  type VocTicketCreateInput,
  type VocTicketItem,
  type VocTicketListOptions,
  type VocTicketUpdateInput,
} from "../domain/voc.ports";

@Injectable()
export class VocService {
  constructor(
    @Inject(VOC_REPOSITORY) private readonly repo: VocRepositoryPort,
    @Inject(PRODUCT_LINE_SERVICE) private readonly productLineService: ProductLineService,
    @Inject(SPU_SERVICE) private readonly spuService: SpuService
  ) {}

  async list(options: VocTicketListOptions): Promise<{ items: VocTicketItem[]; total: number }> {
    this.assertOneOf(options.source, Object.values(VOC_SOURCE), "反馈渠道");
    this.assertOneOf(options.category, Object.values(VOC_CATEGORY), "反馈分类");
    this.assertOneOf(options.status, Object.values(VOC_STATUS), "工单状态");
    return this.repo.list(options);
  }

  async findById(id: number): Promise<VocTicketItem> {
    const item = await this.repo.findById(id);
    if (!item) throw new NotFoundException(`voc ticket ${id} not found`);
    return item;
  }

  async create(input: VocTicketCreateInput): Promise<VocTicketItem> {
    this.assertOneOf(input.source, Object.values(VOC_SOURCE), "反馈渠道");
    this.assertOneOf(input.category, Object.values(VOC_CATEGORY), "反馈分类");
    this.assertOneOf(input.status, Object.values(VOC_STATUS), "工单状态");
    if (input.productLineId !== undefined) await this.productLineService.findById(input.productLineId);
    if (input.spuId !== undefined) await this.spuService.findById(input.spuId);
    return this.repo.create(input);
  }

  async update(id: number, input: VocTicketUpdateInput): Promise<VocTicketItem> {
    this.assertOneOf(input.category, Object.values(VOC_CATEGORY), "反馈分类");
    this.assertOneOf(input.status, Object.values(VOC_STATUS), "工单状态");
    if (input.productLineId !== undefined) await this.productLineService.findById(input.productLineId);
    if (input.spuId !== undefined) await this.spuService.findById(input.spuId);
    const item = await this.repo.update(id, input);
    if (!item) throw new NotFoundException(`voc ticket ${id} not found`);
    return item;
  }

  async remove(id: number): Promise<void> {
    const removed = await this.repo.remove(id);
    if (!removed) throw new NotFoundException(`voc ticket ${id} not found`);
  }

  private assertOneOf(value: string | undefined, allowed: string[], label: string): void {
    if (value === undefined) return;
    if (!allowed.includes(value)) {
      throw new BadRequestException(`${label}无效，可选：${allowed.join(" / ")}`);
    }
  }
}
