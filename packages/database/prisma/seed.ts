import { PrismaClient } from "../src/generated";

const prisma = new PrismaClient();

async function seed() {
  await prisma.role.upsert({
    where: { code: "admin" },
    update: { name: "系统管理员", isSystem: true },
    create: { code: "admin", name: "系统管理员", isSystem: true, description: "系统内置管理员角色" },
  });

  await prisma.role.upsert({
    where: { code: "member" },
    update: { name: "普通成员" },
    create: { code: "member", name: "普通成员", isSystem: true, description: "系统内置普通成员角色" },
  });

  console.log("seed: roles done");
}

seed()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
