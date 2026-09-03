import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@owl/database";

const prisma = new PrismaClient();

interface SeedItem {
  category: string;
  module: string;
  label: string;
  fieldType: string;
  options: unknown;
  description: string;
}

async function main() {
  const jsonPath = resolve(import.meta.dirname, "seed-field-config.json");
  const seedData = JSON.parse(readFileSync(jsonPath, "utf-8")) as SeedItem[];

  for (const item of seedData) {
    await prisma.fieldConfig.upsert({
      where: { category_module: { category: item.category, module: item.module } },
      create: {
        category: item.category,
        module: item.module,
        label: item.label,
        fieldType: item.fieldType,
        options: item.options,
        description: item.description,
      },
      update: {
        label: item.label,
        fieldType: item.fieldType,
        options: item.options,
        description: item.description,
      },
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
