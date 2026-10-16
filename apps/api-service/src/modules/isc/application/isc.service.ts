import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  OVERSEAS_WAREHOUSE,
  PRODUCTION_STATUS,
  PRODUCTION_TYPE,
  SHIPMENT_MODE,
  SHIPMENT_STATUS,
  SUPPLIER_COOP_STATUS,
} from "@owl/shared";
import { EXCHANGE_RATE_SERVICE, type ExchangeRateServicePort } from "../../exchange-rate";
import { PRODUCT_LINE_SERVICE, SPU_SERVICE, type ProductLineService, type SpuService } from "../../ipd";
import { convertCnyToUsd } from "../../../common/money/cny-usd";
import {
  ISC_REPOSITORY,
  SUPPLIER_SERVICE,
  type IscRepositoryPort,
  type ProductionCreateInput,
  type ProductionItem,
  type ProductionListOptions,
  type ProductionUpdateInput,
  type QuoteCreateInput,
  type QuoteItem,
  type QuoteListOptions,
  type QuoteUpdateInput,
  type ShipmentCreateInput,
  type ShipmentItem,
  type ShipmentListOptions,
  type ShipmentUpdateInput,
  type SupplierCreateInput,
  type SupplierItem,
  type SupplierListOptions,
  type SupplierUpdateInput,
} from "../domain/isc.ports";

const BASE_CURRENCY = "CNY";
const QUOTE_CURRENCY = "USD";

function assertOneOf(value: string | undefined, allowed: string[], label: string): void {
  if (value === undefined) return;
  if (!allowed.includes(value)) throw new BadRequestException(`${label}无效，可选：${allowed.join(" / ")}`);
}

@Injectable()
export class SupplierService {
  constructor(
    @Inject(ISC_REPOSITORY) private readonly repo: IscRepositoryPort,
    @Inject(EXCHANGE_RATE_SERVICE) private readonly exchangeRateService: ExchangeRateServicePort,
    @Inject(PRODUCT_LINE_SERVICE) private readonly productLineService: ProductLineService,
    @Inject(SPU_SERVICE) private readonly spuService: SpuService
  ) {}

  async list(options: SupplierListOptions): Promise<{ items: SupplierItem[]; total: number }> {
    assertOneOf(options.coopStatus, Object.values(SUPPLIER_COOP_STATUS), "合作状态");
    return this.repo.listSuppliers(options);
  }

  async findById(id: number): Promise<SupplierItem> {
    const item = await this.repo.findSupplierById(id);
    if (!item) throw new NotFoundException(`supplier ${id} not found`);
    return item;
  }

  async create(input: SupplierCreateInput): Promise<SupplierItem> {
    assertOneOf(input.coopStatus, Object.values(SUPPLIER_COOP_STATUS), "合作状态");
    return this.repo.createSupplier(input);
  }

  async update(id: number, input: SupplierUpdateInput): Promise<SupplierItem> {
    assertOneOf(input.coopStatus, Object.values(SUPPLIER_COOP_STATUS), "合作状态");
    const item = await this.repo.updateSupplier(id, input);
    if (!item) throw new NotFoundException(`supplier ${id} not found`);
    return item;
  }

  async remove(id: number): Promise<void> {
    const item = await this.repo.findSupplierById(id);
    if (!item) throw new NotFoundException(`supplier ${id} not found`);
    await this.repo.removeSupplier(id);
  }

  async listQuotes(options: QuoteListOptions): Promise<{ items: QuoteItem[]; total: number }> {
    return this.repo.listQuotes(options);
  }

  // 报价：人民币录入 → 按最新汇率（或指定汇率）折算美元快照
  async createQuote(input: QuoteCreateInput): Promise<QuoteItem> {
    await this.findById(input.supplierId);
    if (input.productLineId !== undefined) await this.productLineService.findById(input.productLineId);
    if (input.spuId !== undefined) await this.spuService.findById(input.spuId);
    const exchangeRate = await this.resolveRate(input.exchangeRate);
    const amountUsd = convertCnyToUsd(input.amountCny, exchangeRate);
    return this.repo.createQuote({ ...input, exchangeRate, amountUsd });
  }

  async updateQuote(id: number, input: QuoteUpdateInput): Promise<QuoteItem> {
    const current = await this.repo.findQuoteById(id);
    if (!current) throw new NotFoundException(`quote ${id} not found`);
    let exchangeRate: number | undefined;
    let amountUsd: number | undefined;
    if (input.amountCny !== undefined || input.exchangeRate !== undefined) {
      exchangeRate = input.exchangeRate ?? current.exchangeRate;
      amountUsd = convertCnyToUsd(input.amountCny ?? current.amountCny, exchangeRate);
    }
    const item = await this.repo.updateQuote(id, { ...input, exchangeRate, amountUsd });
    if (!item) throw new NotFoundException(`quote ${id} not found`);
    return item;
  }

  async removeQuote(id: number): Promise<void> {
    const item = await this.repo.findQuoteById(id);
    if (!item) throw new NotFoundException(`quote ${id} not found`);
    await this.repo.removeQuote(id);
  }

  private async resolveRate(explicit?: number): Promise<number> {
    if (explicit !== undefined) return explicit;
    const latest = await this.exchangeRateService.latest(BASE_CURRENCY, QUOTE_CURRENCY);
    if (!latest) {
      throw new BadRequestException("暂无 CNY→USD 汇率，请先在汇率管理中维护");
    }
    return latest.rate;
  }
}

@Injectable()
export class ProductionService {
  constructor(
    @Inject(ISC_REPOSITORY) private readonly repo: IscRepositoryPort,
    @Inject(SPU_SERVICE) private readonly spuService: SpuService,
    @Inject(SUPPLIER_SERVICE) private readonly supplierService: SupplierService
  ) {}

  async list(options: ProductionListOptions): Promise<{ items: ProductionItem[]; total: number }> {
    assertOneOf(options.type, Object.values(PRODUCTION_TYPE), "生产类型");
    assertOneOf(options.status, Object.values(PRODUCTION_STATUS), "生产状态");
    return this.repo.listProductions(options);
  }

  async create(spuId: number, input: ProductionCreateInput): Promise<ProductionItem> {
    await this.spuService.findById(spuId);
    await this.supplierService.findById(input.supplierId);
    assertOneOf(input.type, Object.values(PRODUCTION_TYPE), "生产类型");
    assertOneOf(input.status, Object.values(PRODUCTION_STATUS), "生产状态");
    if (input.quantity !== undefined && input.quantity < 0) throw new BadRequestException("生产数量不能为负数");
    return this.repo.createProduction(spuId, input);
  }

  async update(id: number, input: ProductionUpdateInput): Promise<ProductionItem> {
    if (input.supplierId !== undefined) await this.supplierService.findById(input.supplierId);
    assertOneOf(input.type, Object.values(PRODUCTION_TYPE), "生产类型");
    assertOneOf(input.status, Object.values(PRODUCTION_STATUS), "生产状态");
    const item = await this.repo.updateProduction(id, input);
    if (!item) throw new NotFoundException(`production ${id} not found`);
    return item;
  }

  async remove(id: number): Promise<void> {
    const item = await this.repo.updateProduction(id, {});
    if (!item) throw new NotFoundException(`production ${id} not found`);
    await this.repo.removeProduction(id);
  }
}

@Injectable()
export class ShipmentService {
  constructor(
    @Inject(ISC_REPOSITORY) private readonly repo: IscRepositoryPort,
    @Inject(PRODUCT_LINE_SERVICE) private readonly productLineService: ProductLineService,
    @Inject(SPU_SERVICE) private readonly spuService: SpuService,
    @Inject(SUPPLIER_SERVICE) private readonly supplierService: SupplierService,
    @Inject(EXCHANGE_RATE_SERVICE) private readonly exchangeRateService: ExchangeRateServicePort
  ) {}

  async list(options: ShipmentListOptions): Promise<{ items: ShipmentItem[]; total: number }> {
    assertOneOf(options.mode, Object.values(SHIPMENT_MODE), "运输方式");
    assertOneOf(options.warehouse, Object.values(OVERSEAS_WAREHOUSE), "海外仓");
    assertOneOf(options.status, Object.values(SHIPMENT_STATUS), "物流状态");
    return this.repo.listShipments(options);
  }

  // 头程 / 物流：成本人民币录入 → 汇率快照折算美元；产品线可由 SPU 推导
  async create(input: ShipmentCreateInput): Promise<ShipmentItem> {
    let productLineId = input.productLineId;
    if (input.spuId !== undefined) {
      const spu = await this.spuService.findById(input.spuId);
      productLineId = productLineId ?? spu.productLineId;
    }
    if (productLineId === undefined) {
      throw new BadRequestException("头程物流单必须关联产品线或 SPU");
    }
    await this.productLineService.findById(productLineId);
    if (input.supplierId !== undefined) await this.supplierService.findById(input.supplierId);
    assertOneOf(input.mode, Object.values(SHIPMENT_MODE), "运输方式");
    assertOneOf(input.warehouse, Object.values(OVERSEAS_WAREHOUSE), "海外仓");
    assertOneOf(input.status, Object.values(SHIPMENT_STATUS), "物流状态");

    let costUsd: number | undefined;
    let exchangeRate: number | undefined;
    if (input.costCny !== undefined) {
      exchangeRate = input.exchangeRate ?? (await this.latestRate());
      costUsd = convertCnyToUsd(input.costCny, exchangeRate);
    }
    return this.repo.createShipment({ ...input, productLineId, costUsd, exchangeRate });
  }

  async update(id: number, input: ShipmentUpdateInput): Promise<ShipmentItem> {
    if (input.spuId !== undefined) await this.spuService.findById(input.spuId);
    if (input.supplierId !== undefined) await this.supplierService.findById(input.supplierId);
    assertOneOf(input.mode, Object.values(SHIPMENT_MODE), "运输方式");
    assertOneOf(input.warehouse, Object.values(OVERSEAS_WAREHOUSE), "海外仓");
    assertOneOf(input.status, Object.values(SHIPMENT_STATUS), "物流状态");

    let costUsd: number | undefined;
    let exchangeRate: number | undefined;
    if (input.costCny !== undefined || input.exchangeRate !== undefined) {
      const existing = await this.repo.findShipmentById(id);
      if (!existing) throw new NotFoundException(`shipment ${id} not found`);
      exchangeRate = input.exchangeRate ?? existing.exchangeRate ?? (await this.latestRate());
      costUsd = convertCnyToUsd(input.costCny ?? existing.costCny ?? 0, exchangeRate);
    }
    const item = await this.repo.updateShipment(id, { ...input, costUsd, exchangeRate });
    if (!item) throw new NotFoundException(`shipment ${id} not found`);
    return item;
  }

  async remove(id: number): Promise<void> {
    const item = await this.repo.findShipmentById(id);
    if (!item) throw new NotFoundException(`shipment ${id} not found`);
    await this.repo.removeShipment(id);
  }

  private async latestRate(): Promise<number> {
    const latest = await this.exchangeRateService.latest(BASE_CURRENCY, QUOTE_CURRENCY);
    if (!latest) throw new BadRequestException("暂无 CNY→USD 汇率，请先在汇率管理中维护");
    return latest.rate;
  }
}
