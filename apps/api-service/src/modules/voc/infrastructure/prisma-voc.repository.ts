import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CLIENT } from "@owl/database/provider";
import type { PrismaClient } from "@owl/database";
import type {
  VocRepositoryPort,
  VocTicketCreateInput,
  VocTicketItem,
  VocTicketListOptions,
  VocTicketUpdateInput,
} from "../domain/voc.ports";

type VocTicketRow = {
  id: number;
  source: string;
  productLineId: number | null;
  productLine?: { name: string } | null;
  spuId: number | null;
  spu?: { name: string } | null;
  title: string;
  content: string | null;
  category: string;
  status: string;
  handledNote: string | null;
  createdAt: Date;
};

const VOC_INCLUDE = {
  productLine: { select: { name: true } },
  spu: { select: { name: true } },
} as const;

@Injectable()
export class PrismaVocRepository implements VocRepositoryPort {
  constructor(@Inject(DATABASE_CLIENT) private readonly prisma: PrismaClient) {}

  private toItem(row: VocTicketRow): VocTicketItem {
    return {
      id: row.id,
      source: row.source,
      productLineId: row.productLineId,
      productLineName: row.productLine?.name ?? null,
      spuId: row.spuId,
      spuName: row.spu?.name ?? null,
      title: row.title,
      content: row.content,
      category: row.category,
      status: row.status,
      handledNote: row.handledNote,
      createdAt: row.createdAt,
    };
  }

  async list(options: VocTicketListOptions): Promise<{ items: VocTicketItem[]; total: number }> {
    const where: Record<string, unknown> = { deletedAt: null };
    if (options.source) where.source = options.source;
    if (options.category) where.category = options.category;
    if (options.status) where.status = options.status;
    if (options.productLineId !== undefined) where.productLineId = options.productLineId;
    if (options.spuId !== undefined) where.spuId = options.spuId;

    const [rows, total] = await Promise.all([
      this.prisma.vocTicket.findMany({
        where,
        include: VOC_INCLUDE,
        orderBy: { createdAt: "desc" },
        skip: (options.page - 1) * options.pageSize,
        take: options.pageSize,
      }),
      this.prisma.vocTicket.count({ where }),
    ]);
    return { items: rows.map((row) => this.toItem(row)), total };
  }

  async findById(id: number): Promise<VocTicketItem | null> {
    const row = await this.prisma.vocTicket.findFirst({ where: { id, deletedAt: null }, include: VOC_INCLUDE });
    return row ? this.toItem(row) : null;
  }

  async create(input: VocTicketCreateInput): Promise<VocTicketItem> {
    const row = await this.prisma.vocTicket.create({ data: input, include: VOC_INCLUDE });
    return this.toItem(row);
  }

  async update(id: number, input: VocTicketUpdateInput): Promise<VocTicketItem | null> {
    const row = await this.prisma.vocTicket
      .update({ where: { id, deletedAt: null }, data: input, include: VOC_INCLUDE })
      .catch(() => null);
    return row ? this.toItem(row) : null;
  }

  async remove(id: number): Promise<boolean> {
    const result = await this.prisma.vocTicket.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return result.count > 0;
  }
}
