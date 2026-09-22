import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AuthGuard } from "./components/AuthGuard";
import { TabBar } from "./components/TabBar";
import { HomePage } from "./pages/HomePage";
import { MallPage } from "./pages/MallPage";
import { MessagePage } from "./pages/MessagePage";
import { ProfilePage } from "./pages/ProfilePage";
import { CreateRecognitionPage } from "./pages/CreateRecognitionPage";
import { FeedPage } from "./pages/FeedPage";
import { MdDocsPage } from "./pages/MdDocsPage";
import { MdDocEditorPage } from "./pages/MdDocEditorPage";
import { MdDocPreviewPage } from "./pages/MdDocPreviewPage";
import { SampleListPage } from "./pages/SampleListPage";

const TAB_BAR_PATHS = new Set(["/home", "/mall", "/docs", "/profile"]);

function App() {
  const location = useLocation();
  const showTabBar = TAB_BAR_PATHS.has(location.pathname);
  return (
    <AuthGuard>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/mall" element={<MallPage />} />
        <Route path="/docs" element={<MdDocsPage />} />
        <Route path="/message" element={<MessagePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/create" element={<CreateRecognitionPage />} />
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/md-docs/new" element={<MdDocEditorPage />} />
        <Route path="/md-docs/:id/edit" element={<MdDocEditorPage />} />
        <Route path="/md-docs/:id/preview" element={<MdDocPreviewPage />} />
        {/* 设计样张：新增移动端列表页的模板，内置示例数据（见 docs/frontend-rules.md 第五节） */}
        <Route path="/sample-list" element={<SampleListPage />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
      {showTabBar && <TabBar />}
    </AuthGuard>
  );
}

export default App;
