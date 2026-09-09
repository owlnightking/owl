import { Navigate, Route, Routes } from "react-router-dom";
import { PROJECT_NAME } from "@owl/shared";
import { qiankunWindow } from "vite-plugin-qiankun/dist/helper";
import { AuthGuard } from "./components/AuthGuard";
import { Layout, ADMIN_SIDER_ITEMS } from "./components/Layout";
import { UsersPage } from "./pages/UsersPage";
import { RolesPage } from "./pages/RolesPage";
import { PermissionsPage } from "./pages/PermissionsPage";
import { AuditLogsPage } from "./pages/AuditLogsPage";
import { FieldConfigPage } from "./pages/FieldConfigPage";
import { MockLoginPage } from "./pages/MockLoginPage";
import { BadgesPage } from "./pages/BadgesPage";
import { RecognitionsPage } from "./pages/RecognitionsPage";
import { ExchangeOrdersPage } from "./pages/ExchangeOrdersPage";
import { ProductsPage } from "./pages/ProductsPage";
import { MdDocsPage } from "./pages/MdDocsPage";
import { MdDocEditorPage } from "./pages/MdDocEditorPage";
import { MdDocPreviewPage } from "./pages/MdDocPreviewPage";

function HomePage() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-800">{PROJECT_NAME} · 管理后台</h1>
        <p className="mt-2 text-sm text-gray-500">系统管理入口：用户、角色、操作审计</p>
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/mock-login" element={<MockLoginPage />} />
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route element={<Layout siderItems={ADMIN_SIDER_ITEMS} />}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/roles" element={<RolesPage />} />
        <Route path="/permissions" element={<PermissionsPage />} />
        <Route path="/audit-logs" element={<AuditLogsPage />} />
        <Route path="/field-config" element={<FieldConfigPage />} />
        <Route path="/recognition/badges" element={<BadgesPage />} />
        <Route path="/recognition/list" element={<RecognitionsPage />} />
        <Route path="/recognition/exchange" element={<ExchangeOrdersPage />} />
        <Route path="/recognition/products" element={<ProductsPage />} />
        <Route path="/md-docs" element={<MdDocsPage />} />
        <Route path="/md-docs/new" element={<MdDocEditorPage />} />
        <Route path="/md-docs/:id/edit" element={<MdDocEditorPage />} />
        <Route path="/md-docs/:id/preview" element={<MdDocPreviewPage />} />
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
