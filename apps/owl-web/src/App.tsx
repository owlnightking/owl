import { Navigate, Route, Routes } from "react-router-dom";
import { qiankunWindow } from "vite-plugin-qiankun/dist/helper";
import { AuthGuard } from "./components/AuthGuard";
import { Layout, OWL_SIDER_ITEMS } from "./components/Layout";

function ModulePage({ title }: { title: string }) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
        <p className="mt-2 text-sm text-gray-500">功能开发中...</p>
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/workbench" replace />} />
      <Route element={<Layout siderItems={OWL_SIDER_ITEMS} />}>
        <Route path="/workbench" element={<ModulePage title="工作台" />} />
        <Route path="/ipd" element={<ModulePage title="IPD" />} />
        <Route path="/gtm" element={<ModulePage title="GTM" />} />
        <Route path="/isc" element={<ModulePage title="ISC" />} />
        <Route path="/voc" element={<ModulePage title="VOC" />} />
      </Route>
      <Route path="*" element={<Navigate to="/workbench" replace />} />
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
