import { Button, Layout as ArcoLayout, Menu, Message } from "@arco-design/web-react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { PROJECT_NAME } from "@owl/shared";
import { qiankunWindow } from "vite-plugin-qiankun/dist/helper";
import { useAuthStore } from "../store/auth";

const { Sider, Header, Content } = ArcoLayout;

const MENU_ITEMS = [
  { key: "/home", label: "概览" },
  { key: "/users", label: "用户管理" },
  { key: "/roles", label: "角色与权限" },
  { key: "/permissions", label: "权限配置" },
  { key: "/audit-logs", label: "操作审计" },
];

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const isQiankun = qiankunWindow.__POWERED_BY_QIANKUN__;

  const selectedKey = MENU_ITEMS.find((item) => location.pathname.startsWith(item.key))?.key ?? "/home";

  const handleLogout = async () => {
    await logout();
    Message.success("已退出登录");
    window.location.href = "/api/auth/feishu/login?redirect=%2F";
  };

  const handleBack = () => {
    window.parent.postMessage({ type: "qiankun:navigate", path: "/" }, "*");
    window.location.href = "/";
  };

  return (
    <ArcoLayout className="h-screen">
      <Sider width={200} theme="dark">
        <div className="flex h-14 items-center justify-center text-sm font-semibold text-white">
          {PROJECT_NAME} 管理台
        </div>
        <Menu
          theme="dark"
          selectedKeys={[selectedKey]}
          onClickMenuItem={(key) => navigate(key)}
          style={{ width: "100%" }}
        >
          {MENU_ITEMS.map((item) => (
            <Menu.Item key={item.key}>{item.label}</Menu.Item>
          ))}
        </Menu>
      </Sider>
      <ArcoLayout>
        <Header className="flex items-center justify-between border-b border-gray-100 bg-white px-6">
          <div className="flex items-center gap-4">
            <Button size="small" onClick={handleBack}>
              返回主页
            </Button>
            <span className="text-sm text-gray-500">欢迎，{user?.name ?? "用户"}</span>
          </div>
          <Button size="small" onClick={handleLogout}>
            退出登录
          </Button>
        </Header>
        <Content className="overflow-auto bg-gray-50 p-6">
          <Outlet />
        </Content>
      </ArcoLayout>
    </ArcoLayout>
  );
}
