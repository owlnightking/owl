import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  IPD_STAGE_LABELS,
  LIFECYCLE_STAGE_LABELS,
  PRODUCT_LINE_IPD_STAGE,
  PRODUCT_LINE_LIFECYCLE_STAGE,
  type ProductLineIpdStage,
  type ProductLineLifecycleStage,
} from "@owl/shared";
import { nextYearlyCode } from "../domain/code.util";
import {
  PRODUCT_LINE_REPOSITORY,
  type ProductLineCreateInput,
  type ProductLineDetail,
  type ProductLineListOptions,
  type ProductLineRepositoryPort,
  type ProductLineUpdateInput,
} from "../domain/product-line.ports";

const CODE_PREFIX = "PL";

@Injectable()
export class ProductLineService {
  constructor(@Inject(PRODUCT_LINE_REPOSITORY) private readonly repo: ProductLineRepositoryPort) {}

  async list(options: ProductLineListOptions): Promise<{ items: ProductLineDetail[]; total: number }> {
    this.assertStageValue(options.ipdStage, Object.values(PRODUCT_LINE_IPD_STAGE), "IPD 阶段");
    this.assertStageValue(options.lifecycleStage, Object.values(PRODUCT_LINE_LIFECYCLE_STAGE), "生命周期");
    return this.repo.list(options);
  }

  async findById(id: number): Promise<ProductLineDetail> {
    return this.mustFind(await this.repo.findById(id), id);
  }

  async create(input: ProductLineCreateInput): Promise<ProductLineDetail> {
    const codes = await this.repo.listAllCodes();
    const code = nextYearlyCode(CODE_PREFIX, codes, new Date().getFullYear());
    return this.repo.create({ ...input, code });
  }

  async update(id: number, input: ProductLineUpdateInput): Promise<ProductLineDetail> {
    return this.mustFind(await this.repo.update(id, input), id);
  }

  async updateStages(id: number, input: { ipdStage?: string; lifecycleStage?: string }): Promise<ProductLineDetail> {
    this.assertStageValue(input.ipdStage, Object.values(PRODUCT_LINE_IPD_STAGE), "IPD 阶段");
    this.assertStageValue(input.lifecycleStage, Object.values(PRODUCT_LINE_LIFECYCLE_STAGE), "生命周期");
    return this.mustFind(await this.repo.updateStages(id, input), id);
  }

  // 投决通过 → 立项期自动进入预售期（业务映射：投决通过后开始小批量预售）
  async applyDecisionOutcome(id: number, result: string): Promise<void> {
    if (result !== "approved") return;
    const item = await this.repo.findById(id);
    if (!item || item.lifecycleStage !== PRODUCT_LINE_LIFECYCLE_STAGE.INCUBATING) return;
    await this.repo.updateStages(id, { lifecycleStage: PRODUCT_LINE_LIFECYCLE_STAGE.PRESALE });
  }

  // 复盘决策为清货 → 生命周期切清货期
  async applyReviewOutcome(id: number, decision: string | null): Promise<void> {
    if (decision !== "liquidate") return;
    await this.repo.updateStages(id, { lifecycleStage: PRODUCT_LINE_LIFECYCLE_STAGE.LIQUIDATION });
  }

  async remove(id: number): Promise<void> {
    this.mustFind(await this.repo.findById(id), id);
    await this.repo.remove(id);
  }

  private assertStageValue(value: string | undefined, allowed: string[], label: string): void {
    if (value === undefined) return;
    if (!allowed.includes(value)) {
      const labels = allowed.map((code) => `${code}(${this.labelOf(code, label)})`).join(" / ");
      throw new BadRequestException(`${label}无效，可选：${labels}`);
    }
  }

  private labelOf(code: string, label: string): string {
    if (label === "IPD 阶段") {
      return IPD_STAGE_LABELS[code as ProductLineIpdStage] ?? code;
    }
    return LIFECYCLE_STAGE_LABELS[code as ProductLineLifecycleStage] ?? code;
  }

  private mustFind<T extends { id: number }>(item: T | null, id: number): T {
    if (!item) throw new NotFoundException(`product line ${id} not found`);
    return item;
  }
}
