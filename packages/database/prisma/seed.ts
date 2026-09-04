import { PrismaClient } from "../src/generated";

const prisma = new PrismaClient();

const PERMISSIONS = [
  { code: "user:read", name: "查看用户", resource: "user", action: "read" },
  { code: "user:write", name: "管理用户", resource: "user", action: "write" },
  { code: "role:read", name: "查看角色", resource: "role", action: "read" },
  { code: "role:write", name: "管理角色", resource: "role", action: "write" },
  { code: "project:read", name: "查看项目", resource: "project", action: "read" },
  { code: "project:write", name: "管理项目", resource: "project", action: "write" },
  { code: "system-config:read", name: "查看系统配置", resource: "system-config", action: "read" },
  { code: "system-config:write", name: "管理系统配置", resource: "system-config", action: "write" },
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: PERMISSIONS.map((p) => p.code),
  business_user: ["user:read", "role:read", "project:read", "project:write"],
  reader: ["user:read", "role:read", "project:read"],
  member: ["user:read", "project:read"],
};

async function seed() {
  const roles: Record<string, string> = {};

  for (const [code, name, isSystem, description] of [
    ["admin", "系统管理员", true, "系统内置管理员角色"],
    ["business_user", "业务用户", true, "业务操作用户，可读写业务数据"],
    ["reader", "只读用户", true, "只读用户，仅可查看"],
    ["member", "普通成员", true, "系统内置普通成员角色"],
  ] as const) {
    const role = await prisma.role.upsert({
      where: { code },
      update: { name, isSystem, description },
      create: { code, name, isSystem, description },
    });
    roles[code] = role.id;
  }

  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: { name: perm.name, resource: perm.resource, action: perm.action },
      create: perm,
    });
  }

  const allPermissions = await prisma.permission.findMany();
  const permissionByCode = new Map(allPermissions.map((p) => [p.code, p.id]));

  for (const [roleCode, permCodes] of Object.entries(ROLE_PERMISSIONS)) {
    const roleId = roles[roleCode];
    if (!roleId) {
      continue;
    }
    const permIds = permCodes.map((code) => permissionByCode.get(code)).filter((id): id is string => Boolean(id));
    await prisma.rolePermission.createMany({
      data: permIds.map((permissionId) => ({ roleId, permissionId })),
      skipDuplicates: true,
    });
  }

  console.log("seed: roles & permissions done");
}

seed()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
