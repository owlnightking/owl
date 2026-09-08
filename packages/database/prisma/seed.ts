import { PrismaClient } from "../src/generated";

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

const PERMISSIONS = [
  { code: "user:read", name: "查看用户", resource: "user", action: "read" },
  { code: "user:write", name: "管理用户", resource: "user", action: "write" },
  { code: "role:read", name: "查看角色", resource: "role", action: "read" },
  { code: "role:write", name: "管理角色", resource: "role", action: "write" },
  { code: "project:read", name: "查看项目", resource: "project", action: "read" },
  { code: "project:write", name: "管理项目", resource: "project", action: "write" },
  { code: "system-config:read", name: "查看系统配置", resource: "system-config", action: "read" },
  { code: "system-config:write", name: "管理系统配置", resource: "system-config", action: "write" },
  { code: "recognition:badge:read", name: "查看徽章", resource: "recognition:badge", action: "read" },
  { code: "recognition:badge:write", name: "管理徽章", resource: "recognition:badge", action: "write" },
  { code: "recognition:recognition:read", name: "查看认可", resource: "recognition:recognition", action: "read" },
  { code: "recognition:recognition:write", name: "管理认可", resource: "recognition:recognition", action: "write" },
  { code: "recognition:recognition:approve", name: "审批认可", resource: "recognition:recognition", action: "approve" },
  { code: "recognition:recognition:create", name: "发起认可", resource: "recognition:recognition", action: "create" },
  { code: "recognition:recognition:like", name: "点赞认可", resource: "recognition:recognition", action: "like" },
  { code: "recognition:product:read", name: "查看商品", resource: "recognition:product", action: "read" },
  { code: "recognition:product:write", name: "管理商品", resource: "recognition:product", action: "write" },
  { code: "recognition:exchange:read", name: "查看兑换单", resource: "recognition:exchange", action: "read" },
  { code: "recognition:exchange:write", name: "管理兑换单", resource: "recognition:exchange", action: "write" },
  { code: "recognition:exchange:approve", name: "审批兑换单", resource: "recognition:exchange", action: "approve" },
  { code: "recognition:exchange:create", name: "发起兑换", resource: "recognition:exchange", action: "create" },
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: PERMISSIONS.map((p) => p.code),
  business_user: [
    "user:read",
    "role:read",
    "project:read",
    "project:write",
    "recognition:badge:read",
    "recognition:recognition:read",
    "recognition:recognition:create",
    "recognition:recognition:like",
    "recognition:product:read",
    "recognition:exchange:read",
    "recognition:exchange:create",
  ],
  reader: [
    "user:read",
    "role:read",
    "project:read",
    "recognition:badge:read",
    "recognition:recognition:read",
    "recognition:product:read",
    "recognition:exchange:read",
  ],
  member: [
    "user:read",
    "project:read",
    "recognition:badge:read",
    "recognition:recognition:read",
    "recognition:recognition:create",
    "recognition:recognition:like",
    "recognition:product:read",
    "recognition:exchange:create",
  ],
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
    await prisma.badge.upsert({
      where: { id: badge.name },
      update: badge,
      create: { id: badge.name, ...badge },
    });
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
    await prisma.product.upsert({
      where: { id: product.name },
      update: product,
      create: { id: product.name, ...product },
    });
  }
  console.log("seed: products done");
}

seed()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
