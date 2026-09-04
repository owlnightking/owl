import { Layout as ArcoLayout, Menu, Breadcrumb } from "@arco-design/web-react";
import {
  IconHome,
  IconEye,
  IconList,
  IconTool,
  IconCalendar,
  IconFile,
  IconMenuFold,
  IconMenuUnfold,
} from "@arco-design/web-react/icon";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

const { Sider, Content } = ArcoLayout;

export interface SiderItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
}

export const OWL_SIDER_ITEMS: SiderItem[] = [
  { key: "/workbench", label: "工作台", icon: <IconHome /> },
  { key: "/ipd", label: "IPD", icon: <IconEye /> },
  { key: "/gtm", label: "GTM", icon: <IconList /> },
  { key: "/isc", label: "ISC", icon: <IconFile /> },
  { key: "/voc", label: "VOC", icon: <IconTool /> },
];

export const CRON_SIDER_ITEMS: SiderItem[] = [
  { key: "/home", label: "任务中心", icon: <IconHome /> },
  { key: "/tasks", label: "任务列表", icon: <IconCalendar /> },
  { key: "/logs", label: "执行日志", icon: <IconFile /> },
  { key: "/settings", label: "系统设置", icon: <IconTool /> },
];

interface LayoutProps {
  siderItems: SiderItem[];
}

export function Layout({ siderItems }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem("sider-collapsed");
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem("sider-collapsed", JSON.stringify(collapsed));
  }, [collapsed]);

  const selectedKey = siderItems.find((item) => location.pathname.startsWith(item.key))?.key ?? "/home";
  const selectedItem = siderItems.find((item) => item.key === selectedKey);

  const breadcrumbItems = [
    { key: "home", path: "/", label: "首页" },
    ...(selectedItem ? [{ key: "current", path: selectedItem.key, label: selectedItem.label }] : []),
  ];

  const trigger = (
    <div className="flex h-12 cursor-pointer items-center justify-center border-t border-gray-100 hover:bg-gray-50">
      {collapsed ? <IconMenuUnfold /> : <IconMenuFold />}
    </div>
  );

  return (
    <ArcoLayout style={{ height: "calc(100vh - 66px)" }}>
      <Sider width={200} theme="light" collapsed={collapsed} onCollapse={setCollapsed} trigger={trigger} collapsible>
        <Menu
          theme="light"
          selectedKeys={[selectedKey]}
          onClickMenuItem={(key) => navigate(key)}
          style={{ width: "100%" }}
        >
          {siderItems.map((item) => (
            <Menu.Item key={item.key}>
              {item.icon}
              <span>{item.label}</span>
            </Menu.Item>
          ))}
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
                      onClick={() => navigate(item.path)}
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
