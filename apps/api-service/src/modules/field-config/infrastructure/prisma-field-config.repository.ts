import { Injectable } from "@nestjs/common";
import { PrismaClient, type Prisma } from "@owl/database";
import type { FieldConfigRepositoryPort, FieldConfigItem } from "../domain/field-config.ports";

@Injectable()
export class PrismaFieldConfigRepository implements FieldConfigRepositoryPort {
  constructor(private readonly prisma: PrismaClient) {}

  private toItem(raw: {
    id: string;
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

  async findByCategory(category: string): Promise<FieldConfigItem[]> {
    const rows = await this.prisma.fieldConfig.findMany({
      where: { category },
      orderBy: { module: "asc" },
    });
    return rows.map((r) => this.toItem(r));
  }

  async findByCategoryAndModule(category: string, module: string): Promise<FieldConfigItem | null> {
    const row = await this.prisma.fieldConfig.findUnique({
      where: { category_module: { category, module } },
    });
    return row ? this.toItem(row) : null;
  }

  async upsert(data: {
    category: string;
    module: string;
    label: string;
    options?: unknown;
    value?: string;
    description?: string;
  }): Promise<FieldConfigItem> {
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
      },
    });
    return this.toItem(row);
  }

  async deleteByKey(category: string, module: string): Promise<void> {
    await this.prisma.fieldConfig.delete({
      where: { category_module: { category, module } },
    });
  }
}
