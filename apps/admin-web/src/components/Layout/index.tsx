import { Layout as ArcoLayout, Menu, Breadcrumb } from "@arco-design/web-react";
import {
  IconHome,
  IconSettings,
  IconSafe,
  IconFile,
  IconEye,
  IconList,
  IconTool,
  IconCalendar,
  IconMenuFold,
  IconMenuUnfold,
} from "@arco-design/web-react/icon";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "../../store/auth";

const { Sider, Content } = ArcoLayout;

export interface SiderItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  permission?: string;
  children?: SiderItem[];
}

export const ADMIN_SIDER_ITEMS: SiderItem[] = [
  { key: "/home", label: "概览", icon: <IconHome /> },
  {
    key: "system",
    label: "系统管理",
    icon: <IconSettings />,
    children: [
      { key: "/users", label: "用户管理", permission: "system:user:read" },
      { key: "/roles", label: "角色与权限", permission: "system:role:read" },
      { key: "/permissions", label: "权限配置", permission: "system:permission:read" },
      { key: "/field-config", label: "字段配置", permission: "system:field:read" },
    ],
  },
  {
    key: "audit",
    label: "审计",
    icon: <IconSafe />,
    children: [{ key: "/audit-logs", label: "操作审计", permission: "system:audit:read" }],
  },
  {
    key: "recognition",
    label: "认可中心",
    icon: <IconEye />,
    children: [
      { key: "/recognition/badges", label: "徽章管理", permission: "recognition:badge:read" },
      { key: "/recognition/list", label: "认可管理", permission: "recognition:recognition:read" },
      { key: "/recognition/products", label: "商品管理", permission: "recognition:product:read" },
      { key: "/recognition/exchange", label: "兑换单管理", permission: "recognition:exchange:read" },
    ],
  },
];

export const OWL_SIDER_ITEMS: SiderItem[] = [
  { key: "/home", label: "工作台首页", icon: <IconEye /> },
  { key: "/orders", label: "订单管理", icon: <IconList /> },
  { key: "/products", label: "商品管理", icon: <IconFile /> },
  { key: "/settings", label: "系统设置", icon: <IconTool /> },
];

export const CRON_SIDER_ITEMS: SiderItem[] = [
  { key: "/home", label: "任务中心", icon: <IconHome /> },
  { key: "/tasks", label: "任务列表", icon: <IconCalendar /> },
  { key: "/logs", label: "执行日志", icon: <IconFile /> },
  { key: "/settings", label: "系统设置", icon: <IconTool /> },
];

interface LayoutProps {
  siderItems: SiderItem[];
  hidePermissionFilter?: boolean;
}

function filterByPermission(items: SiderItem[], permissions: Set<string>): SiderItem[] {
  return items
    .map((item) => {
      if (item.children) {
        const filteredChildren = filterByPermission(item.children, permissions);
        if (filteredChildren.length === 0) return null;
        return { ...item, children: filteredChildren };
      }
      if (item.permission && !permissions.has(item.permission)) return null;
      return item;
    })
    .filter(Boolean) as SiderItem[];
}

function findSelectedKey(pathname: string, items: SiderItem[]): string | null {
  for (const item of items) {
    if (item.children) {
      const child = findSelectedKey(pathname, item.children);
      if (child) return child;
    } else if (pathname.startsWith(item.key)) {
      return item.key;
    }
  }
  return null;
}

function findParentKey(selectedKey: string, items: SiderItem[]): string | undefined {
  for (const item of items) {
    if (item.children?.some((c) => c.key === selectedKey)) return item.key;
  }
  return undefined;
}

export function Layout({ siderItems, hidePermissionFilter }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const permissions = useAuthStore((s) => s.user?.permissions);

  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem("sider-collapsed");
    return saved ? JSON.parse(saved) : false;
  });

  const [openKeys, setOpenKeys] = useState<string[]>([]);

  useEffect(() => {
    localStorage.setItem("sider-collapsed", JSON.stringify(collapsed));
  }, [collapsed]);

  const visibleItems = useMemo(() => {
    if (hidePermissionFilter || !permissions) return siderItems;
    return filterByPermission(siderItems, new Set(permissions));
  }, [siderItems, permissions, hidePermissionFilter]);

  const selectedKey = findSelectedKey(location.pathname, visibleItems) ?? "/home";
  const parentKey = findParentKey(selectedKey, visibleItems);

  useEffect(() => {
    if (parentKey && !openKeys.includes(parentKey)) {
      setOpenKeys((prev) => [...prev, parentKey]);
    }
  }, [parentKey, openKeys]);

  const breadcrumbItems = [
    { key: "home", path: "/", label: "首页" },
    ...(parentKey
      ? [{ key: parentKey, path: "", label: visibleItems.find((i) => i.key === parentKey)?.label ?? "" }]
      : []),
    { key: "current", path: selectedKey, label: findLabel(selectedKey, visibleItems) ?? "" },
  ];

  const trigger = (
    <div className="flex h-12 cursor-pointer items-center justify-center border-t border-gray-100 hover:bg-gray-50">
      {collapsed ? <IconMenuUnfold /> : <IconMenuFold />}
    </div>
  );

  function renderMenuItems(items: SiderItem[]) {
    return items.map((item) => {
      if (item.children) {
        return (
          <Menu.SubMenu
            key={item.key}
            title={
              <span>
                {item.icon}
                <span>{item.label}</span>
              </span>
            }
          >
            {renderMenuItems(item.children)}
          </Menu.SubMenu>
        );
      }
      return (
        <Menu.Item key={item.key}>
          {item.icon}
          <span>{item.label}</span>
        </Menu.Item>
      );
    });
  }

  return (
    <ArcoLayout style={{ height: "calc(100vh - 66px)" }}>
      <Sider width={200} theme="light" collapsed={collapsed} onCollapse={setCollapsed} trigger={trigger} collapsible>
        <Menu
          theme="light"
          selectedKeys={[selectedKey]}
          openKeys={collapsed ? [] : openKeys}
          onClickSubMenu={(_key, openKeys) => setOpenKeys(openKeys)}
          onClickMenuItem={(key) => navigate(key)}
          style={{ width: "100%" }}
        >
          {renderMenuItems(visibleItems)}
        </Menu>
      </Sider>

      <Content className="flex flex-col overflow-auto bg-gray-50 p-3">
        <div className="flex-1 overflow-auto bg-white p-6">
          <div className="mb-4 border-b border-gray-100 pb-3">
            <Breadcrumb className="m-0">
              {breadcrumbItems.map((item, index) => (
                <Breadcrumb.Item key={item.key}>
                  {index < breadcrumbItems.length - 1 ? (
                    <span
                      className="cursor-pointer text-gray-400 hover:text-blue-600"
                      onClick={() => item.path && navigate(item.path)}
                    >
                      {item.label}
                    </span>
                  ) : (
                    <span className="text-gray-700">{item.label}</span>
                  )}
                </Breadcrumb.Item>
              ))}
            </Breadcrumb>
          </div>
          <Outlet />
        </div>
      </Content>
    </ArcoLayout>
  );
}

function findLabel(key: string, items: SiderItem[]): string | null {
  for (const item of items) {
    if (item.key === key) return item.label;
    if (item.children) {
      const found = findLabel(key, item.children);
      if (found) return found;
    }
  }
  return null;
}
