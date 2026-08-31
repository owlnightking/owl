import { Navigate, Route, Routes } from "react-router-dom";
import { PROJECT_NAME } from "@owl/shared";
import { qiankunWindow } from "vite-plugin-qiankun/dist/helper";
import { AuthGuard } from "./components/AuthGuard";

function HomePage() {
  const handleBack = () => {
    window.location.href = "/";
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <button onClick={handleBack} className="mb-4 text-sm text-blue-500 hover:text-blue-700">
          ← 返回首页
        </button>
        <h1 className="text-2xl font-semibold text-gray-800">{PROJECT_NAME} · 定时任务中心</h1>
        <p className="mt-2 text-sm text-gray-500">Phase 1：飞书 SSO 登录已接入</p>
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}

function App() {
  if (qiankunWindow.__POWERED_BY_QIANKUN__) {
    return <AppRoutes />;
  }

  return (
    <AuthGuard>
      <AppRoutes />
    </AuthGuard>
  );
}

export default App;
