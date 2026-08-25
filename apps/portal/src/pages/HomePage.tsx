import { Card } from "@arco-design/web-react";
import { IconSettings, IconEye, IconClockCircle, IconApps } from "@arco-design/web-react/icon";
import { useNavigate } from "react-router-dom";
import { APP_ROUTES } from "@owl/permission";
import { useAuthStore } from "../store/auth";

const APP_ICONS: Record<string, React.ReactNode> = {
  admin: <IconSettings />,
  owl: <IconEye />,
  cron: <IconClockCircle />,
};

const APP_COLORS: Record<string, string> = {
  admin: "bg-blue-50 border-blue-200 hover:border-blue-400",
  owl: "bg-green-50 border-green-200 hover:border-green-400",
  cron: "bg-purple-50 border-purple-200 hover:border-purple-400",
};

export function HomePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await logout();
    window.location.href = "/api/auth/feishu/login?redirect=%2Fportal%2F";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <h1 className="text-xl font-semibold text-gray-800">Owl 工作台</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">欢迎，{user?.name ?? "用户"}</span>
            <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-700">
              退出登录
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="mb-8 text-lg font-medium text-gray-600">选择应用</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {APP_ROUTES.map((app) => (
            <Card
              key={app.app}
              className={`cursor-pointer border-2 transition-all ${APP_COLORS[app.app] ?? "bg-gray-50"}`}
              onClick={() => navigate(`/${app.app}`)}
              hoverable
            >
              <div className="flex items-center gap-4">
                <span className="text-4xl">{APP_ICONS[app.app] ?? <IconApps />}</span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{app.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">{app.routes.length} 个功能模块</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
