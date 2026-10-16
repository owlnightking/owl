import { Navigate, Route, Routes } from "react-router-dom";
import { qiankunWindow } from "vite-plugin-qiankun/dist/helper";
import { AuthGuard } from "./components/AuthGuard";
import { Layout, OWL_SIDER_ITEMS } from "./components/Layout";
import { WorkbenchPage } from "./pages/workbench/WorkbenchPage";
import { ProductLinesPage } from "./pages/ipd/ProductLinesPage";
import { ProductLineDetailPage } from "./pages/ipd/ProductLineDetailPage";
import { GtmPage } from "./pages/gtm/GtmPage";
import { IscPage } from "./pages/isc/IscPage";
import { VocPage } from "./pages/voc/VocPage";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/workbench" replace />} />
      <Route element={<Layout siderItems={OWL_SIDER_ITEMS} />}>
        <Route path="/workbench" element={<WorkbenchPage />} />
        <Route path="/ipd" element={<ProductLinesPage />} />
        <Route path="/ipd/product-lines/:id" element={<ProductLineDetailPage />} />
        <Route path="/gtm" element={<GtmPage />} />
        <Route path="/isc" element={<IscPage />} />
        <Route path="/voc" element={<VocPage />} />
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
