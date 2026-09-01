import { Layout as ArcoLayout, Menu, Avatar, Badge, Button, Dropdown, Message, Drawer } from "@arco-design/web-react";
import {
  IconNotification,
  IconPoweroff,
  IconUser,
  IconSettings,
  IconDesktop,
  IconClockCircle,
} from "@arco-design/web-react/icon";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuthStore } from "../../store/auth";

const { Header, Content } = ArcoLayout;

export interface AppModule {
  key: string;
  name: string;
  path: string;
  icon: React.ReactNode;
}

export const APP_MODULES: AppModule[] = [
  { key: "owl", name: "业务工作台", path: "/owl", icon: <IconDesktop /> },
  { key: "admin", name: "管理台", path: "/admin", icon: <IconSettings /> },
  { key: "cron", name: "定时任务", path: "/cron", icon: <IconClockCircle /> },
];

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [messageDrawerVisible, setMessageDrawerVisible] = useState(false);

  useEffect(() => {
    (window as any).__OWL_PORTAL__ = true;
  }, []);

  const currentApp = location.pathname.split("/")[1];

  const handleLogout = async () => {
    await logout();
    Message.success("已退出登录");
    window.location.href = "/api/auth/feishu/login?redirect=%2F";
  };

  const handleSwitchApp = (path: string) => {
    navigate(path);
  };

  return (
    <ArcoLayout className="h-screen">
      <Header
        data-portal-header="true"
        className="flex items-center justify-between bg-white px-6"
        style={{ height: 66, borderBottom: "1px solid #e5e7eb" }}
      >
        {/* 左侧 Logo */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 hover:opacity-80"
        >
          <IconSettings style={{ fontSize: 30, color: "#9ca3af" }} />
          <span className="text-lg font-semibold text-gray-800">Owl</span>
        </button>

        {/* 中间模块导航 - 仅在子应用页面显示 */}
        {currentApp && ["owl", "admin", "cron"].includes(currentApp) && (
          <nav className="flex items-center">
            {APP_MODULES.map((app) => (
              <button
                key={app.key}
                onClick={() => handleSwitchApp(app.path)}
                className={`flex items-center gap-1 px-5 text-sm transition-colors ${
                  currentApp === app.key
                    ? "bg-blue-500 text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
                style={{ height: 66 }}
              >
                {app.icon}
                <span>{app.name}</span>
              </button>
            ))}
          </nav>
        )}

        {/* 右侧消息和用户信息 */}
        <div className="flex items-center gap-4">
          <Badge count={0} dot>
            <Button
              type="text"
              shape="circle"
              onClick={() => setMessageDrawerVisible(true)}
            >
              <IconNotification style={{ fontSize: 18, color: "#9ca3af" }} />
            </Button>
          </Badge>

          <Dropdown
            droplist={
              <Menu>
                <Menu.Item key="profile">
                  <IconUser className="mr-2" />
                  个人中心
                </Menu.Item>
                <Menu.Item key="logout" onClick={handleLogout}>
                  <IconPoweroff className="mr-2" />
                  退出登录
                </Menu.Item>
              </Menu>
            }
          >
            <div className="flex cursor-pointer items-center gap-2">
              <Avatar size={32}>{user?.name?.[0] ?? "U"}</Avatar>
              <span className="text-sm text-gray-600">{user?.name ?? "用户"}</span>
            </div>
          </Dropdown>
        </div>
      </Header>

      <Content className="h-[calc(100vh-66px)]">
        <Outlet />
      </Content>

      <Drawer
        title="消息通知"
        visible={messageDrawerVisible}
        onCancel={() => setMessageDrawerVisible(false)}
        width={400}
      >
        <div className="text-center text-gray-400">暂无消息</div>
      </Drawer>
    </ArcoLayout>
  );
}
