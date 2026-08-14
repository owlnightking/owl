import { Navigate, Route, Routes } from "react-router-dom";
import { PROJECT_NAME } from "@owl/shared";
import { AuthGuard } from "./components/AuthGuard";

function HomePage() {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-800">{PROJECT_NAME} · 业务工作台1</h1>
        <p className="mt-2 text-sm text-gray-500">Phase 1：飞书 SSO 登录已接入</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthGuard>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </AuthGuard>
  );
}

export default App;
