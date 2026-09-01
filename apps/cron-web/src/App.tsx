import { Navigate, Route, Routes } from "react-router-dom";
import { PROJECT_NAME } from "@owl/shared";
import { qiankunWindow } from "vite-plugin-qiankun/dist/helper";
import { AuthGuard } from "./components/AuthGuard";
import { Layout, CRON_SIDER_ITEMS } from "./components/Layout";

function HomePage() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-800">{PROJECT_NAME} · 定时任务中心</h1>
        <p className="mt-2 text-sm text-gray-500">定时任务调度与管理平台</p>
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route element={<Layout siderItems={CRON_SIDER_ITEMS} />}>
        <Route path="/home" element={<HomePage />} />
      </Route>
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
