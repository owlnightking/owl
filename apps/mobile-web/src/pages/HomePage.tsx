import { Button, NavBar, Toast } from "@arco-design/mobile-react";
import { PROJECT_NAME } from "@owl/shared";
import { useAuthStore } from "../store/auth";

export function HomePage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await logout();
    Toast.info("已退出登录");
    window.location.href = "/m/home";
  };

  return (
    <div className="min-h-dvh bg-gray-100">
      <NavBar fixed title="Owl 移动端" />
      <div className="px-4 pt-16">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-lg font-semibold text-gray-800">{PROJECT_NAME}</p>
          <p className="mt-1 text-sm text-gray-500">当前用户：{user?.name}</p>
        </div>
        <div className="mt-4">
          <Button type="primary" onClick={handleLogout}>
            退出登录
          </Button>
        </div>
      </div>
    </div>
  );
}
