/**
 * 权限注册表 —— 全项目权限码与页面树的唯一事实源。
 *
 * 结构：应用 → 菜单/目录 → 页面 → Tab/按钮。
 * - 页面节点必须带 `path` 与 `code`，权限树里的页面由本文件同步进数据库。
 * - Tab/按钮节点可在此登记默认项；权限配置页也支持在页面下手工新增，保存后生效。
 * - 菜单/目录节点只用于分组展示，不写库、不参与授权。
 *
 * 命名：`<module>:<resource>:<action>`；action 收敛为 read / write / create / update /
 * delete / approve / like / view 等有限集合。
 */

export type PermissionNodeType = "directory" | "menu" | "page" | "tab" | "button";

export interface PermissionNodeDef {
  /** 菜单/目录可省略；页面、Tab、按钮必须填写 */
  code?: string;
  name: string;
  type: PermissionNodeType;
  /** 仅页面使用，相对于应用根路径 */
  path?: string;
  icon?: string;
  children?: PermissionNodeDef[];
}

export interface AppRoutesConfig {
  app: string;
  name: string;
  icon?: string;
  nodes: PermissionNodeDef[];
}

export interface PermissionDef {
  code: string;
  name: string;
  type: "page" | "tab" | "button";
  app: string;
  path?: string;
  parentCode?: string;
  sort: number;
}

export const APP_ROUTES: AppRoutesConfig[] = [
  {
    app: "admin",
    name: "管理后台",
    icon: "IconSettings",
    nodes: [
      { code: "admin:home:view", name: "首页", type: "page", path: "/home" },
      { code: "admin:sample-list:view", name: "样板页", type: "page", path: "/sample-list" },
      {
        name: "文档中心",
        type: "menu",
        children: [
          {
            code: "md-doc:md-doc:read",
            name: "文档列表",
            type: "page",
            path: "/md-docs",
            children: [{ code: "md-doc:md-doc:write", name: "新增/编辑文档", type: "button" }],
          },
        ],
      },
      {
        name: "认可中心",
        type: "menu",
        children: [
          {
            code: "recognition:badge:read",
            name: "徽章管理",
            type: "page",
            path: "/recognition/badges",
            children: [{ code: "recognition:badge:write", name: "新增/编辑徽章", type: "button" }],
          },
          {
            code: "recognition:recognition:read",
            name: "认可管理",
            type: "page",
            path: "/recognition/list",
            children: [
              { code: "recognition:recognition:create", name: "发起认可", type: "button" },
              { code: "recognition:recognition:approve", name: "审批认可", type: "button" },
              { code: "recognition:recognition:like", name: "点赞认可", type: "button" },
            ],
          },
          {
            code: "recognition:product:read",
            name: "商品管理",
            type: "page",
            path: "/recognition/products",
            children: [{ code: "recognition:product:write", name: "新增/编辑商品", type: "button" }],
          },
          {
            code: "recognition:exchange:read",
            name: "兑换单管理",
            type: "page",
            path: "/recognition/exchange",
            children: [
              { code: "recognition:exchange:create", name: "发起兑换", type: "button" },
              { code: "recognition:exchange:approve", name: "审批兑换单", type: "button" },
            ],
          },
        ],
      },
      {
        name: "系统管理",
        type: "menu",
        children: [
          {
            code: "system:user:read",
            name: "用户管理",
            type: "page",
            path: "/users",
            children: [
              { code: "system:user:write", name: "启停用用户", type: "button" },
              { code: "system:user:create", name: "新增用户", type: "button" },
              { code: "system:user:update", name: "编辑用户", type: "button" },
              { code: "system:user:delete", name: "删除用户", type: "button" },
            ],
          },
          {
            code: "system:user-group:read",
            name: "用户组",
            type: "page",
            path: "/user-groups",
            children: [
              { code: "system:user-group:create", name: "新增用户组", type: "button" },
              { code: "system:user-group:update", name: "编辑用户组", type: "button" },
              { code: "system:user-group:delete", name: "删除用户组", type: "button" },
              { code: "system:user-group:member", name: "管理组成员", type: "button" },
            ],
          },
          {
            code: "system:role:read",
            name: "角色与权限",
            type: "page",
            path: "/roles",
            children: [
              { code: "system:role:create", name: "新增角色", type: "button" },
              { code: "system:role:update", name: "编辑角色", type: "button" },
              { code: "system:role:delete", name: "删除角色", type: "button" },
              { code: "system:role:grant", name: "配置角色权限", type: "button" },
            ],
          },
          {
            code: "system:permission:read",
            name: "权限配置",
            type: "page",
            path: "/permissions",
            children: [
              { code: "system:permission:create", name: "新增权限节点", type: "button" },
              { code: "system:permission:update", name: "编辑权限节点", type: "button" },
              { code: "system:permission:delete", name: "删除权限节点", type: "button" },
              { code: "system:permission:sync", name: "同步权限树", type: "button" },
            ],
          },
          {
            code: "system:field:read",
            name: "字段配置",
            type: "page",
            path: "/field-config",
            children: [{ code: "system:field:write", name: "编辑字段配置", type: "button" }],
          },
          {
            code: "exchange-rate:rate:read",
            name: "汇率管理",
            type: "page",
            path: "/system/exchange-rates",
            children: [{ code: "exchange-rate:rate:write", name: "维护汇率", type: "button" }],
          },
        ],
      },
      {
        name: "日志中心",
        type: "menu",
        children: [
          { code: "system:audit:read", name: "操作日志", type: "page", path: "/audit-logs" },
          { code: "system:log:read", name: "系统日志", type: "page", path: "/system-logs" },
        ],
      },
    ],
  },
  {
    app: "owl",
    name: "业务前台",
    icon: "IconHome",
    nodes: [
      { code: "owl:workbench:view", name: "工作台", type: "page", path: "/workbench" },
      {
        name: "产品研发",
        type: "menu",
        children: [
          {
            code: "ipd:product-line:read",
            name: "产品线",
            type: "page",
            path: "/ipd",
            children: [
              { code: "ipd:product-line:write", name: "新增/编辑产品线", type: "button" },
              { code: "ipd:spu:write", name: "维护 SPU/SKU", type: "button" },
              { code: "ipd:stage:write", name: "推进研发阶段", type: "button" },
              { code: "ipd:decision:write", name: "投决记录", type: "button" },
            ],
          },
        ],
      },
      {
        name: "营销",
        type: "menu",
        children: [
          {
            code: "gtm:campaign:read",
            name: "GTM",
            type: "page",
            path: "/gtm",
            children: [
              { code: "gtm:campaign:write", name: "维护投放", type: "button" },
              { code: "gtm:kol:write", name: "维护 KOL", type: "button" },
              { code: "gtm:feedback:write", name: "维护社群反馈", type: "button" },
              { code: "gtm:presale:write", name: "维护预售", type: "button" },
            ],
          },
        ],
      },
      {
        name: "供应链",
        type: "menu",
        children: [
          {
            code: "isc:supplier:read",
            name: "ISC",
            type: "page",
            path: "/isc",
            children: [
              { code: "isc:supplier:write", name: "维护供应商", type: "button" },
              { code: "isc:quote:write", name: "维护报价", type: "button" },
              { code: "isc:production:write", name: "维护生产批次", type: "button" },
              { code: "isc:shipment:write", name: "维护头程物流", type: "button" },
            ],
          },
        ],
      },
      {
        name: "售后",
        type: "menu",
        children: [
          {
            code: "voc:ticket:read",
            name: "VOC",
            type: "page",
            path: "/voc",
            children: [{ code: "voc:ticket:write", name: "处理工单", type: "button" }],
          },
        ],
      },
    ],
  },
  {
    app: "cron",
    name: "定时任务",
    icon: "IconClock",
    nodes: [
      { code: "cron:home:view", name: "任务中心", type: "page", path: "/home" },
      { code: "cron:task:read", name: "任务列表", type: "page", path: "/tasks" },
      { code: "cron:log:read", name: "执行日志", type: "page", path: "/logs" },
      { code: "cron:setting:read", name: "系统设置", type: "page", path: "/settings" },
    ],
  },
];

function flattenNodes(
  nodes: PermissionNodeDef[],
  app: string,
  parentCode: string | undefined,
  out: PermissionDef[]
): void {
  for (const node of nodes) {
    if (node.code && node.type !== "directory" && node.type !== "menu") {
      out.push({
        code: node.code,
        name: node.name,
        type: node.type,
        app,
        path: node.path,
        parentCode,
        sort: out.length + 1,
      });
    }
    if (node.children?.length) {
      flattenNodes(node.children, app, node.code ?? parentCode, out);
    }
  }
}

export const PERMISSION_REGISTRY: PermissionDef[] = APP_ROUTES.flatMap((appConfig) => {
  const out: PermissionDef[] = [];
  flattenNodes(appConfig.nodes, appConfig.app, undefined, out);
  return out;
});

/** 超管标记：命中后跳过所有权限校验，不参与权限树展示 */
export const SUPER_PERMISSION_CODE = "system:super";

const REGISTRY_BY_CODE = new Map(PERMISSION_REGISTRY.map((item) => [item.code, item]));

export function getPermissionCodes(): string[] {
  return PERMISSION_REGISTRY.map((item) => item.code);
}

export function findPermissionDef(code: string): PermissionDef | undefined {
  return REGISTRY_BY_CODE.get(code);
}

export function getAppConfig(app: string): AppRoutesConfig | undefined {
  return APP_ROUTES.find((item) => item.app === app);
}

export function getAppName(app: string): string {
  return getAppConfig(app)?.name ?? app;
}

export function getRouteName(app: string, path: string): string | undefined {
  return PERMISSION_REGISTRY.find((item) => item.app === app && item.path === path)?.name;
}

/** 页面 → 默认按钮，供种子与权限树补齐使用 */
export function getPageChildPermissions(pageCode: string): PermissionDef[] {
  return PERMISSION_REGISTRY.filter((item) => item.parentCode === pageCode && item.type !== "page");
}

export function getPagePermission(app: string, path: string): PermissionDef | undefined {
  return PERMISSION_REGISTRY.find((item) => item.app === app && item.type === "page" && item.path === path);
}
