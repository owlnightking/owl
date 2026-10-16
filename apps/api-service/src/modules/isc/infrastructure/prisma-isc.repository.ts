import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CLIENT } from "@owl/database/provider";
import type { PrismaClient } from "@owl/database";
import type {
  IscRepositoryPort,
  ProductionCreateInput,
  ProductionItem,
  ProductionListOptions,
  ProductionUpdateInput,
  QuoteCreateInput,
  QuoteItem,
  QuoteListOptions,
  QuoteUpdateInput,
  ShipmentCreateInput,
  ShipmentItem,
  ShipmentListOptions,
  ShipmentUpdateInput,
  SupplierCreateInput,
  SupplierItem,
  SupplierListOptions,
  SupplierUpdateInput,
} from "../domain/isc.ports";

type SupplierRow = {
  id: number;
  name: string;
  contact: string | null;
  region: string | null;
  coopStatus: string;
  capability: string | null;
  notes: string | null;
  createdAt: Date;
};

type QuoteRow = {
  id: number;
  supplierId: number;
  supplier?: { name: string } | null;
  productLineId: number | null;
  productLine?: { name: string } | null;
  spuId: number | null;
  spu?: { name: string } | null;
  itemName: string;
  amountCny: unknown;
  exchangeRate: unknown;
  amountUsd: unknown;
  quotedAt: Date;
  notes: string | null;
  createdAt: Date;
};

type ProductionRow = {
  id: number;
  spuId: number;
  spu?: { name: string } | null;
  supplierId: number;
  supplier?: { name: string } | null;
  type: string;
  quantity: number;
  status: string;
  plannedAt: Date | null;
  completedAt: Date | null;
  notes: string | null;
  createdAt: Date;
};

type ShipmentRow = {
  id: number;
  productLineId: number;
  productLine?: { name: string } | null;
  spuId: number | null;
  spu?: { name: string } | null;
  supplierId: number | null;
  supplier?: { name: string } | null;
  mode: string;
  warehouse: string;
  status: string;
  trackingRef: string | null;
  costCny: unknown;
  exchangeRate: unknown;
  costUsd: unknown;
  etaDate: Date | null;
  receivedAt: Date | null;
  notes: string | null;
  createdAt: Date;
};

const QUOTE_INCLUDE = {
  supplier: { select: { name: true } },
  productLine: { select: { name: true } },
  spu: { select: { name: true } },
} as const;
const PRODUCTION_INCLUDE = {
  spu: { select: { name: true } },
  supplier: { select: { name: true } },
} as const;
const SHIPMENT_INCLUDE = {
  productLine: { select: { name: true } },
  spu: { select: { name: true } },
  supplier: { select: { name: true } },
} as const;

@Injectable()
export class PrismaIscRepository implements IscRepositoryPort {
  constructor(@Inject(DATABASE_CLIENT) private readonly prisma: PrismaClient) {}

  private toSupplier(row: SupplierRow): SupplierItem {
    return {
      id: row.id,
      name: row.name,
      contact: row.contact,
      region: row.region,
      coopStatus: row.coopStatus,
      capability: row.capability,
      notes: row.notes,
      createdAt: row.createdAt,
    };
  }

  async listSuppliers(options: SupplierListOptions): Promise<{ items: SupplierItem[]; total: number }> {
    const where = baseWhere();
    if (options.keyword) where.name = { contains: options.keyword, mode: "insensitive" };
    if (options.coopStatus) where.coopStatus = options.coopStatus;

    const [rows, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (options.page - 1) * options.pageSize,
        take: options.pageSize,
      }),
      this.prisma.supplier.count({ where }),
    ]);
    return { items: rows.map((row) => this.toSupplier(row)), total };
  }

  async findSupplierById(id: number): Promise<SupplierItem | null> {
    const row = await this.prisma.supplier.findFirst({ where: { id, deletedAt: null } });
    return row ? this.toSupplier(row) : null;
  }

  async createSupplier(input: SupplierCreateInput): Promise<SupplierItem> {
    const row = await this.prisma.supplier.create({ data: input });
    return this.toSupplier(row);
  }

  async updateSupplier(id: number, input: SupplierUpdateInput): Promise<SupplierItem | null> {
    const row = await this.prisma.supplier.update({ where: { id, deletedAt: null }, data: input }).catch(() => null);
    return row ? this.toSupplier(row) : null;
  }

  async removeSupplier(id: number): Promise<void> {
    await this.prisma.supplier.update({ where: { id, deletedAt: null }, data: { deletedAt: new Date() } });
  }

  private toQuote(row: QuoteRow): QuoteItem {
    return {
      id: row.id,
      supplierId: row.supplierId,
      supplierName: row.supplier?.name ?? "",
      productLineId: row.productLineId,
      productLineName: row.productLine?.name ?? null,
      spuId: row.spuId,
      spuName: row.spu?.name ?? null,
      itemName: row.itemName,
      amountCny: Number(row.amountCny),
      exchangeRate: Number(row.exchangeRate),
      amountUsd: Number(row.amountUsd),
      quotedAt: row.quotedAt,
      notes: row.notes,
      createdAt: row.createdAt,
    };
  }

  async listQuotes(options: QuoteListOptions): Promise<{ items: QuoteItem[]; total: number }> {
    const where = baseWhere();
    if (options.supplierId !== undefined) where.supplierId = options.supplierId;
    if (options.productLineId !== undefined) where.productLineId = options.productLineId;
    if (options.spuId !== undefined) where.spuId = options.spuId;

    const [rows, total] = await Promise.all([
      this.prisma.supplierQuote.findMany({
        where,
        include: QUOTE_INCLUDE,
        orderBy: { quotedAt: "desc" },
        skip: (options.page - 1) * options.pageSize,
        take: options.pageSize,
      }),
      this.prisma.supplierQuote.count({ where }),
    ]);
    return { items: rows.map((row) => this.toQuote(row)), total };
  }

  async findQuoteById(id: number): Promise<QuoteItem | null> {
    const row = await this.prisma.supplierQuote.findFirst({
      where: { id, deletedAt: null },
      include: QUOTE_INCLUDE,
    });
    return row ? this.toQuote(row) : null;
  }

  async createQuote(input: QuoteCreateInput & { amountUsd: number; exchangeRate: number }): Promise<QuoteItem> {
    const row = await this.prisma.supplierQuote.create({ data: input, include: QUOTE_INCLUDE });
    return this.toQuote(row);
  }

  async updateQuote(
    id: number,
    input: QuoteUpdateInput & { amountUsd?: number; exchangeRate?: number }
  ): Promise<QuoteItem | null> {
    const row = await this.prisma.supplierQuote
      .update({ where: { id, deletedAt: null }, data: input, include: QUOTE_INCLUDE })
      .catch(() => null);
    return row ? this.toQuote(row) : null;
  }

  async removeQuote(id: number): Promise<void> {
    await this.prisma.supplierQuote.update({ where: { id, deletedAt: null }, data: { deletedAt: new Date() } });
  }

  private toProduction(row: ProductionRow): ProductionItem {
    return {
      id: row.id,
      spuId: row.spuId,
      spuName: row.spu?.name ?? "",
      supplierId: row.supplierId,
      supplierName: row.supplier?.name ?? "",
      type: row.type,
      quantity: row.quantity,
      status: row.status,
      plannedAt: row.plannedAt,
      completedAt: row.completedAt,
      notes: row.notes,
      createdAt: row.createdAt,
    };
  }

  async listProductions(options: ProductionListOptions): Promise<{ items: ProductionItem[]; total: number }> {
    const where = baseWhere();
    if (options.spuId !== undefined) where.spuId = options.spuId;
    if (options.supplierId !== undefined) where.supplierId = options.supplierId;
    if (options.type) where.type = options.type;
    if (options.status) where.status = options.status;

    const [rows, total] = await Promise.all([
      this.prisma.productionBatch.findMany({
        where,
        include: PRODUCTION_INCLUDE,
        orderBy: { createdAt: "desc" },
        skip: (options.page - 1) * options.pageSize,
        take: options.pageSize,
      }),
      this.prisma.productionBatch.count({ where }),
    ]);
    return { items: rows.map((row) => this.toProduction(row)), total };
  }

  async createProduction(spuId: number, input: ProductionCreateInput): Promise<ProductionItem> {
    const row = await this.prisma.productionBatch.create({ data: { ...input, spuId }, include: PRODUCTION_INCLUDE });
    return this.toProduction(row);
  }

  async updateProduction(id: number, input: ProductionUpdateInput): Promise<ProductionItem | null> {
    const row = await this.prisma.productionBatch
      .update({ where: { id, deletedAt: null }, data: input, include: PRODUCTION_INCLUDE })
      .catch(() => null);
    return row ? this.toProduction(row) : null;
  }

  async removeProduction(id: number): Promise<void> {
    await this.prisma.productionBatch.update({ where: { id, deletedAt: null }, data: { deletedAt: new Date() } });
  }

  private toShipment(row: ShipmentRow): ShipmentItem {
    return {
      id: row.id,
      productLineId: row.productLineId,
      productLineName: row.productLine?.name ?? "",
      spuId: row.spuId,
      spuName: row.spu?.name ?? null,
      supplierId: row.supplierId,
      supplierName: row.supplier?.name ?? null,
      mode: row.mode,
      warehouse: row.warehouse,
      status: row.status,
      trackingRef: row.trackingRef,
      costCny: row.costCny === null ? null : Number(row.costCny),
      exchangeRate: row.exchangeRate === null ? null : Number(row.exchangeRate),
      costUsd: row.costUsd === null ? null : Number(row.costUsd),
      etaDate: row.etaDate,
      receivedAt: row.receivedAt,
      notes: row.notes,
      createdAt: row.createdAt,
    };
  }

  async listShipments(options: ShipmentListOptions): Promise<{ items: ShipmentItem[]; total: number }> {
    const where = baseWhere();
    if (options.productLineId !== undefined) where.productLineId = options.productLineId;
    if (options.spuId !== undefined) where.spuId = options.spuId;
    if (options.mode) where.mode = options.mode;
    if (options.warehouse) where.warehouse = options.warehouse;
    if (options.status) where.status = options.status;

    const [rows, total] = await Promise.all([
      this.prisma.shipmentOrder.findMany({
        where,
        include: SHIPMENT_INCLUDE,
        orderBy: { createdAt: "desc" },
        skip: (options.page - 1) * options.pageSize,
        take: options.pageSize,
      }),
      this.prisma.shipmentOrder.count({ where }),
    ]);
    return { items: rows.map((row) => this.toShipment(row)), total };
  }

  async findShipmentById(id: number): Promise<ShipmentItem | null> {
    const row = await this.prisma.shipmentOrder.findFirst({
      where: { id, deletedAt: null },
      include: SHIPMENT_INCLUDE,
    });
    return row ? this.toShipment(row) : null;
  }

  async createShipment(
    input: ShipmentCreateInput & { productLineId: number; costUsd?: number; exchangeRate?: number }
  ): Promise<ShipmentItem> {
    const row = await this.prisma.shipmentOrder.create({ data: input, include: SHIPMENT_INCLUDE });
    return this.toShipment(row);
  }

  async updateShipment(
    id: number,
    input: ShipmentUpdateInput & { costUsd?: number; exchangeRate?: number }
  ): Promise<ShipmentItem | null> {
    const row = await this.prisma.shipmentOrder
      .update({ where: { id, deletedAt: null }, data: input, include: SHIPMENT_INCLUDE })
      .catch(() => null);
    return row ? this.toShipment(row) : null;
  }

  async removeShipment(id: number): Promise<void> {
    await this.prisma.shipmentOrder.update({ where: { id, deletedAt: null }, data: { deletedAt: new Date() } });
  }
}

const baseWhere = (): Record<string, unknown> => ({ deletedAt: null });
