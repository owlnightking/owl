import { Navigate, Route, Routes } from "react-router-dom";
import { PROJECT_NAME } from "@owl/shared";

function HomePage() {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-800">{PROJECT_NAME} · 定时任务中心</h1>
        <p className="mt-2 text-sm text-gray-500">Owl monorepo 骨架就绪（Phase 0）</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}

export default App;
