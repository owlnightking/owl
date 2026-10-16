import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { SPU_STATUS } from "@owl/shared";
import { nextYearlyCode } from "../domain/code.util";
import {
  SPU_REPOSITORY,
  type SkuCreateInput,
  type SkuItem,
  type SkuUpdateInput,
  type SpuCreateInput,
  type SpuItem,
  type SpuListOptions,
  type SpuRepositoryPort,
  type SpuUpdateInput,
} from "../domain/spu.ports";

const SPU_CODE_PREFIX = "SPU";

@Injectable()
export class SpuService {
  constructor(@Inject(SPU_REPOSITORY) private readonly repo: SpuRepositoryPort) {}

  async list(options: SpuListOptions): Promise<{ items: SpuItem[]; total: number }> {
    if (options.status && !Object.values(SPU_STATUS).includes(options.status as never)) {
      throw new BadRequestException(`SPU 状态无效，可选：${Object.values(SPU_STATUS).join(" / ")}`);
    }
    return this.repo.list(options);
  }

  async findById(id: number): Promise<SpuItem> {
    const item = await this.repo.findById(id);
    if (!item) throw new NotFoundException(`spu ${id} not found`);
    return item;
  }

  async create(productLineId: number, input: SpuCreateInput): Promise<SpuItem> {
    const codes = await this.repo.listAllInternalCodes();
    const internalCode = nextYearlyCode(SPU_CODE_PREFIX, codes, new Date().getFullYear());
    return this.repo.create(productLineId, { ...input, internalCode });
  }

  async update(id: number, input: SpuUpdateInput): Promise<SpuItem> {
    if (input.status !== undefined && !Object.values(SPU_STATUS).includes(input.status as never)) {
      throw new BadRequestException(`SPU 状态无效，可选：${Object.values(SPU_STATUS).join(" / ")}`);
    }
    const item = await this.repo.update(id, input);
    if (!item) throw new NotFoundException(`spu ${id} not found`);
    return item;
  }

  async remove(id: number): Promise<void> {
    const item = await this.repo.findById(id);
    if (!item) throw new NotFoundException(`spu ${id} not found`);
    await this.repo.remove(id);
  }

  async listSkus(spuId: number): Promise<SkuItem[]> {
    const spu = await this.repo.findById(spuId);
    if (!spu) throw new NotFoundException(`spu ${spuId} not found`);
    return this.repo.listSkus(spuId);
  }

  async createSku(spuId: number, input: SkuCreateInput): Promise<SkuItem> {
    const spu = await this.repo.findById(spuId);
    if (!spu) throw new NotFoundException(`spu ${spuId} not found`);
    if (input.priceUsd < 0) throw new BadRequestException("SKU 美元售价不能为负数");
    return this.repo.createSku(spuId, input);
  }

  async updateSku(id: number, input: SkuUpdateInput): Promise<SkuItem> {
    if (input.priceUsd !== undefined && input.priceUsd < 0) {
      throw new BadRequestException("SKU 美元售价不能为负数");
    }
    const item = await this.repo.updateSku(id, input);
    if (!item) throw new NotFoundException(`sku ${id} not found`);
    return item;
  }

  async removeSku(id: number): Promise<void> {
    const item = await this.repo.updateSku(id, {});
    if (!item) throw new NotFoundException(`sku ${id} not found`);
    await this.repo.removeSku(id);
  }
}
