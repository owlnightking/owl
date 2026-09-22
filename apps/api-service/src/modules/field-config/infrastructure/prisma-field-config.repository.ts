import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CLIENT } from "@owl/database/provider";
import type { Prisma, PrismaClient } from "@owl/database";
import type {
  FieldConfigItem,
  FieldConfigQuery,
  FieldConfigRepositoryPort,
  FieldConfigUpdateInput,
  FieldConfigUpsertInput,
} from "../domain/field-config.ports";

@Injectable()
export class PrismaFieldConfigRepository implements FieldConfigRepositoryPort {
  constructor(@Inject(DATABASE_CLIENT) private readonly prisma: PrismaClient) {}

  private toItem(raw: {
    id: number;
    category: string;
    module: string;
    label: string;
    options: Prisma.JsonValue;
    value: string | null;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): FieldConfigItem {
    return {
      id: raw.id,
      category: raw.category,
      module: raw.module,
      label: raw.label,
      options: raw.options,
      value: raw.value,
      description: raw.description,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }

  async list(query: FieldConfigQuery): Promise<{ items: FieldConfigItem[]; total: number }> {
    const where = {
      deletedAt: null,
      category: query.category,
      ...(query.keyword
        ? { OR: [{ module: { contains: query.keyword } }, { label: { contains: query.keyword } }] }
        : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.fieldConfig.findMany({
        where,
        orderBy: { module: "asc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.fieldConfig.count({ where }),
    ]);
    return { items: rows.map((row) => this.toItem(row)), total };
  }

  async findById(id: number): Promise<FieldConfigItem | null> {
    const row = await this.prisma.fieldConfig.findUnique({
      where: { id, deletedAt: null },
    });
    return row ? this.toItem(row) : null;
  }

  async findByCategory(category: string): Promise<FieldConfigItem[]> {
    const rows = await this.prisma.fieldConfig.findMany({
      where: { category, deletedAt: null },
      orderBy: { module: "asc" },
    });
    return rows.map((r) => this.toItem(r));
  }

  async findByCategoryAndModule(category: string, module: string): Promise<FieldConfigItem | null> {
    const row = await this.prisma.fieldConfig.findUnique({
      where: { category_module: { category, module }, deletedAt: null },
    });
    return row ? this.toItem(row) : null;
  }

  async upsert(data: FieldConfigUpsertInput): Promise<FieldConfigItem> {
    const row = await this.prisma.fieldConfig.upsert({
      where: { category_module: { category: data.category, module: data.module } },
      create: {
        category: data.category,
        module: data.module,
        label: data.label,
        options: data.options as Prisma.InputJsonValue,
        value: data.value,
        description: data.description,
      },
      update: {
        label: data.label,
        options: data.options as Prisma.InputJsonValue,
        value: data.value,
        description: data.description,
        deletedAt: null,
      },
    });
    return this.toItem(row);
  }

  async updateById(id: number, data: FieldConfigUpdateInput): Promise<FieldConfigItem> {
    const row = await this.prisma.fieldConfig.update({
      where: { id, deletedAt: null },
      data: {
        label: data.label,
        options: data.options as Prisma.InputJsonValue,
        value: data.value,
        description: data.description,
      },
    });
    return this.toItem(row);
  }

  async deleteById(id: number): Promise<void> {
    await this.prisma.fieldConfig.update({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }
}
