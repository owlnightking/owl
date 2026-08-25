import { Navigate, Route, Routes } from "react-router-dom";
import { PROJECT_NAME } from "@owl/shared";
import { qiankunWindow } from "vite-plugin-qiankun/dist/helper";
import { AuthGuard } from "./components/AuthGuard";
import { Layout } from "./components/Layout";
import { UsersPage } from "./pages/UsersPage";
import { RolesPage } from "./pages/RolesPage";
import { PermissionsPage } from "./pages/PermissionsPage";
import { AuditLogsPage } from "./pages/AuditLogsPage";

function HomePage() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-800">{PROJECT_NAME} · 管理台</h1>
        <p className="mt-2 text-sm text-gray-500">系统管理入口：用户、角色、操作审计</p>
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route element={<Layout />}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/roles" element={<RolesPage />} />
        <Route path="/permissions" element={<PermissionsPage />} />
        <Route path="/audit-logs" element={<AuditLogsPage />} />
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
