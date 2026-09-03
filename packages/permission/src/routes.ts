export interface RouteConfig {
  path: string;
  name: string;
  permission: string;
}

export interface AppRoutesConfig {
  app: string;
  name: string;
  icon?: string;
  routes: RouteConfig[];
}

export const APP_ROUTES: AppRoutesConfig[] = [
  {
    app: "admin",
    name: "管理后台",
    icon: "IconSettings",
    routes: [
      { path: "/home", name: "概览", permission: "admin:home:view" },
      { path: "/users", name: "用户管理", permission: "admin:users:view" },
      { path: "/roles", name: "角色与权限", permission: "admin:roles:view" },
      { path: "/permissions", name: "权限配置", permission: "admin:permissions:view" },
      { path: "/audit-logs", name: "操作审计", permission: "admin:audit:view" },
    ],
  },
  {
    app: "owl",
    name: "业务前台",
    icon: "IconHome",
    routes: [{ path: "/home", name: "工作台首页", permission: "owl:home:view" }],
  },
  {
    app: "cron",
    name: "定时任务",
    icon: "IconClock",
    routes: [{ path: "/home", name: "任务中心", permission: "cron:home:view" }],
  },
];

export function getPermissionCodes(): string[] {
  return APP_ROUTES.flatMap((app) => app.routes.map((r) => r.permission));
}

export function getRouteName(app: string, path: string): string | undefined {
  const appConfig = APP_ROUTES.find((a) => a.app === app);
  return appConfig?.routes.find((r) => r.path === path)?.name;
}

export function getAppConfig(app: string): AppRoutesConfig | undefined {
  return APP_ROUTES.find((a) => a.app === app);
}

export function getAppName(app: string): string {
  return getAppConfig(app)?.name ?? app;
}
