import { PrismaClient } from "../src/generated";
import { PERMISSION_REGISTRY } from "@owl/permission";

const prisma = new PrismaClient();

const BADGE_REWARDS = {
  TEAM_COLLABORATION: { coin: 50, exp: 10 },
  INNOVATION: { coin: 80, exp: 20 },
  CUSTOMER_STAR: { coin: 60, exp: 15 },
  CODE_EXCELLENCE: { coin: 40, exp: 10 },
  KNOWLEDGE_SHARING: { coin: 30, exp: 8 },
  EXECUTION: { coin: 70, exp: 18 },
} as const;

const PRODUCT_PRICES = {
  NOTEBOOK: { price: 200, stock: 50 },
  THERMOS: { price: 350, stock: 30 },
  WIRELESS_CHARGER: { price: 500, stock: 20 },
  BLUETOOTH_EARPHONE: { price: 800, stock: 15 },
  MECHANICAL_KEYBOARD: { price: 1200, stock: 10 },
  MONITOR_STAND: { price: 600, stock: 25 },
} as const;

const SUPER_PERMISSION = { code: "system:super", name: "超级管理员", resource: "system", action: "super" };

function splitPermissionCode(code: string): { resource: string; action: string } {
  const parts = code.split(":");
  const action = parts.length > 1 ? parts[parts.length - 1] : "read";
  const resource = parts.length > 1 ? parts.slice(0, -1).join(":") : code;
  return { resource, action };
}

/** 只读页面码：action 为 read / view */
function isReadPage(code: string): boolean {
  const def = PERMISSION_REGISTRY.find((item) => item.code === code);
  if (!def || def.type !== "page") return false;
  return def.code.endsWith(":read") || def.code.endsWith(":view");
}

async function seed() {
  const roles: Record<string, number> = {};

  for (const [code, name, isSystem, description] of [
    ["admin", "系统管理员", true, "系统内置管理员角色"],
    ["super_admin", "超级管理员", true, "默认超级管理员角色，权限树全选"],
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

  const permissionByCode = new Map<string, number>();

  // 1. 权限树：页面与默认按钮来自 @owl/permission 注册表（source=route）
  for (const def of PERMISSION_REGISTRY) {
    const { resource, action } = splitPermissionCode(def.code);
    const parentId = def.parentCode ? permissionByCode.get(def.parentCode) : null;
    const permission = await prisma.permission.upsert({
      where: { code: def.code },
      update: {
        name: def.name,
        type: def.type,
        app: def.app,
        path: def.path ?? null,
        sort: def.sort,
        source: "route",
        resource,
        action,
        parentId: parentId ?? null,
        deletedAt: null,
      },
      create: {
        code: def.code,
        name: def.name,
        type: def.type,
        app: def.app,
        path: def.path ?? null,
        sort: def.sort,
        source: "route",
        resource,
        action,
        parentId: parentId ?? null,
      },
    });
    permissionByCode.set(def.code, permission.id);
  }

  // 2. 超管标记：不在权限树中展示，只授予 admin 角色
  const superPermission = await prisma.permission.upsert({
    where: { code: SUPER_PERMISSION.code },
    update: { ...SUPER_PERMISSION, type: "button", source: "system", deletedAt: null },
    create: { ...SUPER_PERMISSION, type: "button", source: "system" },
  });
  permissionByCode.set(SUPER_PERMISSION.code, superPermission.id);

  // 3. 清理注册表里已移除的路由节点（手工节点不动）
  await prisma.permission.updateMany({
    where: { source: "route", code: { notIn: [...PERMISSION_REGISTRY.map((item) => item.code)] } },
    data: { deletedAt: new Date() },
  });

  const readCodes = PERMISSION_REGISTRY.filter((item) => isReadPage(item.code)).map((item) => item.code);
  const owlWriteCodes = PERMISSION_REGISTRY.filter(
    (item) =>
      item.app === "owl" && item.type === "button" && (item.code.endsWith(":write") || item.code.endsWith(":create"))
  ).map((item) => item.code);
  const recognitionMemberCodes = [
    "recognition:recognition:create",
    "recognition:recognition:like",
    "recognition:exchange:create",
  ];

  const ROLE_PERMISSIONS: Record<string, string[]> = {
    admin: [...PERMISSION_REGISTRY.map((item) => item.code), SUPER_PERMISSION.code],
    // 默认超级管理员：权限树全选 + 超管 bypass
    super_admin: [...PERMISSION_REGISTRY.map((item) => item.code), SUPER_PERMISSION.code],
    business_user: [...readCodes, ...owlWriteCodes, ...recognitionMemberCodes],
    reader: readCodes,
    member: [...readCodes, "recognition:recognition:create", "recognition:recognition:like"],
  };

  for (const [roleCode, permCodes] of Object.entries(ROLE_PERMISSIONS)) {
    const roleId = roles[roleCode];
    if (!roleId) {
      continue;
    }
    const permIds = permCodes.map((code) => permissionByCode.get(code)).filter((id): id is number => Boolean(id));
    await prisma.$transaction(async (tx) => {
      await tx.rolePermission.updateMany({ where: { roleId }, data: { deletedAt: new Date() } });
      for (const permissionId of permIds) {
        await tx.rolePermission.upsert({
          where: { roleId_permissionId: { roleId, permissionId } },
          update: { deletedAt: null },
          create: { roleId, permissionId },
        });
      }
    });
  }

  // 4. 用户组：全员组（默认角色 member）+ 管理组（admin）
  const allStaff = await prisma.userGroup.upsert({
    where: { code: "all_staff" },
    update: { name: "全员", description: "所有员工默认加入", isSystem: true, deletedAt: null },
    create: { code: "all_staff", name: "全员", description: "所有员工默认加入", isSystem: true },
  });
  const adminGroup = await prisma.userGroup.upsert({
    where: { code: "admin_group" },
    update: { name: "管理组", description: "系统管理员用户组", isSystem: true, deletedAt: null },
    create: { code: "admin_group", name: "管理组", description: "系统管理员用户组", isSystem: true },
  });
  // 默认超级管理员用户组：绑定超级管理员角色（权限树全选）
  const superAdminGroup = await prisma.userGroup.upsert({
    where: { code: "super_admin_group" },
    update: { name: "超级管理员", description: "默认超级管理员用户组", isSystem: true, deletedAt: null },
    create: { code: "super_admin_group", name: "超级管理员", description: "默认超级管理员用户组", isSystem: true },
  });

  const groupRoles: Array<[number, string]> = [
    [allStaff.id, "member"],
    [adminGroup.id, "admin"],
    [superAdminGroup.id, "super_admin"],
  ];
  for (const [groupId, roleCode] of groupRoles) {
    const roleId = roles[roleCode];
    if (!roleId) continue;
    await prisma.roleGroup.upsert({
      where: { roleId_groupId: { roleId, groupId } },
      update: { deletedAt: null },
      create: { roleId, groupId },
    });
  }

  console.log("seed: roles, permissions & user groups done");

  const badges = [
    {
      name: "优秀团队协作",
      description: "展现卓越的团队协作能力",
      coinReward: BADGE_REWARDS.TEAM_COLLABORATION.coin,
      expReward: BADGE_REWARDS.TEAM_COLLABORATION.exp,
      enabled: true,
      sortOrder: 1,
    },
    {
      name: "创新先锋",
      description: "提出创新方案解决实际问题",
      coinReward: BADGE_REWARDS.INNOVATION.coin,
      expReward: BADGE_REWARDS.INNOVATION.exp,
      enabled: true,
      sortOrder: 2,
    },
    {
      name: "客户之星",
      description: "客户满意度显著提升",
      coinReward: BADGE_REWARDS.CUSTOMER_STAR.coin,
      expReward: BADGE_REWARDS.CUSTOMER_STAR.exp,
      enabled: true,
      sortOrder: 3,
    },
    {
      name: "代码标兵",
      description: "代码质量持续优秀",
      coinReward: BADGE_REWARDS.CODE_EXCELLENCE.coin,
      expReward: BADGE_REWARDS.CODE_EXCELLENCE.exp,
      enabled: true,
      sortOrder: 4,
    },
    {
      name: "知识分享",
      description: "主动分享知识帮助团队成长",
      coinReward: BADGE_REWARDS.KNOWLEDGE_SHARING.coin,
      expReward: BADGE_REWARDS.KNOWLEDGE_SHARING.exp,
      enabled: true,
      sortOrder: 5,
    },
    {
      name: "极致执行力",
      description: "高效高质量完成任务",
      coinReward: BADGE_REWARDS.EXECUTION.coin,
      expReward: BADGE_REWARDS.EXECUTION.exp,
      enabled: true,
      sortOrder: 6,
    },
  ];

  for (const badge of badges) {
    const existing = await prisma.badge.findFirst({ where: { name: badge.name } });
    if (existing) {
      await prisma.badge.update({ where: { id: existing.id }, data: badge });
    } else {
      await prisma.badge.create({ data: badge });
    }
  }
  console.log("seed: badges done");

  const products = [
    {
      name: "定制笔记本",
      description: "高品质皮面笔记本，可定制封面",
      price: PRODUCT_PRICES.NOTEBOOK.price,
      stock: PRODUCT_PRICES.NOTEBOOK.stock,
      enabled: true,
      sortOrder: 1,
    },
    {
      name: "品牌保温杯",
      description: "316不锈钢保温杯，容量500ml",
      price: PRODUCT_PRICES.THERMOS.price,
      stock: PRODUCT_PRICES.THERMOS.stock,
      enabled: true,
      sortOrder: 2,
    },
    {
      name: "无线充电器",
      description: "支持Qi协议，15W快充",
      price: PRODUCT_PRICES.WIRELESS_CHARGER.price,
      stock: PRODUCT_PRICES.WIRELESS_CHARGER.stock,
      enabled: true,
      sortOrder: 3,
    },
    {
      name: "蓝牙耳机",
      description: "降噪蓝牙耳机，续航30小时",
      price: PRODUCT_PRICES.BLUETOOTH_EARPHONE.price,
      stock: PRODUCT_PRICES.BLUETOOTH_EARPHONE.stock,
      enabled: true,
      sortOrder: 4,
    },
    {
      name: "机械键盘",
      description: "Cherry轴体，RGB背光",
      price: PRODUCT_PRICES.MECHANICAL_KEYBOARD.price,
      stock: PRODUCT_PRICES.MECHANICAL_KEYBOARD.stock,
      enabled: true,
      sortOrder: 5,
    },
    {
      name: "显示器支架",
      description: "铝合金材质，支持旋转升降",
      price: PRODUCT_PRICES.MONITOR_STAND.price,
      stock: PRODUCT_PRICES.MONITOR_STAND.stock,
      enabled: true,
      sortOrder: 6,
    },
  ];

  for (const product of products) {
    const existing = await prisma.product.findFirst({ where: { name: product.name } });
    if (existing) {
      await prisma.product.update({ where: { id: existing.id }, data: product });
    } else {
      await prisma.product.create({ data: product });
    }
  }
  console.log("seed: products done");

  // 所有既有用户加入全员组；第一个用户加入管理组，保证开发环境始终有超管
  const allUsers = await prisma.user.findMany({ orderBy: { id: "asc" } });
  for (const [index, user] of allUsers.entries()) {
    await prisma.userGroupMember.upsert({
      where: { groupId_userId: { groupId: allStaff.id, userId: user.id } },
      update: { deletedAt: null },
      create: { groupId: allStaff.id, userId: user.id },
    });
    if (index === 0) {
      await prisma.userGroupMember.upsert({
        where: { groupId_userId: { groupId: adminGroup.id, userId: user.id } },
        update: { deletedAt: null },
        create: { groupId: adminGroup.id, userId: user.id },
      });
      await prisma.userGroupMember.upsert({
        where: { groupId_userId: { groupId: superAdminGroup.id, userId: user.id } },
        update: { deletedAt: null },
        create: { groupId: superAdminGroup.id, userId: user.id },
      });
    }
  }
  console.log(`seed: assigned ${allUsers.length} users to groups`);

  // Create coin accounts and stamina accounts for all users
  const currentMonth = new Date().toISOString().slice(0, 7);
  for (const user of allUsers) {
    await prisma.coinAccount.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, balance: 0, totalEarned: 0, totalSpent: 0 },
    });
    await prisma.staminaAccount.upsert({
      where: { userId: user.id },
      update: { month: currentMonth },
      create: { userId: user.id, current: 50, maxStamina: 50, month: currentMonth },
    });
  }
  console.log("seed: coin & stamina accounts done");

  // 汇率定时抓取任务配置（cron-service: exchange-rate:sync）
  await prisma.schedulerConfig.upsert({
    where: { name: "exchange-rate-sync" },
    update: {},
    create: {
      name: "exchange-rate-sync",
      area: "exchange-rate",
      cron: "30 1 * * *",
      queue: "default",
      handler: "sync",
      tags: ["finance"],
      module: "exchange-rate",
      env: "all",
      retryPolicy: { maxRetries: 3 },
      timeoutMs: 30_000,
      enabled: true,
      description: "每日抓取 CNY→USD 汇率写入汇率表（人工校验后生效口径）",
    },
  });

  // 基线汇率（人工维护），保证首次使用折算可用；后续以 cron 抓取 + 人工校验为准
  const baselineRate = await prisma.exchangeRate.findFirst({
    where: { base: "CNY", quote: "USD", source: "manual", deletedAt: null },
  });
  if (!baselineRate) {
    await prisma.exchangeRate.create({
      data: {
        base: "CNY",
        quote: "USD",
        rate: 0.14,
        source: "manual",
        verified: true,
        effectiveDate: new Date("2026-01-01T00:00:00.000Z"),
      },
    });
  }
  console.log("seed: exchange rate scheduler & baseline done");
}

seed()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
